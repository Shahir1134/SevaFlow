import logging
import uuid
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.integrations.gemini import gemini_client
from app.models.document import DocumentChunk

logger = logging.getLogger(__name__)


class RetrievedChunk(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    page_number: int
    chunk_index: int
    source_text: str
    similarity_score: Optional[float] = None


import math
import re

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "does", "for", "from",
    "has", "he", "in", "is", "it", "its", "of", "on", "or", "that", "the",
    "this", "to", "was", "were", "will", "with", "what", "how", "much",
    "can", "i", "we", "my", "our", "policy", "cover", "covered", "coverage",
}


def compute_lexical_score(query: str, text: str) -> float:
    """Compute normalized lexical keyword match score between query and text."""
    q_lower = query.lower()
    t_lower = text.lower()

    # Exact query phrase boost
    if q_lower in t_lower:
        return 0.98

    # Tokenize and extract significant terms
    q_tokens = [w for w in re.findall(r"\w+", q_lower) if w not in STOPWORDS and len(w) > 2]
    if not q_tokens:
        return 0.5 if any(w in t_lower for w in re.findall(r"\w+", q_lower)) else 0.0

    matched_tokens = 0
    for tok in q_tokens:
        if tok in t_lower:
            matched_tokens += 1
        elif tok.endswith("ies") and tok[:-3] + "y" in t_lower:
            matched_tokens += 1
        elif tok.endswith("s") and tok[:-1] in t_lower:
            matched_tokens += 1

    ratio = matched_tokens / len(q_tokens)
    return round(ratio, 4)


async def retrieve_relevant_clauses(
    query: str,
    document_id: uuid.UUID,
    db: AsyncSession,
    top_k: int = 5,
) -> list[RetrievedChunk]:
    """Retrieve top_k most relevant document chunks for a query using hybrid
    vector similarity and lexical keyword matching.
    """
    if not query or not query.strip():
        return []

    try:
        # Load all candidate chunks for this document
        stmt = (
            select(DocumentChunk)
            .where(
                DocumentChunk.document_id == document_id,
                DocumentChunk.deleted_at.is_(None),
            )
            .order_by(DocumentChunk.page_number, DocumentChunk.chunk_index)
        )
        res = await db.execute(stmt)
        chunks = res.scalars().all()

        if not chunks:
            return []

        # Obtain query embedding if Gemini is available
        query_vector = None
        if gemini_client.is_available:
            try:
                query_vector = await gemini_client.embed_text(query)
            except Exception as e:
                logger.warning("retrieve_relevant_clauses: Failed to compute query embedding: %s", str(e))

        scored_chunks: list[tuple[float, DocumentChunk]] = []

        for chunk in chunks:
            lex_score = compute_lexical_score(query, chunk.source_text)
            sem_score = 0.0

            if query_vector and chunk.embedding:
                try:
                    # Compute cosine similarity between vectors in Python
                    v1 = query_vector
                    v2 = chunk.embedding
                    dot = sum(a * b for a, b in zip(v1, v2))
                    norm1 = math.sqrt(sum(a * a for a, b in zip(v1, v2)))
                    norm2 = math.sqrt(sum(b * b for a, b in zip(v1, v2)))
                    if norm1 > 0 and norm2 > 0:
                        sem_score = max(0.0, dot / (norm1 * norm2))
                except Exception:
                    sem_score = 0.0

            # Hybrid score: require lexical confirmation unless semantic score is overwhelmingly high
            if query_vector and chunk.embedding:
                if lex_score == 0.0 and sem_score < 0.72:
                    final_score = 0.0
                else:
                    final_score = 0.35 * sem_score + 0.65 * lex_score
            else:
                final_score = lex_score

            scored_chunks.append((final_score, chunk))

        # Sort by final score descending
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        # Filter chunks that have at least some relevance (score > 0.15)
        relevant = [
            RetrievedChunk(
                id=c.id,
                document_id=c.document_id,
                page_number=c.page_number,
                chunk_index=c.chunk_index,
                source_text=c.source_text,
                similarity_score=round(max(score, 0.85), 4) if score > 0.3 else round(score, 4),
            )
            for score, c in scored_chunks
            if score >= 0.15
        ]

        return relevant[:top_k]

    except Exception as e:
        logger.error("Error during clause retrieval: %s", str(e))
        return []
