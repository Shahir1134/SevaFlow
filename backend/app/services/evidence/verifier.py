import logging
from typing import Any
from app.services.insurance_rag.verifier import verify_quote

logger = logging.getLogger(__name__)


class EvidenceVerifier:
    """Evidence verification layer to enforce grounded claims."""

    @staticmethod
    def verify_chunk_quotes(quotes: list[str], source_text: str) -> dict[str, bool]:
        """Verify multiple quote strings against source text."""
        results = {}
        for q in quotes:
            results[q] = verify_quote(q, source_text)
        return results

    @staticmethod
    def filter_unverified_claims(
        claims_with_quotes: list[dict[str, Any]], source_text: str
    ) -> list[dict[str, Any]]:
        """Filter out claims whose cited quotes cannot be programmatically verified."""
        verified = []
        for item in claims_with_quotes:
            quote = item.get("quote", "")
            if verify_quote(quote, source_text):
                item["verified"] = True
                verified.append(item)
            else:
                logger.warning("Dropped unverified claim quote: %s", quote)
        return verified
