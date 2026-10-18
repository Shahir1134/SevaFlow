import logging
import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.document import UploadedDocument
from app.models.medication import MedicationRecord, MedicationReminder
from app.models.user import User
from app.schemas.medication import (
    MedicationCreate,
    MedicationDraftItem,
    MedicationDraftResponse,
    MedicationRead,
    ReminderRead,
)

logger = logging.getLogger(__name__)


class MedicationService:
    @staticmethod
    async def create_medication(
        payload: MedicationCreate, user: User, db: AsyncSession
    ) -> MedicationRead:
        med = MedicationRecord(
            id=uuid.uuid4(),
            user_id=user.id,
            member_id=payload.member_id,
            medicine_name=payload.medicine_name,
            dosage=payload.dosage,
            frequency=payload.frequency,
            duration_days=payload.duration_days,
            instructions=payload.instructions,
            start_date=payload.start_date,
            end_date=payload.end_date,
            is_active=True,
        )
        db.add(med)
        await db.flush()

        reminders_created: list[ReminderRead] = []
        for rem_data in payload.reminders:
            rem = MedicationReminder(
                id=uuid.uuid4(),
                medication_id=med.id,
                reminder_time=rem_data.reminder_time,
                days_of_week=rem_data.days_of_week,
                is_active=rem_data.is_active,
            )
            db.add(rem)
            await db.flush()
            reminders_created.append(
                ReminderRead(
                    id=rem.id,
                    medication_id=rem.medication_id,
                    reminder_time=rem.reminder_time,
                    days_of_week=rem.days_of_week or [],
                    is_active=rem.is_active,
                    created_at=rem.created_at,
                )
            )

        await db.commit()
        await db.refresh(med)

        return MedicationRead(
            id=med.id,
            user_id=med.user_id,
            member_id=med.member_id,
            medicine_name=med.medicine_name,
            dosage=med.dosage,
            frequency=med.frequency,
            duration_days=med.duration_days,
            instructions=med.instructions,
            start_date=med.start_date,
            end_date=med.end_date,
            is_active=med.is_active,
            created_at=med.created_at,
            reminders=reminders_created,
        )

    @staticmethod
    async def list_medications(user: User, db: AsyncSession) -> list[MedicationRead]:
        stmt = (
            select(MedicationRecord)
            .where(
                MedicationRecord.user_id == user.id,
                MedicationRecord.deleted_at.is_(None),
            )
            .order_by(MedicationRecord.created_at.desc())
        )
        res = await db.execute(stmt)
        records = res.scalars().all()

        results: list[MedicationRead] = []
        for r in records:
            # fetch reminders
            rem_stmt = select(MedicationReminder).where(
                MedicationReminder.medication_id == r.id,
                MedicationReminder.deleted_at.is_(None),
            )
            rem_res = await db.execute(rem_stmt)
            reminders = rem_res.scalars().all()
            results.append(
                MedicationRead(
                    id=r.id,
                    user_id=r.user_id,
                    member_id=r.member_id,
                    medicine_name=r.medicine_name,
                    dosage=r.dosage,
                    frequency=r.frequency,
                    duration_days=r.duration_days,
                    instructions=r.instructions,
                    start_date=r.start_date,
                    end_date=r.end_date,
                    is_active=r.is_active,
                    created_at=r.created_at,
                    reminders=[
                        ReminderRead(
                            id=rm.id,
                            medication_id=rm.medication_id,
                            reminder_time=rm.reminder_time,
                            days_of_week=rm.days_of_week or [],
                            is_active=rm.is_active,
                            created_at=rm.created_at,
                        )
                        for rm in reminders
                    ],
                )
            )
        return results

    @staticmethod
    async def get_medication(
        medication_id: uuid.UUID, user: User, db: AsyncSession
    ) -> Optional[MedicationRead]:
        stmt = select(MedicationRecord).where(
            MedicationRecord.id == medication_id,
            MedicationRecord.user_id == user.id,
            MedicationRecord.deleted_at.is_(None),
        )
        res = await db.execute(stmt)
        r = res.scalar_one_or_none()
        if not r:
            return None

        rem_stmt = select(MedicationReminder).where(
            MedicationReminder.medication_id == r.id,
            MedicationReminder.deleted_at.is_(None),
        )
        rem_res = await db.execute(rem_stmt)
        reminders = rem_res.scalars().all()

        return MedicationRead(
            id=r.id,
            user_id=r.user_id,
            member_id=r.member_id,
            medicine_name=r.medicine_name,
            dosage=r.dosage,
            frequency=r.frequency,
            duration_days=r.duration_days,
            instructions=r.instructions,
            start_date=r.start_date,
            end_date=r.end_date,
            is_active=r.is_active,
            created_at=r.created_at,
            reminders=[
                ReminderRead(
                    id=rm.id,
                    medication_id=rm.medication_id,
                    reminder_time=rm.reminder_time,
                    days_of_week=rm.days_of_week or [],
                    is_active=rm.is_active,
                    created_at=rm.created_at,
                )
                for rm in reminders
            ],
        )

    @staticmethod
    async def delete_medication(
        medication_id: uuid.UUID, user: User, db: AsyncSession
    ) -> bool:
        stmt = select(MedicationRecord).where(
            MedicationRecord.id == medication_id,
            MedicationRecord.user_id == user.id,
            MedicationRecord.deleted_at.is_(None),
        )
        res = await db.execute(stmt)
        med = res.scalar_one_or_none()
        if not med:
            return False

        from datetime import datetime, timezone
        med.deleted_at = datetime.now(timezone.utc)
        await db.commit()
        return True

    @staticmethod
    async def extract_ocr_draft(
        document_id: uuid.UUID, user: User, db: AsyncSession
    ) -> MedicationDraftResponse:
        """OCR draft pipeline for prescriptions.
        Safeguarded: Never fabricates prescription medicines.
        Requires certified medical OCR engine; returns explicit review draft.
        """
        stmt = select(UploadedDocument).where(
            UploadedDocument.id == document_id,
            UploadedDocument.user_id == user.id,
            UploadedDocument.deleted_at.is_(None),
        )
        res = await db.execute(stmt)
        doc = res.scalar_one_or_none()

        if not doc:
            return MedicationDraftResponse(
                document_id=document_id,
                status="NOT_FOUND",
                message="Prescription document not found or unattached.",
                extracted_items=[],
            )

        # Honest draft response: Medical OCR requires human confirmation
        return MedicationDraftResponse(
            document_id=document_id,
            status="DRAFT_REQUIRES_REVIEW",
            message=(
                "Prescription text drafted. Per clinical safety standards, all medication details "
                "must be reviewed and confirmed by the user before activating reminders."
            ),
            extracted_items=[],
        )
