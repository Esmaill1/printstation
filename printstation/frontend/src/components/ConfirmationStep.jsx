import { SuccessMark } from './icons';

function ConfirmationStep({ jobData, pickupCode, onNewJob }) {
  return (
    <div className="step-card confirmation-card">
      <span className="success-icon"><SuccessMark /></span>
      <h2>Payment successful</h2>
      <p className="step-description">
        Your document is queued for printing. Take the pickup code below to the
        kiosk and enter it on the screen.
      </p>

      {/* The pickup ticket — printed, perforated, tear-off */}
      <div className="pickup-ticket">
        <span className="pickup-label">Pickup code</span>
        <div className="pickup-code">{pickupCode}</div>
        <div className="ticket-perf" aria-hidden="true"></div>
        <span className="pickup-hint">Enter this code on the kiosk screen</span>
      </div>

      <div className="confirmation-details">
        <div className="detail-row">
          <span>File</span>
          <span>{jobData.original_filename || jobData.filename}</span>
        </div>
        <div className="detail-row">
          <span>Pages & copies</span>
          <span>{jobData.total_pages || jobData.page_count} pages × {jobData.copies || 1} copy</span>
        </div>
        <div className="detail-row">
          <span>Print options</span>
          <span>
            {jobData.color_mode === 'color' ? 'Full color' : 'B&W'} · {jobData.duplex === 'duplex' ? 'Double-sided' : 'Single-sided'}
            {jobData.pages_per_sheet > 1 ? ` · ${jobData.pages_per_sheet}-Up` : ''}
          </span>
        </div>
        <div className="detail-row">
          <span>Total sheets</span>
          <span className="val-sheets">
            {jobData.total_physical_sheets || ((jobData.physical_sheets || 1) * (jobData.copies || 1))} paper sheets
          </span>
        </div>
        {jobData.ai_mode && jobData.ai_mode !== 'none' && (
          <div className="detail-row">
            <span>AI summary</span>
            <span>{jobData.original_pages} → {jobData.total_pages} pages</span>
          </div>
        )}
        <div className="detail-row">
          <span>Total paid</span>
          <span className="val-price">{jobData.total_price.toFixed(2)} EGP</span>
        </div>
        <div className="detail-row">
          <span>Status</span>
          <span className="status-badge status-paid">Ready at kiosk</span>
        </div>
      </div>

      <div className="step-actions" style={{ justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={onNewJob}>
          Print another document
        </button>
      </div>
    </div>
  );
}

export default ConfirmationStep;
