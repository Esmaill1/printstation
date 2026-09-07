# Member 4 — AI & Document Processing Engineer

> **Role**: All intelligence features — what makes PrintStation "an AI study assistant that also prints."  
> **Tech Stack**: Google Gemini API, OpenCV, Tesseract OCR, ReportLab/FPDF, pypdf  
> **Academic Coverage**: AI/ML — NLP summarization, OCR, document intelligence

---

## Phase 1 — Prototype (Weeks 1–6)

### Week 1–2: Foundation

- [ ] **Set up Gemini API access**
  - Create Google Cloud project
  - Enable Gemini API
  - Generate API key
  - Store in `.env` file: `GEMINI_API_KEY=...`
  - Verify free tier limits: 60 req/min, 1500 req/day
- [ ] **Text extraction from PDF** — `services/ai_service.py`
  ```python
  def extract_text_from_pdf(filepath: str) -> str:
      reader = pypdf.PdfReader(filepath)
      text = ""
      for page in reader.pages:
          text += page.extract_text() + "\n"
      return text
  ```
  - Handle edge cases: scanned PDFs (no text), encrypted PDFs, corrupt PDFs
  - Return meaningful error when text extraction fails
  - Ref: AI Features §2
- [ ] **Gemini API "hello world"**
  - Basic summarization call with hardcoded text
  - Test Arabic text support
  - Measure response time
  - Test error handling (API down, rate limit, invalid key)
- [ ] **Define AI response format** — agree with Member 1 on what the frontend receives
  - Plain text? Markdown? Structured JSON?
  - Recommendation: Markdown (renders nicely, supports headings/bullets)

### Week 3–4: Full Summarization Pipeline

- [ ] **Summarization service** — `services/ai_service.py`
  ```python
  def summarize_document(text: str, mode: str, custom_prompt: str = None) -> str:
  ```
  - Ref: AI Features §2
- [ ] **Summarization modes** (different system prompts)
  - **Key Points**: "Extract the main ideas as bullet points"
  - **Study Notes**: "Organize into structured notes with headings"
  - **Exam Prep**: "Focus on definitions, formulas, and testable facts"
  - **Custom**: User-provided prompt appended to system prompt
  - Ref: AI Features §2
- [ ] **Text chunking** for long documents
  - Gemini has token limits — chunk text if exceeding limit
  - Summarize chunks individually, then combine
  - Or use "map-reduce" strategy: summarize sections → summarize summaries
- [ ] **AI endpoint integration** — `POST /api/jobs/{id}/ai`
  - Coordinate with Member 2 to add this route
  - Flow: extract text → summarize → save result → update job
  - Save summary as text file in `ai_output/` directory
  - Update job: ai_mode, ai_result_filename, new page count, new price
  - Return: { job_id, ai_mode, original_pages, ai_pages, original_price, new_price, preview_url }
  - Ref: API Reference
- [ ] **AI Preview endpoint** — `GET /api/jobs/{id}/ai-preview`
  - Serve the AI summary text file
  - Content-Type: text/plain; charset=utf-8
  - Ref: API Reference
- [ ] **AI pricing integration**
  - AI fee: 2.00 EGP per summarized document
  - Estimate output page count (rough: 1 page per ~3000 chars of summary)
  - Coordinate with Member 2's pricing engine

### Week 5–6: Edge Cases & Polish

- [ ] **Scanned PDF detection**
  - If pypdf extracts no text or very little text → PDF is likely scanned
  - Return clear error: "This PDF appears to be scanned. Text extraction is not possible."
  - Suggest OCR mode (coming in Phase 2)
  - Ref: AI Features §2
- [ ] **Short document handling**
  - If document < 2 pages → warn: "This document is already short. Summarization may not save pages."
  - Still allow summarization if student insists
  - Ref: AI Features §2
- [ ] **Gemini API failure handling**
  - API timeout → retry once with backoff
  - API down → graceful fallback: "AI features temporarily unavailable. You can still print the full document."
  - Rate limit hit → queue and retry later, or inform user
  - Ref: AI Features §2
- [ ] **Arabic text support**
  - Test summarization with Arabic-language PDFs
  - Bilingual prompt handling (Arabic instructions to Gemini)
  - Ensure Arabic output renders correctly in preview
  - Ref: AI Features §2
- [ ] **Summary quality testing**
  - Test with real lecture PDFs (different subjects)
  - Test with different document types (research papers, slides, notes)
  - Tune system prompts based on output quality
  - Measure summary-to-original ratio (target: ~10%)
- [ ] **Verify AI-generated documents print correctly** (coordinate with Member 5)

---

## Phase 2 — After 50+ Users

- [ ] **Photo → Clean Document** (PRD P2-09, AI Features §3)
  - Accept image uploads (JPEG, PNG)
  - OpenCV pipeline: grayscale → edge detection → perspective transform → adaptive threshold
  - Output: clean, print-ready PDF
  - Tech: OpenCV (free, local, no API cost)
  - Cost: 1.50 EGP per photo
- [ ] **Flashcard Generator** (PRD P2-10, AI Features §4)
  - Extract text → send to Gemini with flashcard prompt
  - Generate Q&A pairs
  - Format as printable PDF with cut lines (front/back layout)
  - Tech: Gemini API + ReportLab for PDF layout
  - Cost: 3.00 EGP per set
- [ ] **OCR for scanned documents** (PRD P2-11, AI Features §5)
  - Detect scanned PDFs (images inside PDF pages)
  - Extract text using Tesseract OCR
  - Support Arabic via Tesseract trained data (`ara.traineddata`)
  - Output: searchable, clean PDF
  - Tech: Tesseract (free, local)
- [ ] **Smart Print Defaults** (PRD P2-12, AI Features §6)
  - Detect document type from PDF metadata + content analysis
  - Lecture slides → suggest 2-up, B&W, duplex
  - Thesis/report → suggest 1-up, single-sided
  - Photos/diagrams → suggest full page, color
  - Rules-based (minimal ML needed)

---

## Phase 3 — Scaling

- [ ] **Smart Slide Layout** (PRD P3-09, AI Features §7)
  - Vision AI to classify slide content
  - Text-heavy → 2 per page, diagram → 1 per page, title → 4 per page
  - Custom PDF layout engine
- [ ] **Assignment Formatter** (PRD P3-10, AI Features §8)
  - Rough text → professional formatted document
  - University header, student info, clean formatting
- [ ] **Translation & Print** (PRD P3-11, AI Features §9)
  - Upload English doc → translate to Arabic → print translation
  - Gemini API handles translation

---

## Key Files You Own

| File | Purpose |
|---|---|
| `backend/services/ai_service.py` | All AI logic (summarization, OCR, photo, flashcards) |
| `backend/ai_output/` | Directory for AI-generated summary files |
| System prompts (in ai_service.py) | Prompt engineering for each AI mode |

---

## You Depend On

| Who | What You Need From Them |
|---|---|
| **Member 2** (Backend) | Integration point in main.py for AI endpoints |
| **Member 2** (Backend) | Access to uploaded PDF files (file paths) |

## Others Depend On You

| Who | What They Need From You |
|---|---|
| **Member 1** (Frontend) | AI response format (so they can build the preview UI) |
| **Member 2** (Backend) | AI service module to import and call |
| **Member 5** (Kiosk) | AI-generated PDFs that print correctly (test formatting!) |

---

## Features Explicitly NOT Building

> These are documented as "pointless AI" in the AI Features doc. Don't build them.

| Feature | Why Not |
|---|---|
| AI chatbot | FAQ page + WhatsApp group works better |
| AI pricing | Pricing is simple multiplication |
| AI content moderation | Solve only if it becomes a real problem |
| "AI-enhanced print quality" | The printer controls print quality |
| Recommendation engine | Not applicable to printing |
| AI-generated cover pages | A template suffices |
