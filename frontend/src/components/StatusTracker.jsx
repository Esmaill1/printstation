import { useState, useEffect } from 'react';
import { getJobStatus } from '../api';

const STATUS_DISPLAY = {
  uploaded: { icon: '📤', label: 'Uploaded', color: '#8B95A0' },
  processing: { icon: '🤖', label: 'AI processing...', color: '#E5007D' },
  ready_to_pay: { icon: '💳', label: 'Ready to pay', color: '#7A6200' },
  paid: { icon: '⏳', label: 'Waiting for kiosk', color: '#00729B' },
  printing: { icon: '🖨️', label: 'Printing...', color: '#00729B' },
  completed: { icon: '✅', label: 'Printed', color: '#00729B' },
  failed: { icon: '❌', label: 'Failed', color: '#E5007D' },
  cancelled: { icon: '🚫', label: 'Cancelled', color: '#8B95A0' },
};

function StatusTracker({ jobId }) {
  const [status, setStatus] = useState(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!jobId || !polling) return;

    const fetchStatus = async () => {
      try {
        const data = await getJobStatus(jobId);
        setStatus(data);

        // Stop polling if job is done
        if (['completed', 'failed', 'cancelled'].includes(data.status)) {
          setPolling(false);
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [jobId, polling]);

  if (!status) return null;

  const display = STATUS_DISPLAY[status.status] || STATUS_DISPLAY.uploaded;

  return (
    <div className="status-tracker" aria-live="polite">
      <h3>Live status</h3>
      <div className="status-display" style={{ borderColor: display.color }}>
        <span className="status-icon" aria-hidden="true">{display.icon}</span>
        <span className="status-label" style={{ color: display.color }}>
          {display.label}
        </span>
        {polling && <span className="pulse-dot" aria-hidden="true"></span>}
      </div>
      {status.status === 'completed' && (
        <p className="status-message success">
          Your document has been printed. Collect it from the kiosk tray.
        </p>
      )}
      {status.status === 'failed' && (
        <p className="status-message error">
          Something went wrong: {status.error_message || 'Unknown error'}. Ask the
          kiosk attendant for help.
        </p>
      )}
    </div>
  );
}

export default StatusTracker;
