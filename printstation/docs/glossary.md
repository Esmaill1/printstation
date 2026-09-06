# PrintStation — Glossary

> Definitions of terms, acronyms, and concepts used across PrintStation documentation.

---

## Product Terms

| Term | Definition |
|---|---|
| **PrintStation** | The complete product: web app + backend + kiosk + printer |
| **Kiosk** | The physical unit consisting of a Raspberry Pi, touchscreen, and laser printer |
| **Pickup Code** | A 6-digit alphanumeric code given to the student after payment, used to collect printed pages at the kiosk |
| **Print Job** | A single request to print a document, tracked from upload through completion |
| **Kiosk Agent** | The Python daemon running on the Raspberry Pi that polls for jobs and drives the printer |
| **Virtual Printer** | A software simulation of the printing process used during development without physical hardware |

## User Roles

| Term | Definition |
|---|---|
| **Student** | Primary end user who uploads documents, pays, and collects printouts |
| **Admin** | System operator who monitors kiosks, manages inventory, and handles issues |
| **Kiosk Operator** | Person responsible for physical maintenance (paper, toner, hardware) |

## AI Features

| Term | Definition |
|---|---|
| **Summarize & Print** | AI feature that condenses a long document into key points before printing |
| **Photo → Clean Document** | AI feature that enhances a phone photo into a print-ready document |
| **Flashcard Generator** | AI feature that creates printable question/answer flashcards from lecture content |
| **Smart Print Defaults** | AI detection of document type to suggest optimal print settings |
| **OCR** | Optical Character Recognition — extracting text from scanned/photographed documents |

## Technical Terms

| Term | Definition |
|---|---|
| **CUPS** | Common UNIX Printing System — the standard print management system on Linux, used by the kiosk agent to control the printer |
| **FastAPI** | Python web framework used for the backend API server |
| **Uvicorn** | ASGI server that runs the FastAPI application |
| **PWA** | Progressive Web App — a web application that behaves like a native app (offline support, home screen install) |
| **PDF.js** | Mozilla's JavaScript library for rendering PDFs in the browser, used for document preview |
| **Gemini API** | Google's large language model API, used for AI summarization and flashcard generation |
| **OpenCV** | Open-source computer vision library, used for photo enhancement features |
| **Tesseract** | Open-source OCR engine, used for text extraction from scanned documents |
| **pypdf** | Python library for reading and manipulating PDF files (page counting, text extraction) |
| **HPLIP** | HP Linux Imaging and Printing — drivers for HP printers on Linux |
| **Paymob** | Egypt's leading payment gateway, providing Fawry, VodaCash, InstaPay integrations |

## Payment Terms

| Term | Definition |
|---|---|
| **Fawry** | Egyptian electronic payment service; students can pay at Fawry kiosks, through the app, or via reference codes |
| **Vodafone Cash (VodaCash)** | Mobile wallet service by Vodafone Egypt |
| **InstaPay** | Egypt's national instant payment network for bank-to-bank transfers |
| **Paymob** | Payment gateway aggregator — single integration providing access to Fawry, VodaCash, InstaPay, and cards |
| **Payment Intent** | A server-side record representing a pending payment, created before the student pays |
| **Webhook** | HTTP callback from Paymob to our backend confirming payment completion |

## Hardware Terms

| Term | Definition |
|---|---|
| **Raspberry Pi (RPi)** | Small single-board computer used as the kiosk controller |
| **Laser Printer** | Printer using toner and laser technology; preferred for speed, reliability, and cost-per-page |
| **Duplex** | Double-sided printing (both sides of the paper) |
| **N-up / Pages per Sheet** | Printing multiple document pages onto a single physical sheet (e.g., 2-up = 2 pages per sheet) |
| **Duty Cycle** | Maximum pages a printer is designed to handle per month |
| **Toner** | Dry powder used by laser printers (vs. liquid ink in inkjet printers) |
| **UPS** | Uninterruptible Power Supply — battery backup for graceful shutdown during power loss |

## Business Terms

| Term | Definition |
|---|---|
| **سجل تجاري** | Egyptian Commercial Register — required for operating a business and using Paymob |
| **بطاقة ضريبية** | Egyptian Tax Card — required alongside the commercial register |
| **TAM** | Total Addressable Market — the total revenue opportunity if 100% market share is achieved |
| **SAM** | Serviceable Addressable Market — the portion of TAM reachable with current capabilities |
| **Break-even** | The point at which cumulative revenue equals cumulative costs |
| **Gross Margin** | (Revenue − Cost of Goods) / Revenue — how much profit per page before overhead |

## Status Values

| Status | Description |
|---|---|
| `uploaded` | File received and stored, awaiting options selection |
| `processing` | AI processing or file conversion in progress |
| `ready_to_pay` | Options confirmed, price calculated, awaiting payment |
| `paid` | Payment confirmed, job queued for printing |
| `queued` | Job assigned to a kiosk, waiting for kiosk to claim |
| `printing` | Kiosk is actively printing the document |
| `printed` | Print completed successfully |
| `dispensed` | Student has collected the printed pages (if tracked) |
| `failed` | Print job failed (paper jam, error, etc.) |
| `cancelled` | Job cancelled by student or system |
