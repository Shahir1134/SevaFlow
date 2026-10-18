import uuid
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class ClinicalMedicationSchema(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None


class ClinicalInsightsSchema(BaseModel):
    patient_name: Optional[str] = None
    patient_age: Optional[str] = None
    patient_gender: Optional[str] = None
    health_issue: Optional[str] = None
    symptoms: list[str] = Field(default_factory=list)
    medications: list[ClinicalMedicationSchema] = Field(default_factory=list)
    doctor_name: Optional[str] = None
    clinic_or_hospital: Optional[str] = None
    report_date: Optional[str] = None
    lab_findings: list[dict[str, Any]] = Field(default_factory=list)
    key_advice: list[str] = Field(default_factory=list)
    summary: Optional[str] = None


class DocumentUploadResponse(BaseModel):
    id: uuid.UUID
    file_name: str
    file_size: int
    mime_type: str
    document_type: str
    status: str
    message: str
    patient_name: Optional[str] = None
    sha256_hash: Optional[str] = None
    total_pages: Optional[int] = None
    chunks_count: Optional[int] = None
    ai_summary: Optional[str] = None
    clinical_insights: Optional[ClinicalInsightsSchema] = None


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    file_name: str
    file_size: int
    mime_type: str
    document_type: str
    status: str
    patient_name: Optional[str] = None
    sha256_hash: Optional[str] = None
    ai_summary: Optional[str] = None
    clinical_insights: Optional[ClinicalInsightsSchema] = None
    download_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
