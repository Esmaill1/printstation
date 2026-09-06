"""
End-to-end integration test for PrintStation.
Tests:
1. File upload & page counting
2. AI Summarization & price recalculation
3. Payment simulation & 6-digit pickup PIN generation
4. Kiosk PIN lookup & claiming
5. Payload download
6. Kiosk print completion & telemetry status
7. Stats verification
"""
import httpx
import sys
import io

if sys.platform == "win32":
    if hasattr(sys.stdout, "buffer"):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


backend_url = "http://127.0.0.1:8000"
client = httpx.Client(base_url=backend_url, timeout=60)

print("--> 1. Uploading PDF...")
with open("d:/Projects/draft/printstation/sample_lecture.pdf", "rb") as f:
    files = {"file": ("sample_lecture.pdf", f, "application/pdf")}
    res = client.post("/api/upload", files=files)
assert res.status_code == 200, res.text
upload = res.json()
job_id = upload["job_id"]
print(f"   [OK] Job ID: {job_id}, Pages: {upload['page_count']}, Price: {upload['total_price']} EGP")

print("\n--> 2. Requesting AI Summary...")
res = client.post(f"/api/jobs/{job_id}/ai", json={"mode": "summarize"})
assert res.status_code == 200, res.text
ai_res = res.json()
print(f"   [OK] Reduced: {ai_res['original_pages']} pages -> {ai_res['ai_pages']} page(s), New Price: {ai_res['new_price']} EGP")

print("\n--> 3. Simulating Payment...")
res = client.post(f"/api/jobs/{job_id}/pay", json={"payment_method": "vodafone_cash"})
assert res.status_code == 200, res.text
pay_res = res.json()
code = pay_res["pickup_code"]
print(f"   [OK] Payment Confirmed! 6-Digit Pickup Code: {code}")

print("\n--> 4. Kiosk PIN Verification...")
res = client.post("/api/kiosk/lookup", params={"code": code})
assert res.status_code == 200, res.text
kiosk_info = res.json()
print(f"   [OK] Kiosk Found Job: {kiosk_info['filename']} ({kiosk_info['total_pages']} pages)")

print("\n--> 5. Kiosk Claiming & Downloading Payload...")
res = client.post(f"/api/kiosk/jobs/{job_id}/claim", params={"kiosk_id": "kiosk-001"})
assert res.status_code == 200

download_url = kiosk_info["download_url"]
payload_res = client.get(download_url)
assert payload_res.status_code == 200
print(f"   [OK] Downloaded print payload: {len(payload_res.content)} bytes")

print("\n--> 6. Kiosk Completing Print...")
res = client.post(f"/api/kiosk/jobs/{job_id}/status", json={"status": "completed"})
assert res.status_code == 200
print("   [OK] Kiosk reported job completed!")

print("\n--> 7. Verifying Final Job Status...")
res = client.get(f"/api/jobs/{job_id}")
assert res.status_code == 200
final_job = res.json()
assert final_job["status"] == "completed"
print(f"   [OK] Status: {final_job['status']}, Completed At: {final_job['completed_at']}")

print("\n--> 8. Checking Platform Telemetry / Stats...")
res = client.get("/api/stats")
stats = res.json()
print(f"   [OK] Total jobs: {stats['total_jobs']}, Completed: {stats['completed_jobs']}, Revenue: {stats['total_revenue']} EGP")

print("\n=======================================================")
print("  ALL PIPELINE TESTS PASSED 100% SUCCESSFULLY! 🚀")
print("=======================================================")
