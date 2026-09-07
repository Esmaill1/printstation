# PrintStation — AI Features Specification

> Detailed specification of AI capabilities in PrintStation.  
> Core principle: **PrintStation is an AI study assistant that also prints.**

---

## 1. Overview

AI features transform PrintStation from a commodity printing service into a differentiated study tool. Every AI feature must meet two criteria:

1. **Solves a real student pain point** (not AI for the sake of AI)
2. **Directly connects to printing** (the output is a physical, printable document)

### Feature Classification

| Category | Description | Build? |
|---|---|---|
| 🟢 Killer features | Solve real pain, students will talk about it | YES |
| 🟡 Utility features | Useful but not exciting | Maybe (Phase 2–3) |
| 🔴 Pointless AI | AI for the sake of AI | NO |

---

## 2. Phase 1: Summarize & Print (لخص واطبع)

### Problem

Students have 60-page lecture PDFs. They don't need all 60 pages — they need key points on 3–4 pages. Printing 60 pages costs ~75 EGP. Most students won't bother.

### Solution

Upload document → AI extracts key points → generates a clean summary → student prints just the summary (4 pages instead of 60).

### User Flow

```
1. Student uploads PDF (e.g., 60-page lecture)
2. Student selects "Summarize & Print" option
3. Backend extracts text from PDF using pypdf
4. Text sent to Gemini API with summarization prompt
5. AI returns structured summary
6. Summary saved as text file
7. Student previews summary in web app
8. Student pays for summary pages (4 pages × 1.25 = 5.00 + 2.00 AI fee = 7.00 EGP)
9. Summary prints at kiosk
```

### Technical Implementation

#### Text Extraction

```python
import pypdf

def extract_text_from_pdf(filepath: str) -> str:
    reader = pypdf.PdfReader(filepath)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text
```

#### Gemini API Call

```python
import google.generativeai as genai

def summarize_document(text: str, custom_prompt: str = None) -> str:
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    system_prompt = """You are an academic study assistant. 
    Summarize the following lecture/document into concise, printable study notes.
    Format with clear headings, bullet points, and key formulas/definitions highlighted.
    Target: reduce to ~10% of original length while preserving all critical information."""
    
    if custom_prompt:
        system_prompt += f"\n\nAdditional focus: {custom_prompt}"
    
    response = model.generate_content(
        f"{system_prompt}\n\n---\n\n{text}"
    )
    return response.text
```

#### Summarization Modes

| Mode | Prompt Focus | Output |
|---|---|---|
| **Key Points** | "Extract the main ideas as bullet points" | Bulleted summary |
| **Study Notes** | "Organize into structured notes with headings" | Formatted notes |
| **Exam Prep** | "Focus on definitions, formulas, and testable facts" | Exam-ready cheat sheet |
| **Custom** | User-provided prompt | Varies |

### API Costs

| Provider | Free Tier | Cost After Free |
|---|---|---|
| Google Gemini API | 60 req/min, 1500/day | ~$0.001 per request |
| Estimated daily usage | ~50 summarizations | Well within free tier |

### Edge Cases

| Scenario | Handling |
|---|---|
| PDF has no extractable text (scanned) | Show error: "This PDF appears to be scanned. Text extraction is not possible. Try OCR mode (coming soon)." |
| Document is too short (<2 pages) | Show warning: "This document is already short. Summarization may not save pages." |
| Gemini API is down | Graceful fallback: "AI features temporarily unavailable. You can still print the full document." |
| Non-academic content | AI will still summarize; no content filtering needed |
| Arabic text | Gemini supports Arabic; include bilingual prompt handling |

---

## 3. Phase 2: Photo → Clean Document (حول صورة لملف مطبوع)

### Problem

Students photograph whiteboards, textbook pages, and handwritten notes. These photos are terrible for printing — skewed, shadowed, low contrast, finger in the corner.

### Solution

Upload photo → AI auto-crops, deskews, enhances contrast, removes shadows → outputs a clean, print-ready document.

### Technical Approach

```python
import cv2
import numpy as np

def enhance_document_photo(image_path: str) -> str:
    img = cv2.imread(image_path)
    
    # 1. Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. Detect document edges (Canny + contour finding)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # 3. Perspective transform (deskew)
    # ... find 4 corners, apply warpPerspective
    
    # 4. Adaptive thresholding (remove shadows)
    clean = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                   cv2.THRESH_BINARY, 11, 2)
    
    # 5. Save as print-ready PDF
    output_path = image_path.replace('.jpg', '_clean.pdf')
    # ... convert to PDF using Pillow
    return output_path
```

**Tech stack**: OpenCV (free, runs locally, no API cost)

---

## 4. Phase 2: Flashcard Generator (اعمل كروت مذاكرة)

### Problem

Making flashcards manually is tedious. Students know they work but don't bother.

### Solution

Upload lecture → AI generates question/answer flashcards → formatted as a printable PDF with cut lines.

### Output Format

```
┌─────────────────────┐  ┌─────────────────────┐
│                     │  │                     │
│  What is osmosis?   │  │  The movement of    │
│                     │  │  water molecules     │
│                     │  │  through a semi-     │
│         ✂️          │  │  permeable membrane  │
├─────────────────────┤  ├─────────────────────┤
│                     │  │                     │
│  Newton's 2nd Law?  │  │  F = ma             │
│                     │  │                     │
│         ✂️          │  │         ✂️          │
└─────────────────────┘  └─────────────────────┘
    FRONT SIDE              BACK SIDE
```

**Tech**: Gemini API for content extraction + PDF generation library (ReportLab or FPDF) for formatting.

---

## 5. Phase 2: OCR for Scanned Documents

### Problem

Students have scanned textbook pages that are blurry, non-searchable images inside PDFs.

### Solution

Upload scanned PDF → OCR extracts text → recreate as clean, searchable, print-optimized PDF.

**Tech**: Tesseract OCR (free, local, supports Arabic via trained data).

---

## 6. Phase 2: Smart Print Defaults

### Problem

Students don't know optimal print settings. They waste paper printing slides one-per-page.

### Solution

AI detects document type and suggests optimal settings automatically:

| Detected Type | Suggested Settings |
|---|---|
| Lecture slides (PPT-exported) | 2 per page, B&W, duplex |
| Thesis/report | Single-sided, normal margins |
| Handout with large text | 4 per page, B&W |
| Photos/diagrams | Full page, suggest color kiosk |
| Research paper (2-column) | Single page, B&W |

**Tech**: Simple classification based on PDF metadata + page aspect ratio + text density analysis. Barely needs ML — rules-based works fine.

---

## 7. Phase 3: Smart Slide Layout (رتب السلايدات)

### Problem

Students print PowerPoint slides one-per-page. 40 slides = 40 pages = expensive.

### Solution

AI analyzes each slide's content and decides optimal layout per slide:
- Text-heavy slides → 2 per page
- Diagram/image slides → 1 per page (need detail)
- Simple title slides → 4 or 6 per page

**Savings**: 40 slides → ~12–15 pages instead of 40 (60% cost reduction).

**Tech**: Vision AI (Gemini multimodal) to classify slide content + custom PDF layout engine.

---

## 8. Phase 3: Assignment Formatter

### Problem

Student has rough answers; needs to submit a clean printed assignment.

### Solution

Student types or uploads rough answers → AI formats into a professional document with university header, student info, and proper formatting.

---

## 9. Phase 3: Translation & Print (ترجم واطبع)

### Problem

Students studying English-language textbooks need Arabic translations.

### Solution

Upload document → AI translates → print the translation.

**Tech**: Gemini API (supports Arabic-English translation).

---

## 10. Features Explicitly NOT Building

| Feature | Why It's Pointless |
|---|---|
| AI chatbot for support | A FAQ page + WhatsApp group works better |
| AI-powered pricing | Pricing is simple multiplication: pages × rate |
| AI content moderation | Students print lectures, not illegal content. Solve if it actually occurs. |
| "AI-enhanced print quality" | The printer controls print quality, not software |
| Recommendation engine | "Students who printed this also printed…" — No. |
| AI-generated cover pages | A template is sufficient |

---

## 11. Infrastructure: Local vs Cloud

| Feature | Runs Where | API Cost |
|---|---|---|
| Summarize & Print | Gemini API (cloud) | Free tier: 1500 req/day |
| Photo enhancement | Server (OpenCV) | Free |
| Flashcard generation | Gemini API (cloud) | Free tier |
| OCR | Server (Tesseract) | Free |
| Smart slide layout | Server + Vision API | Mostly free |
| Assignment formatter | Gemini API (cloud) | Free tier |
| Translation | Gemini API (cloud) | Free tier |

> **Gemini API free tier** provides 60 requests/minute and 1500/day. For a prototype at one university, this is more than enough. AI costs become non-zero only at hundreds of daily jobs.

---

## 12. AI Pricing Impact

AI features create a new revenue category — **service fees** on top of printing:

| Scenario | Without AI | With AI |
|---|---|---|
| 60-page lecture | Student pays 75 EGP (or just doesn't print) | Student pays 7 EGP for 4-page summary |
| Whiteboard photos | Student doesn't print (too ugly) | Student pays 5 EGP for cleaned version |
| Exam prep flashcards | Student makes them manually (rarely) | Student pays 8 EGP for auto-generated set |

**Key insight**: AI converts non-customers into customers. Students who would never print 60 pages at 75 EGP will happily print 4 pages at 7 EGP. The AI fee is pure margin (~99%).
