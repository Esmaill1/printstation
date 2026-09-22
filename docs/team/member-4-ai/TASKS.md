# Member 4 — AI & Document Processing Engineer

> **Role**: Intelligence features — turning PrintStation into an AI study assistant that produces clean, concise printouts.  
> **Tech Stack**: Google Gemini API, ReportLab, OpenCV, pypdf  
> **Sprint Timeline**: 3 Days (AI-Accelerated)

---

## 🎯 FINAL RESULT DELIVERABLE

A complete document intelligence module in `backend/app/services/ai_service.py` providing:
1. **AI Study Notes & Summarization**: Extracts text from student PDF slides/handouts, queries Gemini with 4 tailored academic prompts (Key Points, Study Notes, Exam Prep, Custom), and compiles the summary into a clean, professional, printable PDF using `reportlab`.
2. **Phone Photo → Clean Document**: An OpenCV processing pipeline that takes student smartphone photos of handwritten notes/whiteboards, deskews them, removes shadows, enhances contrast, and converts them into crisp, printer-ready monochrome PDFs.
3. **Simulation Mode**: Instant fallback summary generation when running offline without a Gemini API key.

### 🧪 The Proof Test (Acceptance Criteria)
> 1. Pass a 20-page university lecture PDF to `ai_service.py` → in under 15 seconds, receive a beautiful, formatted 2-page PDF summary in `ai_output/` with title, bullet points, and page numbers.
> 2. Pass a shadowed, angled phone photo of whiteboard notes to the OpenCV cleaner → receive a deskewed, pure black-and-white PDF with crisp legible text.

---

## ⚡ 3-Day Sprint Plan

### Day 1: Text Extraction & Gemini Integration
- [ ] Review `backend/app/services/ai_service.py`.
- [ ] Set up Gemini API key in `backend/.env` (`GEMINI_API_KEY=...`).
- [ ] Implement text extraction from uploaded PDF using `pypdf.PdfReader`:
  - Handle multi-page documents.
  - Add character/token limit guardrails to avoid hitting API context limits.
- [ ] Implement Gemini prompt runner supporting 4 academic modes:
  - `key_points`: Bullet-point highlights of core concepts.
  - `study_notes`: Structured lecture notes with section headings.
  - `exam_prep`: Definitions, formulas, and high-probability exam questions.
  - `custom`: Append user-provided instructions to the system prompt.
- [ ] Support English and Arabic lecture text seamlessly.

### Day 2: Printable PDF Generation (ReportLab)
- [ ] Build `generate_summary_pdf(summary_text, target_path)` using ReportLab:
  - Clean typographic layout (title, date, formatted headings, bullet points).
  - Proper margin setup for A4 paper printing.
  - Page numbering footer (`Page X of Y`).
  - Calculate physical page count of the generated summary PDF and return it to the backend so the student is charged the correct lower price (e.g. 2 pages instead of 20).

### Day 3: OpenCV Document Enhancer & Pipeline Wiring
- [ ] Implement OpenCV document photo cleanup:
  - Step 1: Grayscale conversion.
  - Step 2: Gaussian blur & adaptive thresholding (`cv2.adaptiveThreshold` or Otsu).
  - Step 3: Perspective transform / deskew (detect document corners).
  - Step 4: Shadow removal and contrast stretching.
  - Step 5: Convert cleaned image array into a standard printable PDF.
- [ ] Wire the service into `POST /api/jobs/{id}/ai-summarize` and `GET /api/jobs/{id}/ai-preview`.
- [ ] Execute **The Proof Test** with sample university lecture slides.

---

## 📁 Files You Own

| File | Purpose |
|---|---|
| `backend/app/services/ai_service.py` | Text extraction, Gemini API prompts, PDF generation, OpenCV cleaner |
| `backend/app/main.py` *(AI routes)* | `POST /api/jobs/{id}/ai-summarize` and `GET /api/jobs/{id}/ai-preview` |
| `ai_output/` | Directory where processed and summarized PDFs are stored |

---

## 🔌 Interfaces & Contracts You Depend On

- **Backend (Member 2)**: Reads original file path from `PrintJob`, writes generated PDF path to `ai_result_filename`, and updates `page_count` and `total_price`.
- **Frontend (Member 1)**: Receives summary preview text to display in the UI before printing.

---

## 🔮 Future Enhancements (Phase 2)
- Tesseract OCR for scanned image-only Arabic textbooks.
- Practice quiz & flashcard auto-generation from lecture slides.
- Multi-document comparison and synthesis.
