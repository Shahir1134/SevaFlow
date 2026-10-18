import io
import logging
import uuid
from typing import Any, Optional
from pydantic import BaseModel, Field
import pdfplumber
from sqlalchemy.ext.asyncio import AsyncSession
from app.integrations.gemini import gemini_client
from app.models.document import DocumentChunk

logger = logging.getLogger(__name__)


class ExtractionResult(BaseModel):
    text_by_page: dict[int, str] = Field(default_factory=dict)
    total_pages: int = 0
    extraction_status: str = "FAILED"  # SUCCESS, PARTIAL, FAILED
    failed_pages: list[int] = Field(default_factory=list)
    error_message: Optional[str] = None


class ChunkData(BaseModel):
    chunk_index: int
    page_number: int
    source_text: str


def extract_pdf_text(file_bytes: bytes) -> ExtractionResult:
    """Extract text from PDF bytes page by page using pdfplumber.
    Returns ExtractionResult. If extraction fails, returns status='FAILED' with error.
    NEVER fakes extraction results.
    """
    if not file_bytes:
        return ExtractionResult(
            text_by_page={},
            total_pages=0,
            extraction_status="FAILED",
            failed_pages=[],
            error_message="Empty file bytes provided.",
        )

    text_by_page: dict[int, str] = {}
    failed_pages: list[int] = []

    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            total_pages = len(pdf.pages)
            if total_pages == 0:
                return ExtractionResult(
                    text_by_page={},
                    total_pages=0,
                    extraction_status="FAILED",
                    failed_pages=[],
                    error_message="PDF contains no readable pages.",
                )

            for page_idx, page in enumerate(pdf.pages):
                page_num = page_idx + 1
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text_by_page[page_num] = page_text.strip()
                    else:
                        text_by_page[page_num] = ""
                except Exception as page_err:
                    logger.warning("Failed to extract page %d: %s", page_num, str(page_err))
                    failed_pages.append(page_num)

            status = "SUCCESS" if not failed_pages else ("PARTIAL" if text_by_page else "FAILED")
            return ExtractionResult(
                text_by_page=text_by_page,
                total_pages=total_pages,
                extraction_status=status,
                failed_pages=failed_pages,
            )
    except Exception as e:
        logger.error("pdfplumber PDF extraction failed: %s", str(e))
        return ExtractionResult(
            text_by_page={},
            total_pages=0,
            extraction_status="FAILED",
            failed_pages=[],
            error_message=f"PDF extraction error: {str(e)}",
        )


def chunk_document(extraction: ExtractionResult, max_chars: int = 1000) -> list[ChunkData]:
    """Chunk document text at paragraph / clause boundaries, preserving page numbers."""
    if extraction.extraction_status == "FAILED" or not extraction.text_by_page:
        return []

    chunks: list[ChunkData] = []
    chunk_index = 0

    for page_num in sorted(extraction.text_by_page.keys()):
        raw_text = extraction.text_by_page[page_num]
        if not raw_text.strip():
            continue

        # Split on double linebreaks or paragraph boundaries
        paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
        for para in paragraphs:
            # If paragraph exceeds max_chars, split on sentence boundaries
            if len(para) <= max_chars:
                chunks.append(
                    ChunkData(
                        chunk_index=chunk_index,
                        page_number=page_num,
                        source_text=para,
                    )
                )
                chunk_index += 1
            else:
                lines = [l.strip() for l in para.split(". ") if l.strip()]
                buffer = ""
                for line in lines:
                    segment = line if line.endswith(".") else f"{line}."
                    if len(buffer) + len(segment) < max_chars:
                        buffer = f"{buffer} {segment}".strip()
                    else:
                        if buffer:
                            chunks.append(
                                ChunkData(
                                    chunk_index=chunk_index,
                                    page_number=page_num,
                                    source_text=buffer,
                                )
                            )
                            chunk_index += 1
                        buffer = segment
                if buffer:
                    chunks.append(
                        ChunkData(
                            chunk_index=chunk_index,
                            page_number=page_num,
                            source_text=buffer,
                        )
                    )
                    chunk_index += 1

    return chunks


async def embed_and_store_chunks(
    chunks: list[ChunkData], document_id: uuid.UUID, db: AsyncSession
) -> bool:
    """Compute embeddings via Gemini if available and store DocumentChunk records in the database.
    Always persists chunk texts to enable RAG lexical retrieval and grounded analysis.
    """
    if not chunks:
        return True

    for chunk in chunks:
        embedding = None
        if gemini_client.is_available:
            try:
                embedding = await gemini_client.embed_text(chunk.source_text)
            except Exception as e:
                logger.warning("Failed to generate embedding for chunk %d: %s", chunk.chunk_index, str(e))

        doc_chunk = DocumentChunk(
            id=uuid.uuid4(),
            document_id=document_id,
            chunk_index=chunk.chunk_index,
            page_number=chunk.page_number,
            source_text=chunk.source_text,
            embedding=embedding,
        )
        db.add(doc_chunk)

    await db.commit()
    return True
