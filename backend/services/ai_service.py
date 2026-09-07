"""
AI service — handles document summarization via Gemini API.

For the prototype, this uses Google's Gemini API (free tier: 60 req/min, 1500/day).
If no API key is configured, it falls back to a simulated summary for testing.
If Gemini is overloaded or errors out, it retries, then falls back to a local
extractive summary so the print job never blocks on the AI service.
"""
import asyncio
import os
import re
import uuid
import textwrap
from pathlib import Path

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
AI_OUTPUT_DIR = Path(__file__).parent.parent / "ai_output"
AI_OUTPUT_DIR.mkdir(exist_ok=True)


class AIServiceError(Exception):
    """Custom error for AI processing issues."""
    pass


async def summarize_document(
    text: str,
    original_page_count: int,
    custom_prompt: str = None
) -> tuple[str, int]:
    """
    Summarize a document using Gemini API.
    
    Args:
        text: The extracted text from the PDF
        original_page_count: Number of pages in the original
        custom_prompt: Optional custom instruction (e.g., "focus on chapter 3")
    
    Returns:
        (summary_text, estimated_pages)
    """
    if GEMINI_API_KEY:
        return await _summarize_with_gemini(text, original_page_count, custom_prompt)
    else:
        return _simulate_summary(text, original_page_count)


# Model candidates, in order of preference. Flash models are fast and cheap;
# the "-latest" alias tracks the current stable flash version.
GEMINI_MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"]

# How many times to retry each model on transient errors (429/500/503).
MAX_RETRIES = 2
RETRY_BASE_DELAY_S = 1.5


def _is_transient_error(exc: Exception) -> bool:
    """Heuristic: rate limits and server overload are worth retrying."""
    msg = str(exc)
    return any(code in msg for code in ("429", "500", "502", "503", "504", "UNAVAILABLE", "OVERLOADED"))


async def _summarize_with_gemini(
    text: str,
    original_page_count: int,
    custom_prompt: str = None
) -> tuple[str, int]:
    """Use Gemini API for real summarization, with retry + model fallback."""
    from google import genai

    client = genai.Client(api_key=GEMINI_API_KEY)

    system_instruction = textwrap.dedent("""
            You are a study assistant for university students. Your job is to 
            summarize lecture notes and documents into concise, well-organized 
            study material.
            
            Rules:
            - Extract the KEY points, definitions, formulas, and important facts
            - Use clear headings and bullet points
            - Keep the summary to roughly 1/10th of the original length
            - Preserve any formulas, equations, or technical terms exactly
            - Use simple, clear language
            - Organize by topic/section
            - Output in plain text with markdown-style formatting
        """).strip()

    user_prompt = f"Summarize the following document ({original_page_count} pages) into concise study notes:\n\n"
    if custom_prompt:
        user_prompt += f"Special instruction: {custom_prompt}\n\n"
    user_prompt += text[:30000]  # Limit input to avoid token limits

    last_error = None
    for model in GEMINI_MODELS:
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = await client.aio.models.generate_content(
                    model=model,
                    contents=user_prompt,
                    config={
                        "system_instruction": system_instruction,
                        "temperature": 0.3,  # Low temp for factual summaries
                    },
                )

                summary = (response.text or "").strip()
                if not summary:
                    raise AIServiceError("Gemini returned an empty summary")

                # Estimate pages: ~3000 chars per page (rough estimate for printed text)
                estimated_pages = max(1, len(summary) // 3000 + 1)

                return summary, estimated_pages

            except Exception as e:
                last_error = e
                if _is_transient_error(e) and attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_BASE_DELAY_S * (2 ** attempt))
                    continue
                break  # non-transient, or out of retries — try the next model

    # All models failed — degrade to the local extractive fallback
    # so the student's print job is never blocked by the AI service.
    fallback, pages = _local_extractive_summary(text, original_page_count)
    notice = (
        f"[Offline summary] Gemini was unavailable "
        f"({type(last_error).__name__}). This summary was extracted locally "
        f"from your document — try again later for the full AI version.\n\n"
    )
    return notice + fallback, pages


def _local_extractive_summary(text: str, original_page_count: int) -> tuple[str, int]:
    """
    Offline fallback: extract the most content-dense sentences locally.
    Not as good as Gemini, but the job keeps moving when the API is down.
    """
    # Split into sentences (crude but effective for lecture notes)
    sentences = re.split(r'(?<=[.!?])\s+|\n+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 40]

    # Score sentences: favor ones with definition/formula signals
    signals = ("is defined", "means", "formula", "equation", "=", "theorem",
               "law of", "principle", "important", "key", "note that",
               "in summary", "conclusion", "example of")
    scored = []
    for i, s in enumerate(sentences):
        score = sum(2 for sig in signals if sig in s.lower())
        score += min(len(s) / 200, 1)  # slight preference for substance
        scored.append((score, i, s))

    # Keep the top ~10% of sentences, in original document order
    target = max(5, len(sentences) // 10)
    kept = sorted(sorted(scored, reverse=True)[:target], key=lambda x: x[1])

    lines = [s for _, _, s in kept]
    summary = (
        "STUDY NOTES (offline extract)\n"
        "=============================\n\n"
        + "\n".join(f"• {line}" for line in lines)
    )

    estimated_pages = max(1, original_page_count // 10)
    return summary, estimated_pages


def _simulate_summary(text: str, original_page_count: int) -> tuple[str, int]:
    """
    Simulate a summary for testing without an API key.
    Generates a fake but realistic-looking summary.
    """
    # Take first 500 chars as a "summary" for simulation
    preview = text[:500].strip()
    
    simulated_summary = textwrap.dedent(f"""
        ═══════════════════════════════════════════════
        📝 DOCUMENT SUMMARY (AI-Generated)
        ═══════════════════════════════════════════════
        
        Original: {original_page_count} pages → Summarized to key points
        
        ───────────────────────────────────────────────
        🔑 KEY POINTS
        ───────────────────────────────────────────────
        
        • [Simulated] This is a simulated AI summary.
        • Configure GEMINI_API_KEY in .env for real summarization.
        • The actual summary would extract key points, definitions,
          formulas, and important facts from the document.
        
        ───────────────────────────────────────────────
        📖 CONTENT PREVIEW
        ───────────────────────────────────────────────
        
        {preview}
        
        ───────────────────────────────────────────────
        ⚠️  SIMULATED MODE
        ───────────────────────────────────────────────
        
        This summary was generated in simulation mode.
        To enable real AI summarization:
        1. Get a free Gemini API key at https://aistudio.google.com
        2. Add GEMINI_API_KEY=your_key to backend/.env
        3. Restart the server
    """).strip()
    
    estimated_pages = max(1, original_page_count // 10)
    
    return simulated_summary, estimated_pages


def save_summary_as_text(summary: str, job_id: int) -> str:
    """
    Save the summary as a text file.
    In production, this would generate a properly formatted PDF.
    For the prototype, a text file is sufficient.
    
    Returns the filename.
    """
    filename = f"summary_{job_id}_{uuid.uuid4().hex[:8]}.txt"
    filepath = AI_OUTPUT_DIR / filename
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(summary)
    
    # Upload to Cloudflare R2 if configured
    try:
        from services.storage_r2 import upload_to_r2, is_r2_enabled
        if is_r2_enabled():
            upload_to_r2(summary.encode("utf-8"), f"ai_output/{filename}", content_type="text/plain; charset=utf-8")
    except Exception:
        pass
    
    return filename
