/**
 * PrintStation — API Client Module.
 *
 * All frontend HTTP calls to the backend go through this file.
 * Owner: Member 1 (Frontend)
 * Ref: docs/api-reference.md
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse(res) {
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const data = await res.json();
      errorDetail = data.detail || data.message || JSON.stringify(data);
    } catch {
      errorDetail = `${res.status} ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

/**
 * Upload a document to create a new print job.
 * @param {File} file
 * @returns {Promise<{job_id: number, filename: string, page_count: number, preview_url: string}>}
 */
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

/**
 * Update print options and recalculate pricing.
 * @param {number} jobId
 * @param {object} options
 */
export async function updatePrintOptions(jobId, options) {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return handleResponse(res);
}

/**
 * Get current job status and details.
 * @param {number} jobId
 */
export async function getJobStatus(jobId) {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
  return handleResponse(res);
}

/**
 * Request AI Summarization for a job.
 * @param {number} jobId
 * @param {string} promptMode ('key_points' | 'study_notes' | 'exam_prep' | 'custom')
 * @param {string} customPrompt
 */
export async function triggerAiSummary(jobId, promptMode = 'key_points', customPrompt = '') {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}/ai-summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt_mode: promptMode, custom_prompt: customPrompt }),
  });
  return handleResponse(res);
}

/**
 * Process payment for a job.
 * @param {number} jobId
 * @param {string} paymentMethod ('fawry' | 'vodacash' | 'instapay' | 'card')
 * @param {string} phoneNumber
 */
export async function payForJob(jobId, paymentMethod = 'vodacash', phoneNumber = '') {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_method: paymentMethod, phone_number: phoneNumber }),
  });
  return handleResponse(res);
}
