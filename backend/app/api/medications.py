import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.schemas.medication import MedicationCreate, MedicationDraftResponse, MedicationRead
from app.services.medications.service import MedicationService

router = APIRouter(prefix="/medications", tags=["Medications"])


@router.post("", response_model=MedicationRead, status_code=status.HTTP_201_CREATED)
async def create_medication(
    payload: MedicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await MedicationService.create_medication(payload=payload, user=current_user, db=db)


@router.get("", response_model=list[MedicationRead])
async def list_medications(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user:
        return []
    return await MedicationService.list_medications(user=current_user, db=db)


@router.get("/{medication_id}", response_model=MedicationRead)
async def get_medication(
    medication_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    med = await MedicationService.get_medication(
        medication_id=medication_id, user=current_user, db=db
    )
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found.")
    return med


@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication(
    medication_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    success = await MedicationService.delete_medication(
        medication_id=medication_id, user=current_user, db=db
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found.")
    return None


@router.post("/ocr-draft", response_model=MedicationDraftResponse)
async def create_medication_draft_from_document(
    document_id: uuid.UUID = Query(..., description="ID of uploaded prescription document"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await MedicationService.extract_ocr_draft(
        document_id=document_id, user=current_user, db=db
    )
