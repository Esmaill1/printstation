# 👋 Welcome, Member 4 — AI & Document Intelligence Engineer

> **You own the brain.** Every intelligent feature — summarization, OCR, photo cleanup, flashcard generation — is yours. You turn raw academic documents into polished, print-ready study materials.

---

## 🚀 Quick Start (Get Running in 10 Minutes)

```bash
# 1. Clone the repo and enter the backend
git checkout develop
git pull origin develop
git checkout -b feature/ai-summarize

# 2. Create and activate virtual environment
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create your environment file
cp .env.example .env
# Edit .env → set GEMINI_API_KEY=your_google_api_key
# Leave GEMINI_API_KEY blank to run in SIMULATION MODE (returns mock summaries)

# 5. Run the backend
uvicorn app.main:app --reload --port 8000

# 6. Verify Gemini connection (optional quick test)
python -c "import google.generativeai as genai; print('Gemini SDK ready')"
```

> **Get a free Gemini API key** at [aistudio.google.com](https://aistudio.google.com/). The free tier is plenty for development.

---

## 📖 Read These Files First (In This Order)

| # | File | Why |
|---|------|-----|
| 1 | [`TASKS.md`](file:///d:/Projects/printstation/docs/team/member-4-ai/TASKS.md) | **Your contract.** Every AI feature, acceptance test, and file you own. |
| 2 | [`docs/ai-features.md`](file:///d:/Projects/printstation/docs/ai-features.md) | **Deep dive into AI features** — prompt strategies, OCR pipeline, and OpenCV details. |
| 3 | [`docs/architecture.md`](file:///d:/Projects/printstation/docs/architecture.md) | See how your `ai_service.py` connects to the backend routes and frontend UI. |
| 4 | [`docs/PRD.md`](file:///d:/Projects/printstation/docs/PRD.md) | Understand the student use cases — why they need summaries, OCR, and flashcards. |
| 5 | [`docs/CONTRIBUTING.md`](file:///d:/Projects/printstation/docs/CONTRIBUTING.md) | Git workflow and Python coding standards. |

---

## 🎯 What You Need to Build

Your job produces **one deliverable**: a complete document intelligence engine. Here's the summary:

### Core AI Features
1. **4-Mode Academic Summarizer** — Key Points, Study Notes, Exam Prep, Custom Prompt. Uses Gemini with chunking/map-reduce for long documents. Supports English and Arabic.
2. **Print-Ready PDF Publisher** — Compiles Gemini markdown output into beautifully formatted A4 PDFs using ReportLab (title, headings, page numbers, clean typography).

### Vision & OCR Features
3. **Image OCR → Study Guide** — Takes smartphone photos of handwritten notes/whiteboards → Gemini Vision OCR → organizes into structured study document → compiles to printable PDF.
4. **Phone Photo → Clean Document** — OpenCV pipeline: edge detection → perspective transform (deskew) → shadow removal → adaptive thresholding → crisp monochrome PDF.

### Bonus Features
5. **Flashcard & Quiz Generator** — Transforms lectures into printable 2-column flashcards (double-sided Q&A) and multiple-choice quizzes.
6. **Arabic OCR** — Gemini Vision / Tesseract OCR for scanned Arabic lecture handouts.

---

## 📁 Your Files

```
backend/
├── app/
│   └── services/
│       ├── ai_service.py                ← Core: Gemini prompts, summarization, mock fallback
│       ├── cv_service.py                ← OpenCV photo cleaning, deskewing, shadow removal
│       └── pdf_compiler.py             ← ReportLab printable PDF + flashcard generation
└── ai_output/                           ← Directory for all AI-generated PDFs
```

> **Skeleton files exist** with function signatures and TODO comments. The interfaces are defined — you implement the internals.

---

## 🤝 Who You Depend On & Who Depends on You

| Direction | Member | What |
|-----------|--------|------|
| **← Calls your code** | Member 2 (Backend) | Calls `ai_service.summarize()`, `ai_service.ocr_to_study_guide()`, `cv_service.clean_document_photo()` from API routes |
| **← UI triggers you** | Member 1 (Frontend) | Student selects AI mode in the UI → frontend calls backend → backend calls your service |
| **You use →** | Member 2 (Backend) | You read from their `PrintJob` model to get the uploaded PDF path |

### Coordination Tips

- **You work independently.** Your service functions take a file path and return a file path — pure input/output. You don't need to wait for anyone.
- **Test with real PDFs.** Download some university lecture slides and test your summarizer end-to-end.
- **Start with the summarizer** (it's the core feature), then add OpenCV, then OCR, then flashcards.
- **Agree with Member 2** on the function signatures in `ai_service.py` — they need to know what parameters to pass and what you return.

---

## ⚙️ Key Libraries You'll Use

| Library | Purpose | Install |
|---------|---------|---------|
| `google-generativeai` | Gemini API client (text + vision) | In requirements.txt |
| `pypdf` | Extract text from PDF files | In requirements.txt |
| `reportlab` | Generate formatted A4 PDF output | In requirements.txt |
| `opencv-python` | Image processing (deskew, binarize) | In requirements.txt |
| `Pillow` | Image loading and manipulation | In requirements.txt |
| `pytesseract` | OCR fallback (requires Tesseract installed) | In requirements.txt |

> **Tesseract installation**: On Windows, download from [UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki). On Linux: `sudo apt install tesseract-ocr tesseract-ocr-ara`.

---

## 🧪 TDD — Write Tests First

> **Mandatory.** Every AI pipeline must be built test-first. Read the full TDD guide in [`docs/CONTRIBUTING.md`](file:///d:/Projects/printstation/docs/CONTRIBUTING.md).

**Your test files** (in `backend/tests/`):

| Test File | What to Test |
|-----------|-------------|
| `test_ai.py` | Summarization returns text for each mode, handles empty PDFs, respects custom prompts |
| `test_cv.py` | OpenCV deskews angled images, binarization produces monochrome output |
| `test_pdf_compiler.py` | ReportLab produces valid A4 PDF, page count is correct, Arabic text renders |
| `test_ocr.py` | OCR extracts text from test images, organizes into structured markdown |
| `test_flashcards.py` | Flashcard generator produces 2-column layout, correct Q&A pairs |

**Example TDD flow (summarizer):**
```python
# Step 1: 🔴 Write the failing test FIRST
def test_key_points_mode_returns_bullet_list():
    text = "Photosynthesis is the process by which plants convert sunlight..."
    result = summarize(text, mode="key_points")
    assert "•" in result or "-" in result  # Must contain bullets
    assert len(result) < len(text)          # Must be shorter

def test_simulation_mode_returns_instant_result():
    # When GEMINI_API_KEY is unset, should return mock summary
    result = summarize("any text", mode="study_notes")
    assert result is not None
    assert len(result) > 0

# Step 2: 🟢 Write minimum code to pass
# Step 3: 🔵 Refactor, keep tests green
```

**Run tests:**
```bash
cd backend
pytest tests/test_ai.py tests/test_cv.py tests/test_pdf_compiler.py -v
```

---

## ✅ Definition of Done

- [ ] **Tests written FIRST** for every AI pipeline (Red → Green → Refactor)
- [ ] All tests pass (`pytest -v`)
- [ ] 4-mode summarizer produces accurate, well-formatted summaries from 30+ page PDFs
- [ ] Arabic content is summarized correctly with proper RTL formatting
- [ ] OpenCV pipeline turns poorly lit phone photos into crisp monochrome pages
- [ ] Image OCR extracts handwritten text and organizes it into a structured study guide PDF
- [ ] Flashcard generator creates printable 2-column cards
- [ ] Simulation mode returns instant mock results when `GEMINI_API_KEY` is absent
- [ ] All generated PDFs open correctly in any PDF viewer
- [ ] All 5 acceptance tests in `TASKS.md` pass

---

## 💡 Tips

- **Gemini 1.5 Flash** is fast and cheap — use it for development. Switch to Gemini 1.5 Pro for production if quality matters more.
- **Chunking strategy**: Split PDF text into ~3000-token chunks, summarize each, then do a final "combine summaries" pass. This handles 100+ page documents.
- **ReportLab gotcha**: `Paragraph()` expects XML-like markup, not raw markdown. Convert markdown headers to `<b>` tags, bullets to `<bullet>` elements.
- **OpenCV deskew**: Use `cv2.minAreaRect()` on the largest contour to find the rotation angle, then `cv2.getRotationMatrix2D()` to straighten.
- **Test your prompts thoroughly.** The quality of your output depends entirely on prompt engineering. Iterate on prompts with real lecture content.
- **Save outputs to `ai_output/`** with the job ID in the filename: `ai_output/summary_{job_id}.pdf`.

Good luck! 🚀
