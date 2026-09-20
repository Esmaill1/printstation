import React, { useState } from 'react';
import { useI18n } from '../i18n';

export function PickupModal({ job, onClose }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  if (!job) return null;

  const copyCode = () => {
    if (job.pickup_code) {
      navigator.clipboard.writeText(job.pickup_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-success-badge">✓</div>
        <h2>{t('pickupCodeHeader')}</h2>
        <p className="modal-subtext">{t('pickupCodeInstruction')}</p>

        <div className="pickup-code-display" onClick={copyCode} title="Click to copy">
          <span className="code-letters">{job.pickup_code || '------'}</span>
          <span className="copy-badge">{copied ? 'Copied!' : 'Copy'}</span>
        </div>

        <div className="kiosk-note">
          📍 {t('kioskLocation')}
        </div>

        <div className="job-summary-row">
          <span>{job.filename}</span>
          <span>{job.page_count} pages • {job.total_price} EGP</span>
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
