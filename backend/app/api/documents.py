import hashlib
import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user, get_optional_current_user
from app.models.document import UploadedDocument
from app.models.medication import MedicationRecord
from app.models.user import User
from app.schemas.document import (
    ClinicalInsightsSchema,
    ClinicalMedicationSchema,
    DocumentRead,
    DocumentUploadResponse,
)
from app.services.document_analyzer.analyzer import analyze_medical_document
from app.services.insurance_rag.ingestion import chunk_document, embed_and_store_chunks, extract_pdf_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents"])
settings = get_settings()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


async def get_or_create_guest_user(db: AsyncSession) -> User:
    stmt = select(User).where(User.id == GUEST_USER_ID)
    res = await db.execute(stmt)
    guest = res.scalar_one_or_none()
    if not guest:
        guest = User(
            id=GUEST_USER_ID,
            email="guest@healthconnect.local",
            hashed_password="guest_no_login_needed",
            full_name="Guest User",
            is_active=True,
            is_superuser=False,
        )
        db.add(guest)
        try:
            await db.commit()
            await db.refresh(guest)
        except Exception:
            await db.rollback()
            res2 = await db.execute(stmt)
            guest = res2.scalar_one_or_none()
    return guest


def _map_doc_read(doc: UploadedDocument) -> DocumentRead:
    parsed_insights: Optional[ClinicalInsightsSchema] = None
    if doc.clinical_insights_json:
        try:
            data = json.loads(doc.clinical_insights_json)
            parsed_insights = ClinicalInsightsSchema.model_validate(data)
        except Exception as e:
            logger.warning("Failed to parse clinical_insights_json for doc %s: %s", doc.id, str(e))

    return DocumentRead(
        id=doc.id,
        user_id=doc.user_id,
        file_name=doc.file_name,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        document_type=doc.document_type,
        status=doc.status,
        patient_name=doc.patient_name,
        sha256_hash=doc.sha256_hash,
        ai_summary=doc.ai_summary,
        clinical_insights=parsed_insights,
        download_url=f"/api/documents/{doc.id}/download",
        error_message=doc.error_message,
        created_at=doc.created_at,
    )


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    document_type: Optional[str] = Form(None),
    docType: Optional[str] = Form(None),
    patient_name: Optional[str] = Form(None),
    patientName: Optional[str] = Form(None),
    sha256: Optional[str] = Form(None),
    sha256_hash: Optional[str] = Form(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Normalize inputs
    effective_doc_type = document_type or docType or "Prescription"
    effective_patient_name = patient_name or patientName

    # Validate MIME type
    allowed_types = [t.strip() for t in settings.allowed_doc_mime_types.split(",")]
    for text_type in ("text/plain", "text/markdown"):
        if text_type not in allowed_types:
            allowed_types.append(text_type)

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported media type '{file.content_type}'. Allowed types: {settings.allowed_doc_mime_types}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.max_upload_size_bytes} bytes.",
        )

    # Compute SHA-256 hash if not sent from client
    computed_sha256 = sha256 or sha256_hash
    if not computed_sha256:
        computed_sha256 = hashlib.sha256(file_bytes).hexdigest()

    user = current_user or await get_or_create_guest_user(db)

    doc_id = uuid.uuid4()
    file_ext = Path(file.filename or "doc").suffix
    safe_filename = f"{doc_id}{file_ext}"
    dest_path = UPLOAD_DIR / safe_filename

    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    total_pages = 1
    chunks_count = 0
    extracted_full_text = ""

    # 1. Text Extraction
    if file.content_type == "application/pdf":
        extraction = extract_pdf_text(file_bytes)
        if extraction.extraction_status != "FAILED" and extraction.text_by_page:
            total_pages = extraction.total_pages
            extracted_full_text = "\n\n".join(
                f"[Page {p}]: {t}" for p, t in sorted(extraction.text_by_page.items()) if t.strip()
            )
            chunks = chunk_document(extraction)
            chunks_count = len(chunks)
            await embed_and_store_chunks(chunks, doc_id, db)
    elif file.content_type in ("text/plain", "text/markdown"):
        extracted_full_text = file_bytes.decode("utf-8", errors="ignore")
        from app.services.insurance_rag.ingestion import ExtractionResult
        extraction = ExtractionResult(
            text_by_page={1: extracted_full_text},
            total_pages=1,
            extraction_status="SUCCESS",
            failed_pages=[],
        )
        chunks = chunk_document(extraction)
        chunks_count = len(chunks)
        await embed_and_store_chunks(chunks, doc_id, db)

    # 2. AI Clinical Document Analysis
    clinical_analysis = await analyze_medical_document(
        text=extracted_full_text,
        doc_type=effective_doc_type,
        user_patient_name=effective_patient_name,
    )

    resolved_patient_name = clinical_analysis.get("patient_name") or effective_patient_name
    ai_summary_text = clinical_analysis.get("summary")

    target_filename = file.filename or "unnamed_document"
    existing_stmt = (
        select(UploadedDocument)
        .where(
            UploadedDocument.user_id == user.id,
            UploadedDocument.deleted_at.is_(None),
            or_(
                UploadedDocument.sha256_hash == computed_sha256,
                (UploadedDocument.file_name == target_filename) & (UploadedDocument.file_size == len(file_bytes)),
            ),
        )
        .order_by(UploadedDocument.created_at.desc())
    )
    existing_res = await db.execute(existing_stmt)
    existing_doc = existing_res.scalar_one_or_none()

    if existing_doc:
        doc = existing_doc
        doc.file_name = target_filename
        doc.file_size = len(file_bytes)
        doc.mime_type = file.content_type or doc.mime_type
        doc.file_path_or_storage = str(dest_path)
        doc.document_type = effective_doc_type
        doc.patient_name = resolved_patient_name
        doc.sha256_hash = computed_sha256
        doc.ai_summary = ai_summary_text
        doc.clinical_insights_json = json.dumps(clinical_analysis)
        doc.status = "processed"
        doc.updated_at = datetime.now(timezone.utc)
    else:
        doc = UploadedDocument(
            id=doc_id,
            user_id=user.id,
            file_name=target_filename,
            file_size=len(file_bytes),
            mime_type=file.content_type or "application/octet-stream",
            file_path_or_storage=str(dest_path),
            document_type=effective_doc_type,
            patient_name=resolved_patient_name,
            sha256_hash=computed_sha256,
            ai_summary=ai_summary_text,
            clinical_insights_json=json.dumps(clinical_analysis),
            status="processed",
        )
        db.add(doc)

    await db.commit()
    await db.refresh(doc)

    parsed_insights: Optional[ClinicalInsightsSchema] = None
    try:
        parsed_insights = ClinicalInsightsSchema.model_validate(clinical_analysis)
    except Exception:
        pass

    return DocumentUploadResponse(
        id=doc.id,
        file_name=doc.file_name,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        document_type=doc.document_type,
        status=doc.status,
        message=f"Document '{doc.file_name}' uploaded, analyzed, and stored in vault ({chunks_count} clinical clauses extracted).",
        patient_name=doc.patient_name,
        sha256_hash=doc.sha256_hash,
        total_pages=total_pages,
        chunks_count=chunks_count,
        ai_summary=doc.ai_summary,
        clinical_insights=parsed_insights,
    )


@router.get("", response_model=list[DocumentRead])
async def list_documents(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all uploaded documents for the user or active guest session."""
    if current_user:
        stmt = (
            select(UploadedDocument)
            .where(
                or_(
                    UploadedDocument.user_id == current_user.id,
                    UploadedDocument.user_id == GUEST_USER_ID,
                ),
                UploadedDocument.deleted_at.is_(None),
            )
            .order_by(UploadedDocument.created_at.desc())
        )
    else:
        stmt = (
            select(UploadedDocument)
            .where(
                UploadedDocument.user_id == GUEST_USER_ID,
                UploadedDocument.deleted_at.is_(None),
            )
            .order_by(UploadedDocument.created_at.desc())
        )

    res = await db.execute(stmt)
    raw_docs = res.scalars().all()

    # Deduplicate documents by sha256_hash or (file_name + file_size), keeping the latest record
    deduped_docs: list[UploadedDocument] = []
    seen_keys: set[str] = set()
    for d in raw_docs:
        key = d.sha256_hash or f"{d.file_name}_{d.file_size}"
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped_docs.append(d)

    return [_map_doc_read(d) for d in deduped_docs]


@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(
    document_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(UploadedDocument).where(
        UploadedDocument.id == document_id,
        UploadedDocument.deleted_at.is_(None),
    )
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    return _map_doc_read(doc)


@router.get("/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Download or stream original document binary."""
    stmt = select(UploadedDocument).where(
        UploadedDocument.id == document_id,
        UploadedDocument.deleted_at.is_(None),
    )
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    file_path = Path(doc.file_path_or_storage)
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Underlying document file is missing.")

    return FileResponse(
        path=str(file_path),
        filename=doc.file_name,
        media_type=doc.mime_type,
    )


@router.post("/{document_id}/sync-medications")
async def sync_document_medications_to_tracker(
    document_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Automatically adds medications extracted by AI from this document
    into the user's active medications schedule.
    """
    stmt = select(UploadedDocument).where(
        UploadedDocument.id == document_id,
        UploadedDocument.deleted_at.is_(None),
    )
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    user = current_user or await get_or_create_guest_user(db)

    medications_data = []
    if doc.clinical_insights_json:
        try:
            parsed = json.loads(doc.clinical_insights_json)
            medications_data = parsed.get("medications", [])
        except Exception:
            medications_data = []

    if not medications_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No prescribed medications were extracted from this document to sync.",
        )

    added_records = []
    for m in medications_data:
        med_name = m.get("name") or "Prescribed Medication"
        dosage = m.get("dosage") or "As prescribed"
        frequency = m.get("frequency") or "Once daily"
        instructions = m.get("instructions") or "Take as directed"

        # Parse duration
        duration_val = None
        duration_str = m.get("duration", "")
        dur_match = re.search(r"(\d+)", duration_str)
        if dur_match:
            try:
                duration_val = int(dur_match.group(1))
            except Exception:
                duration_val = 30

        record = MedicationRecord(
            id=uuid.uuid4(),
            user_id=user.id,
            medicine_name=med_name,
            dosage=dosage,
            frequency=frequency,
            duration_days=duration_val,
            instructions=instructions,
            is_active=True,
            source_document_id=doc.id,
        )
        db.add(record)
        added_records.append({
            "id": str(record.id),
            "medicine_name": med_name,
            "dosage": dosage,
            "frequency": frequency,
        })

    await db.commit()

    return {
        "status": "success",
        "syncedCount": len(added_records),
        "documentName": doc.file_name,
        "medications": added_records,
        "message": f"Successfully synced {len(added_records)} prescribed medication(s) to your active schedule.",
    }


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(UploadedDocument).where(
        UploadedDocument.id == document_id,
        UploadedDocument.deleted_at.is_(None),
    )
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    doc.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return None
