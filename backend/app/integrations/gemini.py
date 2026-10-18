import logging
from typing import Optional
from google import genai
from app.config import get_settings
from app.integrations.registry import IntegrationStatus, registry

logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client: Optional[genai.Client] = None
        self._initialize()

    def _initialize(self) -> None:
        if not self.settings.gemini_api_key or not self.settings.gemini_api_key.strip():
            logger.warning("GEMINI_API_KEY is not configured. Gemini AI client disabled.")
            registry.update_status(
                "gemini",
                IntegrationStatus.UNAVAILABLE,
                notes="GEMINI_API_KEY is not configured. AI features return SERVICE_UNAVAILABLE.",
            )
            self._client = None
            return

        try:
            self._client = genai.Client(api_key=self.settings.gemini_api_key)
            registry.update_status(
                "gemini",
                IntegrationStatus.CONFIGURED,
                notes="Gemini client initialized with API key.",
            )
        except Exception as e:
            logger.error("Failed to initialize Gemini client: %s", str(e))
            registry.update_status(
                "gemini",
                IntegrationStatus.UNAVAILABLE,
                notes=f"Initialization error: {str(e)}",
            )
            self._client = None

    @property
    def is_available(self) -> bool:
        return self._client is not None and bool(self.settings.gemini_api_key)

    async def embed_text(self, text: str) -> Optional[list[float]]:
        """Generate text embedding vector using Google Gemini SDK.
        Returns None if Gemini is unavailable or request fails. NEVER fabricates embeddings.
        """
        if not self.is_available:
            logger.warning("embed_text skipped: Gemini integration is UNAVAILABLE.")
            return None

        if not text or not text.strip():
            return None

        try:
            response = await self._client.aio.models.embed_content(
                model=self.settings.gemini_embedding_model,
                contents=text,
            )
            if response.embeddings and len(response.embeddings) > 0:
                values = response.embeddings[0].values
                registry.update_status("gemini", IntegrationStatus.OPERATIONAL, notes="Embedding operational.")
                return list(values)
            return None
        except Exception as e:
            logger.error("Gemini embedding error: %s", str(e))
            registry.update_status("gemini", IntegrationStatus.DEGRADED, notes=f"Embedding error: {str(e)}")
            return None

    async def generate_grounded_response(
        self, prompt: str, evidence: list[str]
    ) -> Optional[str]:
        """Generate grounded response strictly from provided evidence.
        Returns None if Gemini is unavailable or request fails. NEVER fabricates responses.
        """
        if not self.is_available:
            logger.warning("generate_grounded_response skipped: Gemini integration is UNAVAILABLE.")
            return None

        formatted_evidence = "\n\n".join(
            f"[Source Clause {i+1}]:\n{chunk}" for i, chunk in enumerate(evidence)
        )
        system_instruction = (
            "You are a medical insurance analysis assistant for HealthConnect India. "
            "You must rely ONLY on the verified evidence clauses provided below. "
            "Do NOT speculate, assume coverage, or invent figures. If the policy text does not "
            "explicitly provide an answer, state that the coverage is unclear or that evidence is insufficient."
        )

        full_prompt = (
            f"{system_instruction}\n\n"
            f"=== VERIFIED EVIDENCE CLAUSES ===\n{formatted_evidence}\n\n"
            f"=== USER QUERY / REQUIREMENT ===\n{prompt}\n\n"
            f"Provide your factual, grounded determination. Include direct quotes from the evidence wherever relevant."
        )

        try:
            response = await self._client.aio.models.generate_content(
                model=self.settings.gemini_generative_model,
                contents=full_prompt,
            )
            if response and response.text:
                registry.update_status("gemini", IntegrationStatus.OPERATIONAL, notes="Generative model operational.")
                return response.text
            return None
        except Exception as e:
            logger.error("Gemini content generation error: %s", str(e))
            registry.update_status("gemini", IntegrationStatus.DEGRADED, notes=f"Generation error: {str(e)}")
            return None


gemini_client = GeminiClient()
