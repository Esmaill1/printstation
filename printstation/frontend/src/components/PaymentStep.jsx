import { useState } from 'react';
import { processPayment } from '../api';

const PAYMENT_METHODS = [
  { id: 'fawry', name: 'Fawry', icon: '💳', desc: 'Pay at any Fawry outlet or in the Fawry app' },
  { id: 'vodafone_cash', name: 'Vodafone Cash', icon: '📱', desc: 'Pay from your Vodafone Cash wallet' },
  { id: 'instapay', name: 'InstaPay', icon: '🏦', desc: 'Bank transfer via InstaPay' },
  { id: 'free_trial', name: 'Free Trial', icon: '🎁', desc: 'Prototype mode — no charge' },
];

function PaymentStep({ jobData, onComplete, onBack }) {
  const [selectedMethod, setSelectedMethod] = useState('free_trial');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

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
      <h2>Payment</h2>

      <div className="payment-summary">
        <div className="payment-total">
          <span>Total to pay</span>
          <span className="total-amount">{jobData.total_price.toFixed(2)} EGP</span>
        </div>
        <div className="payment-specs-pills">
          <span className="spec-pill">{jobData.color_mode === 'color' ? 'Color' : 'B&W'}</span>
          <span className="spec-pill">{jobData.duplex === 'duplex' ? 'Double-sided' : 'Single-sided'}</span>
          {jobData.pages_per_sheet > 1 && (
            <span className="spec-pill">{jobData.pages_per_sheet}-Up</span>
          )}
          <span className="spec-pill">{jobData.copies || 1} {(jobData.copies || 1) === 1 ? 'copy' : 'copies'}</span>
          <span className="spec-pill">{jobData.total_physical_sheets || ((jobData.physical_sheets || 1) * (jobData.copies || 1))} sheets</span>
        </div>
        <div className="payment-details">
          <span>{jobData.total_pages || jobData.page_count} pages · Rate: {jobData.price_per_page?.toFixed(2) || (jobData.color_mode === 'color' ? '3.50' : '1.25')} EGP/side</span>
          {jobData.ai_mode && jobData.ai_mode !== 'none' && (
            <span className="ai-fee">+ AI processing fee (+2.00 EGP)</span>
          )}
        </div>
      </div>

      <div className="payment-methods">
        <h3>Choose payment method</h3>
        {PAYMENT_METHODS.map((method) => (
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
        <p>
          All payments are <strong>simulated</strong> in this prototype — nothing is
          charged. Production will integrate Paymob.
        </p>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack} disabled={isProcessing}>
          ← Back
        </button>
        <button
          className="btn btn-primary btn-pay"
          onClick={handlePay}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="spinner-small"></span>
              Processing...
            </>
          ) : (
            `Pay ${jobData.total_price.toFixed(2)} EGP →`
          )}
        </button>
      </div>
    </div>
  );
}

export default PaymentStep;
