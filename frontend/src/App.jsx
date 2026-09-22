import React, { useState } from 'react';
import { useI18n } from './i18n';
import { FileUploader } from './components/FileUploader';
import { PrintOptions } from './components/PrintOptions';
import { PickupModal } from './components/PickupModal';
import './App.css';

/**
 * PrintStation Web App (Root Scheme / Scaffold).
 * 
 * Owner: Member 1 (Frontend Lead)
 * Ref: docs/team/member-1-frontend/TASKS.md
 * 
 * Responsibilities:
 * - Wrap state for current upload, options, payment, and modal visibility
 * - Provide header with logo and bilingual (EN/AR) toggle
 * - Render student workflow: Uploader -> Preview/Options -> Checkout -> Pickup Screen
 */
export function App() {
  const { t, toggleLang } = useI18n();

  const [currentJob, setCurrentJob] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [options, setOptions] = useState({
    color_mode: 'bw',
    duplex: 'single',
    pages_per_sheet: 1,
    copies: 1,
    ai_summarize: false,
  });

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

      {/* Main Student Flow */}
      {!currentJob ? (
        <FileUploader
          onFileSelected={(file) => {
            // Member 1: Wire to upload API in src/api.js
            setCurrentJob({ filename: file.name, page_count: 5, total_price: 6.25 });
          }}
          isLoading={false}
        />
      ) : (
        <div className="job-card">
          <PrintOptions
            options={options}
            onChange={setOptions}
            pageCount={currentJob.page_count}
          />
          <button className="pay-button" onClick={() => setShowPickupModal(true)}>
            {t('proceedToPay')}
          </button>
        </div>
      )}

      {/* Pickup Code & QR Modal */}
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
