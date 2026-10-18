import logging
from typing import Any
from app.integrations.registry import IntegrationStatus, registry

logger = logging.getLogger(__name__)


class ReminderAdapter:
    """Adapter for external reminder dispatchers (SMS, WhatsApp, Push).
    External dispatch is in an UNAVAILABLE state until an authorized gateway is provisioned.
    """

    def __init__(self) -> None:
        pass

    def get_status(self) -> IntegrationStatus:
        return registry.get_status("reminders")

    async def send_reminder(
        self, phone: str, message: str, reminder_type: str = "medication"
    ) -> dict[str, Any]:
        logger.info("Attempted reminder delivery for %s: external gateway UNAVAILABLE.", phone)
        return {
            "status": "UNAVAILABLE",
            "delivered": False,
            "message": "External notification gateway is not configured. Reminder recorded locally in database only.",
            "integration_status": self.get_status().value,
        }


reminder_adapter = ReminderAdapter()
