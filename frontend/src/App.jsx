import React, { useState } from 'react';
import { useI18n } from './i18n';
import { FileUploader } from './components/FileUploader';
import { PrintOptions } from './components/PrintOptions';
import { PickupModal } from './components/PickupModal';
import { uploadDocument, updatePrintOptions, payForJob } from './api';
import './App.css';

export function App() {
  const { t, toggleLang } = useI18n();

  const [currentJob, setCurrentJob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);

  const [options, setOptions] = useState({
    color_mode: 'bw',
    duplex: 'single',
    pages_per_sheet: 1,
    copies: 1,
    ai_summarize: false,
  });

  const [estimatedPrice, setEstimatedPrice] = useState(0);

  const calculateClientEstimate = (pageCount, opts) => {
    const rate = opts.color_mode === 'color' ? 2.0 : 0.5;
    let sheetCount = pageCount;
    if (opts.duplex === 'long_edge' || opts.duplex === 'short_edge') {
      sheetCount = Math.ceil(pageCount / 2);
    }
    const copies = opts.copies || 1;
    let price = sheetCount * rate * copies;
    if (opts.ai_summarize) price += 2.0;
    return Math.max(3.0, price);
  };

  const handleFileSelected = async (file) => {
    setIsUploading(true);
    try {
      // In development, if backend is running, uploadDocument will call it.
      // Otherwise provide a fallback mock so frontend can be developed standalone.
      let jobData;
      try {
        jobData = await uploadDocument(file);
      } catch (err) {
        console.warn('Backend unavailable, using local mock for UI dev:', err.message);
        jobData = {
          job_id: Math.floor(Math.random() * 1000) + 1,
          filename: file.name,
          page_count: 8,
          preview_url: null,
          total_price: 4.0,
        };
      }

      setCurrentJob(jobData);
      setEstimatedPrice(jobData.total_price || calculateClientEstimate(jobData.page_count, options));
    } catch (e) {
      alert('Upload failed: ' + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOptionsChange = async (newOptions) => {
    setOptions(newOptions);
    if (!currentJob) return;

    // Recalculate estimated price
    const newPrice = calculateClientEstimate(currentJob.page_count, newOptions);
    setEstimatedPrice(newPrice);

    // Call backend if available
    try {
      const res = await updatePrintOptions(currentJob.job_id, newOptions);
      if (res && res.total_price) {
        setEstimatedPrice(res.total_price);
      }
    } catch {
      // Local estimate already set
    }
  };

  const handlePayment = async () => {
    if (!currentJob) return;
    setIsPaying(true);

    try {
      let result;
      try {
        result = await payForJob(currentJob.job_id, 'vodacash');
      } catch (err) {
        console.warn('Backend unavailable, using simulated payment:', err.message);
        result = {
          status: 'paid',
          pickup_code: String(Math.floor(100000 + Math.random() * 900000)),
        };
      }

      setCurrentJob((prev) => ({
        ...prev,
        pickup_code: result.pickup_code || '482910',
        status: 'paid',
        total_price: estimatedPrice,
      }));
      setShowPickupModal(true);
    } catch (e) {
      alert('Payment error: ' + e.message);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo-area">
          <div className="logo-icon">P</div>
          <div className="logo-text">
            <h1>{t('appTitle')}</h1>
            <p>{t('tagline')}</p>
          </div>
        </div>
        <button className="lang-btn" onClick={toggleLang}>
          {t('switchLang')}
        </button>
      </header>

      {/* Main Flow */}
      {!currentJob ? (
        <FileUploader onFileSelected={handleFileSelected} isLoading={isUploading} />
      ) : (
        <div className="job-card">
          <div className="file-info">
            <span className="file-title">{currentJob.filename}</span>
            <span className="file-pages">{currentJob.page_count} {t('pages')}</span>
          </div>

          <PrintOptions
            options={options}
            onChange={handleOptionsChange}
            pageCount={currentJob.page_count}
          />
        </div>
      )}

      {/* Sticky Checkout Bar when document is uploaded */}
      {currentJob && (
        <div className="checkout-bar">
          <div className="checkout-inner">
            <div className="price-details">
              <span className="price-amount">{estimatedPrice.toFixed(2)} EGP</span>
              <span className="min-tag">{t('minimumOrder')}</span>
            </div>
            <button
              className="pay-button"
              onClick={handlePayment}
              disabled={isPaying}
            >
              {isPaying ? 'Processing...' : t('proceedToPay')}
            </button>
          </div>
        </div>
      )}

      {/* Pickup Code Modal */}
      {showPickupModal && (
        <PickupModal
          job={currentJob}
          onClose={() => {
            setShowPickupModal(false);
            setCurrentJob(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
