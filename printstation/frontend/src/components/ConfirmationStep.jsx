import { SuccessMark } from './icons';
import { useTranslation } from '../i18n';

function ConfirmationStep({ jobData, pickupCode, onNewJob }) {
  const { t } = useTranslation();

  return (
    <div className="step-card confirmation-card">
      <span className="success-icon"><SuccessMark /></span>
      <h2>{t('confirmation.title')}</h2>
      <p className="step-description">
        {t('confirmation.description')}
      </p>

      {/* The pickup ticket — printed, perforated, tear-off */}
      <div className="pickup-ticket">
        <span className="pickup-label">{t('confirmation.pickupCodeLabel')}</span>
        <div className="pickup-code">{pickupCode}</div>
        <div className="ticket-perf" aria-hidden="true"></div>
        <span className="pickup-hint">{t('confirmation.step2')}</span>
      </div>

      <div className="confirmation-details">
        <div className="detail-row">
          <span>{t('confirmation.file')}</span>
          <span>{jobData.original_filename || jobData.filename}</span>
        </div>
        <div className="detail-row">
          <span>{t('options.totalPages')}</span>
          <span>{jobData.total_pages || jobData.page_count} pages × {jobData.copies || 1}</span>
        </div>
        <div className="detail-row">
          <span>{t('options.printOptions')}</span>
          <span>
            {jobData.color_mode === 'color' ? t('options.color') : t('options.bw')} · {jobData.duplex === 'duplex' ? t('options.duplex') : t('options.simplex')}
            {jobData.pages_per_sheet > 1 ? ` · ${jobData.pages_per_sheet}-Up` : ''}
          </span>
        </div>
        <div className="detail-row">
          <span>{t('options.estimatedSheets')}</span>
          <span className="val-sheets">
            {t('options.sheetsCount', { count: jobData.total_physical_sheets || ((jobData.physical_sheets || 1) * (jobData.copies || 1)) })}
          </span>
        </div>
        {jobData.ai_mode && jobData.ai_mode !== 'none' && (
          <div className="detail-row">
            <span>{t('options.aiCardBadge')}</span>
            <span>{jobData.original_pages} → {jobData.total_pages} pages</span>
          </div>
        )}
        <div className="detail-row">
          <span>{t('confirmation.totalPaid')}</span>
          <span className="val-price">{jobData.total_price.toFixed(2)} EGP</span>
        </div>
        <div className="detail-row">
          <span>{t('kiosk.price')}</span>
          <span className="status-badge status-paid">{t('confirmation.badge')}</span>
        </div>
      </div>

      <div className="step-actions" style={{ justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={onNewJob}>
          {t('confirmation.printAnotherBtn')}
        </button>
      </div>
    </div>
  );
}

export default ConfirmationStep;
