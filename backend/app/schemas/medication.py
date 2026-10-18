import uuid
from datetime import date, datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class ReminderCreate(BaseModel):
    reminder_time: str = Field(description="Time in HH:MM format, e.g. 08:30")
    days_of_week: list[str] = Field(default_factory=lambda: ["daily"])
    is_active: bool = True


class ReminderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    medication_id: uuid.UUID
    reminder_time: str
    days_of_week: list[str] = Field(default_factory=list)
    is_active: bool
    created_at: datetime


class MedicationCreate(BaseModel):
    member_id: Optional[uuid.UUID] = None
    medicine_name: str = Field(min_length=1, max_length=255)
    dosage: str = Field(min_length=1, max_length=100)
    frequency: str = Field(min_length=1, max_length=100)
    duration_days: Optional[int] = Field(default=None, ge=1)
    instructions: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reminders: list[ReminderCreate] = Field(default_factory=list)


class MedicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    member_id: Optional[uuid.UUID] = None
    medicine_name: str
    dosage: str
    frequency: str
    duration_days: Optional[int] = None
    instructions: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool
    created_at: datetime
    reminders: list[ReminderRead] = Field(default_factory=list)


class MedicationDraftItem(BaseModel):
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    confidence: float = 0.0
    needs_review: bool = True


class MedicationDraftResponse(BaseModel):
    document_id: uuid.UUID
    status: str
    message: str
    extracted_items: list[MedicationDraftItem] = Field(default_factory=list)
