import { useState, useEffect } from 'react';
import './App.css';
import UploadStep from './components/UploadStep';
import OptionsStep from './components/OptionsStep';
import PaymentStep from './components/PaymentStep';
import ConfirmationStep from './components/ConfirmationStep';
import StatusTracker from './components/StatusTracker';
import KioskScreen from './components/KioskScreen';
import { BrandMark } from './components/icons';
import { getJobStatus } from './api';
import { useTranslation, LanguageToggle } from './i18n';

const STEPS = ['upload', 'options', 'payment', 'confirmation'];

/* Each workflow step lays down one process color, in print order:
   Upload = Cyan, Options = Magenta, Payment = Yellow, Done = Black. */
const STEP_COLORS = {
  upload: 'var(--c-cyan)',
  options: 'var(--c-magenta)',
  payment: 'var(--c-yellow)',
  confirmation: 'var(--ink)',
};

/* The registration strip: printed on every sheet that leaves a real
   press, printed on every screen that leaves this app. */
function RegStrip() {
  return (
    <div className="reg-strip" aria-hidden="true">
      <span className="reg-c" />
      <span className="reg-m" />
      <span className="reg-y" />
      <span className="reg-k" />
    </div>
  );
}

function App() {
  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'kiosk' ? 'kiosk' : 'student';
  });

  const [currentStep, setCurrentStep] = useState('upload');
  const [jobData, setJobData] = useState(null);
  const [pickupCode, setPickupCode] = useState(null);

  // Sync URL query parameter without full reload
  useEffect(() => {
    const url = new URL(window.location.href);
    if (viewMode === 'kiosk') {
      url.searchParams.set('view', 'kiosk');
    } else {
      url.searchParams.delete('view');
    }
    window.history.replaceState({}, '', url);
  }, [viewMode]);

  // Allow direct job loading via ?job_id=XX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobIdParam = params.get('job_id');
    if (jobIdParam && !jobData) {
      getJobStatus(jobIdParam)
        .then((data) => {
          setJobData(data);
          setCurrentStep('options');
        })
        .catch((err) => console.error('Failed to load job from URL:', err));
    }
  }, []);

  const goToStep = (step) => setCurrentStep(step);

  const handleUploadComplete = (data) => {
    setJobData(data);
    goToStep('options');
  };

  const handleOptionsComplete = (updatedData) => {
    setJobData(updatedData);
    goToStep('payment');
  };

  const handlePaymentComplete = (paymentResult) => {
    setPickupCode(paymentResult.pickup_code);
    setJobData((prev) => ({ ...prev, ...paymentResult }));
    goToStep('confirmation');
  };

  const handleNewJob = () => {
    setJobData(null);
    setPickupCode(null);
    goToStep('upload');
  };

  const { t, isRtl } = useTranslation();
  const stepIndex = STEPS.indexOf(currentStep);

  const STEP_LABELS = {
    upload: t('steps.upload'),
    options: t('steps.options'),
    payment: t('steps.payment'),
    confirmation: t('steps.confirmation'),
  };

  // If in kiosk view mode, render full ATM Touchscreen UI
  if (viewMode === 'kiosk') {
    return (
      <div className="kiosk-app-wrapper">
        <RegStrip />
        <header className="kiosk-global-nav">
          <div className="nav-brand">
            <span className="nav-dot"></span>
            <strong>{t('brand.simulatorTitle')}</strong>
          </div>
          <div className="header-actions">
            <LanguageToggle />
            <div className="view-mode-toggle">
              <button
                className={`mode-btn ${viewMode === 'student' ? 'active' : ''}`}
                onClick={() => setViewMode('student')}
              >
                {t('nav.studentPhoneView')}
              </button>
              <button
                className={`mode-btn ${viewMode === 'kiosk' ? 'active' : ''}`}
                onClick={() => setViewMode('kiosk')}
              >
                {t('nav.kioskTouchscreenView')}
              </button>
            </div>
          </div>
        </header>

        <main className="kiosk-fullscreen-container">
          <KioskScreen onSwitchView={() => setViewMode('student')} />
        </main>
      </div>
    );
  }

  // Otherwise, render Student Portal Workflow
  return (
    <div className="app-shell">
      <RegStrip />
      <div className={`app ${currentStep === 'options' ? 'app-wide' : ''}`}>
        <header className="app-header">
          <div className="header-top-row">
            <div className="brand">
              <BrandMark className="brand-mark" />
              <div>
                <h1 className="brand-name">{t('brand.name')}</h1>
                <p className="brand-sub">{t('brand.sub')}</p>
              </div>
            </div>

            <div className="header-actions">
              <LanguageToggle />
              <div className="view-mode-toggle">
                <button
                  className={`mode-btn ${viewMode === 'student' ? 'active' : ''}`}
                  onClick={() => setViewMode('student')}
                >
                  {t('nav.studentView')}
                </button>
                <button
                  className={`mode-btn ${viewMode === 'kiosk' ? 'active' : ''}`}
                  onClick={() => setViewMode('kiosk')}
                >
                  {t('nav.kioskView')}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="progress-bar" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
          {STEPS.map((step, i) => (
            <div
              key={step}
              className={`progress-step ${i <= stepIndex ? 'active' : ''} ${i < stepIndex ? 'completed' : ''}`}
              style={{ '--step-color': STEP_COLORS[step] }}
            >
              <div className="step-dot">
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <span className="step-label">
                {STEP_LABELS[step]}
              </span>
            </div>
          ))}
          <div className="progress-line">
            <div
              className="progress-fill"
              style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <main className="main-content">
          {currentStep === 'upload' && (
            <UploadStep onComplete={handleUploadComplete} />
          )}
          {currentStep === 'options' && jobData && (
            <OptionsStep
              jobData={jobData}
              onComplete={handleOptionsComplete}
              onBack={() => goToStep('upload')}
            />
          )}
          {currentStep === 'payment' && jobData && (
            <PaymentStep
              jobData={jobData}
              onComplete={handlePaymentComplete}
              onBack={() => goToStep('options')}
            />
          )}
          {currentStep === 'confirmation' && (
            <ConfirmationStep
              jobData={jobData}
              pickupCode={pickupCode}
              onNewJob={handleNewJob}
            />
          )}
        </main>

        {jobData && currentStep === 'confirmation' && (
          <div className="kiosk-shortcut-banner">
            <div className="shortcut-text">
              <span>{t('confirmation.kioskBannerTitle')}</span>
              <p>
                {t('confirmation.kioskBannerDesc', { code: pickupCode })}
              </p>
            </div>
            <button className="btn-kiosk-jump" onClick={() => setViewMode('kiosk')}>
              {t('confirmation.kioskBannerBtn')}
            </button>
          </div>
        )}

        {jobData && currentStep === 'confirmation' && (
          <StatusTracker jobId={jobData.job_id} />
        )}

        <footer className="app-footer">
          <p>{t('brand.footer')}</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
