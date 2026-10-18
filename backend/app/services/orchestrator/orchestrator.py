import logging
from typing import Any, Callable, Coroutine
from fastapi import HTTPException, status
from app.integrations.registry import IntegrationStatus, registry

logger = logging.getLogger(__name__)


class RequestOrchestrator:
    """Controlled request router with integration availability checks and execution limits."""

    @staticmethod
    def assert_integration_operational(integration_name: str) -> None:
        """Verify that the required integration is in an acceptable operational status."""
        entry = registry.get(integration_name)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail=f"Integration '{integration_name}' is not registered or supported.",
            )

        if entry.status in (
            IntegrationStatus.UNAVAILABLE,
            IntegrationStatus.NOT_IMPLEMENTED,
        ):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    f"SERVICE_UNAVAILABLE: Integration '{integration_name}' is currently {entry.status.value}. "
                    f"Notes: {entry.notes or 'No further details.'}"
                ),
            )

        if entry.status == IntegrationStatus.REQUIRES_AUTHORISATION:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"REQUIRES_AUTHORISATION: Integration '{integration_name}' requires governmental MoU or authorized credentials. "
                    f"Notes: {entry.notes}"
                ),
            )

    @staticmethod
    async def execute_controlled(
        integration_name: str,
        coro_fn: Callable[[], Coroutine[Any, Any, Any]],
        fallback_fn: Callable[[], Any] | None = None,
    ) -> Any:
        """Execute a service coroutine with pre-flight integration assertion."""
        try:
            RequestOrchestrator.assert_integration_operational(integration_name)
            return await coro_fn()
        except HTTPException:
            if fallback_fn is not None:
                return fallback_fn()
            raise
        except Exception as e:
            logger.error("Error executing controlled action for %s: %s", integration_name, str(e))
            if fallback_fn is not None:
                return fallback_fn()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal error while processing request through orchestrator.",
            )


orchestrator = RequestOrchestrator()
