# Member 4 — AI & Document Intelligence Engineer

> **Role**: All intelligent features — turning PrintStation into a comprehensive campus AI study assistant that summarizes, cleans, and formats academic materials for printing.  
> **Tech Stack**: Google Gemini 1.5/2.0 API, OpenCV, ReportLab, pypdf, Tesseract OCR / Gemini Vision  
> **Target**: Full Final Production Product (All Features)

---

## 🎯 FINAL RESULT DELIVERABLES

A complete, production-grade document intelligence engine in `backend/app/services/ai_service.py` featuring:

1. **4-Mode Academic PDF Summarizer**:
   - Extracts text from university slide decks and PDF handouts using `pypdf`.
   - Implements chunking and map-reduce aggregation for long documents (up to 100+ pages).
   - Prompts Google Gemini with 4 tailored academic modes:
     - **Key Points**: Bulleted summary of essential concepts.
     - **Study Notes**: Structured outlines with major headings, sub-headings, and formulas.
     - **Exam Prep**: Key definitions, high-yield exam facts, and potential test questions.
     - **Custom Prompt**: Student provides their own prompt (e.g. "Focus only on chapter 3 formulas").
   - Full support for English and Arabic university curricula.

2. **Automated Print-Ready PDF Publisher (ReportLab)**:
   - Compiles raw Gemini markdown responses into a beautifully designed A4 PDF.
   - Clean academic formatting: document title, date, headings, bold callouts, page numbering footer (`Page X of Y`).
   - Dynamically calculates the new condensed page count (e.g. reducing a 40-page lecture slide deck to a 3-page summary) and updates the backend pricing engine so students save money.

3. **Image OCR → Organized Study Document (Vision OCR + LLM)**:
   - Takes student smartphone photos of handwritten notebooks, whiteboard notes, or textbook pages.
   - Executes multimodal Vision OCR (Gemini Vision + Tesseract) to accurately transcribe all handwritten text, mathematical formulas, and scientific diagrams.
   - Cleans and organizes noisy OCR text into a structured, titled academic study guide with clear section headers, bulleted points, formatted equations, and a "Key Takeaways" summary.
   - Automatically compiles the organized output into a professional, printable A4 PDF via ReportLab.

4. **Phone Photo → Clean Document Scanner (OpenCV)**:
   - Executes computer vision image processing pipeline:
     - Edge detection & contour extraction to find document boundary.
     - 4-point perspective transform (deskewing angled captures).
     - Illumination correction & shadow removal.
     - Adaptive thresholding (Otsu / Gaussian binarization) to convert noisy camera photos into crisp, high-contrast monochrome pages suitable for laser printing.
     - Compiles images into a single multi-page PDF.

5. **Exam Flashcard & Quiz Generator**:
   - Transforms lecture slides into printable **Study Flashcards** (2-column layout designed for double-sided printing: questions on front, answers on back).
   - Generates multiple-choice practice quizzes with an answer key appendix.

6. **Arabic OCR for Scanned Handouts**:
   - Integrates Gemini Vision / Tesseract OCR to extract text from scanned, image-only Arabic lecture PDFs before feeding into the summarizer.


---

## 🧪 Acceptance Criteria & Proof Tests

- [ ] **Test 1 (Lecture Summarization to PDF)**: Upload a 30-page PDF slide deck → in under 15 seconds, receive a formatted 3-page printable PDF in `ai_output/` with crisp typography, headers, and bullet points.
- [ ] **Test 2 (Bilingual Arabic Processing)**: Feed an Arabic university lecture PDF into the summarizer → receive an accurate, grammatically correct Arabic summary PDF with proper right-to-left layout.
- [ ] **Test 3 (OpenCV Photo Cleaner)**: Provide a poorly lit, angled smartphone photo of a whiteboard with handwriting → OpenCV pipeline outputs a deskewed, pure black-and-white page with crisp legible text and zero shadows.
- [ ] **Test 4 (Flashcard Generator)**: Trigger flashcard mode on a biology slide deck → output PDF contains 10 cleanly formatted study flashcards ready for double-sided cut-out printing.
- [ ] **Test 5 (Simulation Fallback)**: Unset `GEMINI_API_KEY` → service gracefully falls back to instant local mock summary without throwing unhandled exceptions.

---

## ⚡ Step-by-Step Implementation Checklist

### 1. Gemini Client & Text Extraction Pipeline
- [ ] Set up `google-generativeai` client in `backend/app/services/ai_service.py`.
- [ ] Build robust `extract_text(pdf_path)` using `pypdf`:
  - Detect if PDF contains digital text or scanned images.
  - If scanned images: dispatch to Gemini Vision OCR.
  - Implement token-aware sliding window / chunking for large PDFs.

### 2. Prompt Engineering & Summarization Modes
- [ ] Create specialized academic system prompts for:
  - `key_points`, `study_notes`, `exam_prep`, and `custom`.
- [ ] Implement retry logic with exponential backoff for Gemini API rate limits.
- [ ] Parse returned markdown and sanitize output.

### 3. ReportLab Document Compiler
- [ ] Build `compile_summary_pdf(markdown_text, output_path)`:
  - Custom `SimpleDocTemplate` with standard A4 margins.
  - Stylesheet for headings, paragraph spacing, bullet indentation, and code/math blocks.
  - Page number canvas callback for running headers and footers.
  - Return final physical page count to backend.

### 4. OpenCV Photo Enhancement Pipeline
- [ ] Build `clean_document_photo(image_path, output_pdf_path)`:
  - `cv2.findContours` to isolate document rectangle.
  - `cv2.getPerspectiveTransform` to straighten angled photos.
  - Background illumination leveling (divide by Gaussian blurred copy).
  - `cv2.adaptiveThreshold` for crisp monochrome binarization.
  - Export array of cleaned images to PDF.

### 5. Flashcard & Quiz Formatter
- [ ] Build `generate_flashcards(text, output_path)`:
  - Two-column card layout formatted for duplex printing.
- [ ] Wire all AI endpoints into FastAPI routes:
  - `POST /api/jobs/{id}/ai-summarize`
  - `GET /api/jobs/{id}/ai-preview`

---

## 📁 Files You Own

| File | Purpose |
|---|---|
| `backend/app/services/ai_service.py` | Core Gemini prompts, summarization, and mock fallback |
| `backend/app/services/cv_service.py` | OpenCV photo cleaning, deskewing, and shadow removal |
| `backend/app/services/pdf_compiler.py` | ReportLab printable PDF and flashcard generation |
| `ai_output/` | Directory where all AI-generated PDFs are saved |
