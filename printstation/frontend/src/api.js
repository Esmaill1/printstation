/**
 * API client for PrintStation backend.
 */
const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');

/**
 * Upload a PDF file to the backend.
 */
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Upload failed');
  }

  return res.json();
}

/**
 * Apply AI processing to a job.
 */
export async function applyAI(jobId, mode, customPrompt = null) {
  const body = { mode };
  if (customPrompt) body.custom_prompt = customPrompt;

  const res = await fetch(`${API_BASE}/jobs/${jobId}/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'AI processing failed');
  }

  return res.json();
}

/**
 * Process payment for a job.
 */
export async function processPayment(jobId, paymentMethod) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_method: paymentMethod }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Payment failed');
  }

  return res.json();
}

/**
 * Get job status.
 */
export async function getJobStatus(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to get job status');
  }

  return res.json();
}

/**
 * Get stats.
 */
export async function getStats() {
  const res = await fetch(`${API_BASE}/stats`);

  if (!res.ok) {
    throw new Error('Failed to get stats');
  }

  return res.json();
}

/**
 * Update print options (Color, Duplex, N-up, Page Range, Copies, AI mode).
 */
export async function updatePrintOptions(jobId, options) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to update print options');
  }

  return res.json();
}

/**
 * Get PDF preview URL for iframe embedding.
 */
export function getPreviewUrl(jobId) {
  return `${API_BASE}/jobs/${jobId}/preview`;
}

/**
 * Get AI Summary preview URL for iframe embedding.
 */
export function getAiPreviewUrl(jobId) {
  return `${API_BASE}/jobs/${jobId}/ai-preview`;
}
