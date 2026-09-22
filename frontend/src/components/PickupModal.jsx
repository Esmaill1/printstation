import React from 'react';
import { useI18n } from '../i18n';

/**
 * PickupModal Component (Skeleton / Scheme).
 * 
 * Owner: Member 1 (Frontend Lead)
 * Ref: docs/team/member-1-frontend/TASKS.md §6
 * 
 * TODO (Member 1):
 * 1. Render high-contrast 6-digit pickup code with one-click copy to clipboard.
 * 2. Render dynamic QR code SVG for touchless scanning at the kiosk camera.
 * 3. Display campus kiosk pickup location instructions.
 */
export function PickupModal({ job, onClose }) {
  const { t } = useI18n();

  if (!job) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>{t('pickupCodeHeader')}</h2>
        <p className="modal-subtext">{t('pickupCodeInstruction')}</p>

        {/* Member 1: Render 6-digit PIN and dynamic QR code */}
        <div className="pickup-code-display">
          <span className="code-letters">{job.pickup_code || '------'}</span>
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
