from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field
from app.config import get_settings


class IntegrationStatus(str, Enum):
    CONFIGURED = "configured"
    CONNECTED = "connected"
    OPERATIONAL = "operational"
    DEGRADED = "degraded"
    UNAVAILABLE = "unavailable"
    REQUIRES_AUTHORISATION = "requires_authorisation"
    NOT_IMPLEMENTED = "not_implemented"


class IntegrationEntry(BaseModel):
    name: str
    status: IntegrationStatus
    provider: str
    required_credentials: list[str] = Field(default_factory=list)
    failure_behavior: str
    last_verified: Optional[datetime] = None
    notes: Optional[str] = None


class IntegrationRegistry:
    def __init__(self) -> None:
        self._entries: dict[str, IntegrationEntry] = {}
        self._initialize_defaults()

    def _initialize_defaults(self) -> None:
        settings = get_settings()

        # 1. Google Gemini AI Integration
        gemini_status = (
            IntegrationStatus.CONFIGURED
            if settings.is_ai_configured
            else IntegrationStatus.UNAVAILABLE
        )
        gemini_notes = (
            "API key detected. Ready for health probe."
            if settings.is_ai_configured
            else "GEMINI_API_KEY is not set or empty in environment. AI features return SERVICE_UNAVAILABLE."
        )
        self.register(
            IntegrationEntry(
                name="gemini",
                status=gemini_status,
                provider="Google Cloud (google-genai)",
                required_credentials=["GEMINI_API_KEY"],
                failure_behavior="Return HTTP 503 SERVICE_UNAVAILABLE; never fabricate responses.",
                last_verified=datetime.now(timezone.utc) if settings.is_ai_configured else None,
                notes=gemini_notes,
            )
        )

        # 2. Database Integration
        db_status = (
            IntegrationStatus.CONFIGURED
            if settings.is_db_configured
            else IntegrationStatus.UNAVAILABLE
        )
        db_notes = (
            "Database URL configured."
            if settings.is_db_configured
            else "DATABASE_URL is missing. DB operations return DATABASE_UNAVAILABLE."
        )
        self.register(
            IntegrationEntry(
                name="database",
                status=db_status,
                provider="PostgreSQL + asyncpg (pgvector)",
                required_credentials=["DATABASE_URL"],
                failure_behavior="Return HTTP 503 DATABASE_UNAVAILABLE; fail fast on transactions.",
                last_verified=None,
                notes=db_notes,
            )
        )

        # 3. National Health Authority (NHA) PM-JAY API
        self.register(
            IntegrationEntry(
                name="nha_pmjay",
                status=IntegrationStatus.REQUIRES_AUTHORISATION,
                provider="National Health Authority (Government of India)",
                required_credentials=["NHA_PMJAY_API_KEY", "NHA_CLIENT_CERT"],
                failure_behavior="Direct users to official NHA portals (hospitals.pmjay.gov.in); never claim eligibility.",
                last_verified=None,
                notes="Official PM-JAY beneficiary verification and live empanelment lookups require government MoU/B2B clearance.",
            )
        )

        # 4. Medication Reminders Provider
        self.register(
            IntegrationEntry(
                name="reminders",
                status=IntegrationStatus.UNAVAILABLE,
                provider="SMS / WhatsApp Provider Gateway",
                required_credentials=["REMINDER_GATEWAY_TOKEN"],
                failure_behavior="Store reminders locally in database; external dispatch marked unavailable.",
                last_verified=None,
                notes="External push/SMS notification delivery provider not configured.",
            )
        )

    def register(self, entry: IntegrationEntry) -> None:
        self._entries[entry.name] = entry

    def update_status(
        self,
        name: str,
        status: IntegrationStatus,
        notes: Optional[str] = None,
        last_verified: Optional[datetime] = None,
    ) -> None:
        if name in self._entries:
            entry = self._entries[name]
            entry.status = status
            if notes is not None:
                entry.notes = notes
            entry.last_verified = last_verified or datetime.now(timezone.utc)

    def get(self, name: str) -> Optional[IntegrationEntry]:
        return self._entries.get(name)

    def get_status(self, name: str) -> IntegrationStatus:
        entry = self._entries.get(name)
        if not entry:
            return IntegrationStatus.NOT_IMPLEMENTED
        return entry.status

    def is_operational(self, name: str) -> bool:
        entry = self._entries.get(name)
        return bool(entry and entry.status in (IntegrationStatus.OPERATIONAL, IntegrationStatus.CONFIGURED, IntegrationStatus.CONNECTED))

    def get_all(self) -> dict[str, IntegrationEntry]:
        return dict(self._entries)

    def to_dict(self) -> dict[str, Any]:
        return {k: v.model_dump() for k, v in self._entries.items()}


# Global singleton instance
registry = IntegrationRegistry()
