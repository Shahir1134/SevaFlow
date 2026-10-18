import re


def normalize_text(text: str) -> str:
    """Normalize text by collapsing whitespace, stripping punctuation, and lowercasing."""
    if not text:
        return ""
    # Replace punctuation with a space so hyphenated and slashed words normalize with word breaks
    text = re.sub(r"[^\w\s]", " ", text)
    # Collapse whitespace and newlines
    return " ".join(text.lower().split())


def verify_quote(quote: str, source_text: str) -> bool:
    """Programmatic verification of exact quote against source document text.
    Uses normalized substring matching. NEVER returns True if quote is not in source.
    """
    if not quote or not quote.strip() or not source_text or not source_text.strip():
        return False

    norm_quote = normalize_text(quote)
    norm_source = normalize_text(source_text)

    if not norm_quote or len(norm_quote) < 3:
        return False

    return norm_quote in norm_source
