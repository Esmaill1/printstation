"""Generate a high-page-count test PDF by repeating the sample lecture pages."""
import sys
from PyPDF2 import PdfReader, PdfWriter

src = "sample_lecture.pdf"
dst = "sample_200p.pdf"
count = int(sys.argv[1]) if len(sys.argv) > 1 else 200

reader = PdfReader(src)
writer = PdfWriter()
n = len(reader.pages)
for i in range(count):
    writer.add_page(reader.pages[i % n])

with open(dst, "wb") as f:
    writer.write(f)

print(f"created {len(PdfReader(dst).pages)} pages")
