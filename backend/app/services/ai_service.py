"""
PrintStation — AI Service.

Document summarization via Google Gemini API.
Falls back to simulation mode when GEMINI_API_KEY is not set.

Owner: Member 4 (AI)
Reference: docs/ai-features.md §2
"""

from pathlib import Path

from app.config import get_settings

settings = get_settings()

# System prompts for each summarization mode
PROMPTS = {
    "key_points": (
        "You are an academic study assistant. "
        "Extract the main ideas from the following document as concise bullet points. "
        "Preserve all critical information. Target: ~10% of original length."
    ),
    "study_notes": (
        "You are an academic study assistant. "
        "Organize the following document into structured study notes with clear headings, "
        "subheadings, and bullet points. Highlight key definitions and formulas. "
        "Target: ~10% of original length."
    ),
    "exam_prep": (
        "You are an academic study assistant. "
        "From the following document, extract all definitions, formulas, key facts, "
        "and testable concepts. Format as a concise exam preparation cheat sheet. "
        "Target: ~10% of original length."
    ),
}

# Rough estimate: 1 summary page ≈ 3000 characters
CHARS_PER_PAGE = 3000


async def summarize_document(
    text: str,
    mode: str = "study_notes",
    custom_prompt: str | None = None,
) -> dict:
    """
    Summarize document text using Gemini API (or simulation).

    Args:
        text: Extracted text from PDF
        mode: Summarization mode (key_points, study_notes, exam_prep)
        custom_prompt: Optional user-provided focus instructions

    Returns:
        dict with: summary_text, estimated_pages
    """
    if not text or len(text.strip()) < 100:
        return {
            "summary_text": "",
            "estimated_pages": 0,
            "error": "Document has too little extractable text. It may be scanned.",
        }

    if settings.is_ai_enabled:
        summary_text = await _summarize_with_gemini(text, mode, custom_prompt)
    else:
        summary_text = _summarize_simulated(text, mode)

    estimated_pages = max(1, len(summary_text) // CHARS_PER_PAGE + 1)

    return {
        "summary_text": summary_text,
        "estimated_pages": estimated_pages,
    }


async def _summarize_with_gemini(
    text: str,
    mode: str,
    custom_prompt: str | None,
) -> str:
    """
    Call Google Gemini API for summarization.

    TODO (Member 4): Implement this.
    - Install: pip install google-generativeai
    - Handle token limits (chunk long documents)
    - Handle API errors gracefully
    - Test with Arabic text
    """
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")

    system_prompt = PROMPTS.get(mode, PROMPTS["study_notes"])
    if custom_prompt:
        system_prompt += f"\n\nAdditional focus: {custom_prompt}"

    response = model.generate_content(f"{system_prompt}\n\n---\n\n{text}")
    return response.text


def _summarize_simulated(text: str, mode: str) -> str:
    """
    Simulation mode — returns a fake summary for development without API key.
    """
    word_count = len(text.split())
    return (
        f"# Simulated Summary ({mode} mode)\n\n"
        f"This is a simulated AI summary for development.\n"
        f"Original document: ~{word_count} words.\n"
        f"In production, this would be replaced by Gemini API output.\n\n"
        f"## Key Points\n\n"
        f"- Point 1 from the document\n"
        f"- Point 2 from the document\n"
        f"- Point 3 from the document\n"
    )


def save_summary_to_file(summary_text: str, job_id: int) -> str:
    """
    Save AI summary to a text file. Returns the filename.
    """
    filename = f"summary_{job_id}.txt"
    file_path = settings.ai_output_dir / filename
    file_path.write_text(summary_text, encoding="utf-8")
    return filename
