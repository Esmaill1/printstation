# ADR-001: Use FastAPI (Python) for Backend

> **Status**: Accepted  
> **Date**: September 2026  
> **Deciders**: PrintStation Team

## Context

We need a backend framework for the PrintStation API server. The backend handles file uploads, pricing calculations, payment processing, AI integration, and kiosk communication.

Key requirements:
- Handle file uploads (up to 50MB PDFs)
- Integrate with Gemini API (Python SDK available)
- Integrate with CUPS printing system (Python bindings available)
- Auto-generate API documentation
- Team familiarity

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| **FastAPI (Python)** | Async, auto-docs (Swagger), type-safe (Pydantic), Gemini SDK is Python, CUPS is Linux-native | Slower than compiled languages |
| **Express.js (Node)** | Large ecosystem, team knows JS | No native CUPS integration, Gemini SDK less mature |
| **Django (Python)** | Batteries included, admin panel | Too heavyweight, synchronous by default |
| **Spring Boot (Java)** | Enterprise-grade, strong typing | Overkill, slow dev cycle, no one on team knows Java well |

## Decision

**FastAPI** — because:
1. Same language (Python) as the kiosk agent → shared code, single runtime
2. Gemini API has a first-class Python SDK (`google-generativeai`)
3. CUPS has Python bindings (`pycups`) and command-line tools work from Python
4. Auto-generated Swagger docs at `/docs` — zero-effort API documentation
5. Pydantic provides request/response validation for free
6. Async support handles concurrent file uploads efficiently

## Consequences

- Team must learn Python type hints and async/await patterns
- Deployment requires Python 3.11+ and virtual environments
- Performance is sufficient for expected load (50-200 jobs/day per kiosk)
- If scaling to thousands of concurrent requests, may need to add Redis queue
