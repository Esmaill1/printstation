import { useState } from 'react';
import { processPayment } from '../api';
import { useTranslation } from '../i18n';

function PaymentStep({ jobData, onComplete, onBack }) {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState('free_trial');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const paymentMethods = [
    { id: 'fawry', name: t('payment.fawry'), icon: '💳', desc: t('payment.fawryDesc') },
    { id: 'vodafone_cash', name: t('payment.vodafoneCash'), icon: '📱', desc: t('payment.vodafoneCashDesc') },
    { id: 'instapay', name: t('payment.instapay'), icon: '🏦', desc: t('payment.instapayDesc') },
    { id: 'free_trial', name: t('options.aiCardBadge') || 'Demo', icon: '🎁', desc: t('payment.simulatedNotice') },
  ];

  const handlePay = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await processPayment(jobData.job_id, selectedMethod);
      onComplete(result);
    } catch (err) {
      setError(err.message || 'Payment failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="step-card">
      <h2>{t('payment.title')}</h2>
      <p className="step-description">{t('payment.description')}</p>

      <div className="payment-summary">
        <div className="payment-total">
          <span>{t('payment.totalAmount')}</span>
          <span className="total-amount">{jobData.total_price.toFixed(2)} EGP</span>
        </div>
        <div className="payment-specs-pills">
          <span className="spec-pill">{jobData.color_mode === 'color' ? t('options.color') : t('options.bw')}</span>
          <span className="spec-pill">{jobData.duplex === 'duplex' ? t('options.duplex') : t('options.simplex')}</span>
          {jobData.pages_per_sheet > 1 && (
            <span className="spec-pill">{jobData.pages_per_sheet}-Up</span>
          )}
          <span className="spec-pill">{jobData.copies || 1} {t('options.copies')}</span>
          <span className="spec-pill">{t('options.sheetsCount', { count: jobData.total_physical_sheets || ((jobData.physical_sheets || 1) * (jobData.copies || 1)) })}</span>
        </div>
      </div>

      <div className="payment-methods">
        <h3>{t('payment.selectMethod')}</h3>
        {paymentMethods.map((method) => (
          <label
            key={method.id}
            className={`payment-option ${selectedMethod === method.id ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="payment"
              checked={selectedMethod === method.id}
              onChange={() => setSelectedMethod(method.id)}
            />
            <span className="payment-icon" aria-hidden="true">{method.icon}</span>
            <div className="payment-info">
              <strong>{method.name}</strong>
              <p>{method.desc}</p>
            </div>
            {method.id === 'free_trial' && <span className="badge-proto">PROTOTYPE</span>}
          </label>
        ))}
      </div>

      <div className="simulated-notice">
        <p>{t('payment.simulatedNotice')}</p>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack} disabled={isProcessing}>
          {t('payment.backBtn')}
        </button>
        <button
          className="btn btn-primary btn-pay"
          onClick={handlePay}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="spinner-small"></span>
              {t('payment.processingPayment')}
            </>
          ) : (
            t('payment.payNowBtn', { amount: jobData.total_price.toFixed(2) })
          )}
        </button>
      </div>
    </div>
  );
}

export default PaymentStep;
