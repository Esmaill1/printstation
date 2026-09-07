import { useState, useMemo } from 'react';
import { updatePrintOptions, getPreviewUrl, getAiPreviewUrl } from '../api';
import { BrandMark, AiMark } from './icons';
import PdfPreview from './PdfPreview';
import { useTranslation } from '../i18n';

function parsePageRangeCount(rangeStr, totalPages) {
  if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
    return totalPages;
  }
  const clean = rangeStr.replace(/\s+/g, '');
  const pages = new Set();
  const parts = clean.split(',');
  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          pages.add(i);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pages.add(p);
      }
    }
  }
  return pages.size > 0 ? pages.size : totalPages;
}

function OptionsStep({ jobData, onComplete, onBack }) {
  const { t } = useTranslation();
  const [colorMode, setColorMode] = useState(jobData.color_mode || 'bw');
  const [duplex, setDuplex] = useState(jobData.duplex || 'simplex');
  const [pagesPerSheet, setPagesPerSheet] = useState(jobData.pages_per_sheet || 1);
  const [pageSelectionType, setPageSelectionType] = useState('all');
  const [customRange, setCustomRange] = useState('');
  const [copies, setCopies] = useState(jobData.copies || 1);
  const [aiMode, setAiMode] = useState(jobData.ai_mode || 'none');
  const [customPrompt, setCustomPrompt] = useState('');
  const [previewTab, setPreviewTab] = useState('pdf'); // 'pdf' | 'ai'

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const totalDocPages = jobData.page_count || jobData.total_pages || 1;

  // Real-time calculation
  const calculation = useMemo(() => {
    let effectivePages = totalDocPages;
    if (aiMode === 'summarize') {
      // Estimated AI summary page count
      effectivePages = Math.max(1, Math.ceil(totalDocPages / 10));
    } else if (pageSelectionType === 'custom' && customRange.trim()) {
      effectivePages = parsePageRangeCount(customRange, totalDocPages);
    }

    const nUp = Math.max(1, Number(pagesPerSheet) || 1);
    const numCopies = Math.max(1, Number(copies) || 1);
    const printedSidesPerCopy = Math.max(1, Math.ceil(effectivePages / nUp));

    // Rate with duplex discount when printing both sides (more than 1 printed side)
    const isDuplexActive = duplex === 'duplex' && printedSidesPerCopy > 1;
    let rate;
    if (colorMode === 'color') {
      rate = isDuplexActive ? 2.75 : 3.50;
    } else {
      rate = isDuplexActive ? 1.00 : 1.25;
    }

    const sheetsPerCopy = duplex === 'duplex' ? Math.max(1, Math.ceil(printedSidesPerCopy / 2)) : printedSidesPerCopy;
    const totalPhysicalSheets = sheetsPerCopy * numCopies;

    const baseCost = printedSidesPerCopy * numCopies * rate;
    const aiFee = aiMode === 'summarize' ? 2.00 : 0.00;
    const totalPrice = Math.max(1.25, Math.round((baseCost + aiFee) * 100) / 100);

    const standardTotalSheets = totalDocPages * numCopies;
    const sheetsSaved = Math.max(0, standardTotalSheets - totalPhysicalSheets);

    return {
      effectivePages,
      printedSidesPerCopy,
      sheetsPerCopy,
      totalPhysicalSheets,
      rate,
      aiFee,
      totalPrice,
      sheetsSaved,
      isDuplexActive,
    };
  }, [totalDocPages, colorMode, duplex, pagesPerSheet, pageSelectionType, customRange, copies, aiMode]);

  const previewPdfUrl = getPreviewUrl(jobData.job_id);
  const previewAiUrl = getAiPreviewUrl(jobData.job_id);

  const handleContinue = async () => {
    setIsProcessing(true);
    setError(null);

    const selectedRangeStr = pageSelectionType === 'all' ? 'all' : (customRange.trim() || 'all');

    try {
      const response = await updatePrintOptions(jobData.job_id, {
        color_mode: colorMode,
        duplex: duplex,
        pages_per_sheet: Number(pagesPerSheet),
        page_range: selectedRangeStr,
        orientation: 'portrait',
        copies: Number(copies),
        ai_mode: aiMode,
        custom_prompt: customPrompt.trim() || null,
      });

      // Pass updated job info to next step (Payment)
      onComplete({
        ...jobData,
        ...response,
        total_price: response.total_price,
        physical_sheets: response.physical_sheets,
        color_mode: response.color_mode,
        duplex: response.duplex,
        pages_per_sheet: response.pages_per_sheet,
        copies: response.copies,
        ai_mode: response.ai_mode,
        total_pages: response.content_pages,
      });
    } catch (err) {
      setError(err.message || 'Failed to apply options. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="document-studio-container">
      {/* ─── Studio Header ─── */}
      <div className="studio-header">
        <div className="studio-title-group">
          <h2>
            <BrandMark className="brand-mark" style={{ width: 34, height: 34 }} />
            {t('options.studioTitle')}
          </h2>
          <p className="studio-subtitle">
            {t('options.studioSubtitle')}
          </p>
        </div>
        <div className="doc-meta-badge">
          <span className="doc-meta-filename">{jobData.filename || jobData.original_filename}</span>
          <span className="doc-meta-pages">
            {totalDocPages} {totalDocPages === 1 ? t('options.page') : t('options.pages')}
          </span>
        </div>
      </div>

      <div className="studio-workspace">
        {/* ─── Left Column: Interactive Document Preview ─── */}
        <section className="preview-column">
          <div className="preview-card">
            <div className="preview-toolbar">
              <div className="preview-tabs">
                <button
                  type="button"
                  className={`preview-tab-btn ${previewTab === 'pdf' ? 'active' : ''}`}
                  onClick={() => setPreviewTab('pdf')}
                >
                  <span>{t('options.originalPdfTab')}</span>
                  <span className="tab-pill">{totalDocPages}p</span>
                </button>

                {aiMode === 'summarize' && (
                  <button
                    type="button"
                    className={`preview-tab-btn ai-tab ${previewTab === 'ai' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('ai')}
                  >
                    <span>{t('options.aiSummaryTab')}</span>
                    <span className="tab-pill">~{Math.max(1, Math.ceil(totalDocPages / 10))}p</span>
                  </button>
                )}
              </div>

              <div className="preview-actions">
                <a
                  href={previewTab === 'pdf' ? previewPdfUrl : previewAiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="preview-open-link"
                  title="Open in new window"
                >
                  {t('options.fullscreenBtn')}
                </a>
              </div>
            </div>

            <div className="preview-viewport">
              {previewTab === 'pdf' ? (
                <PdfPreview
                  url={previewPdfUrl}
                  colorMode={colorMode}
                  pagesPerSheet={pagesPerSheet}
                />
              ) : (
                <div className="ai-preview-placeholder">
                  <h4>{t('options.aiSummaryActiveTitle')}</h4>
                  <p>
                    {t('options.aiSummaryActiveDesc', {
                      total: totalDocPages,
                      summaryPages: Math.max(1, Math.ceil(totalDocPages / 10))
                    })}
                  </p>
                  {jobData.ai_result_filename ? (
                    <iframe
                      src={previewAiUrl}
                      title="AI summary content"
                      className="preview-iframe ai-text-frame"
                    />
                  ) : (
                    <div className="ai-summary-will-generate-badge">
                      {t('options.aiWillGenerateBadge')}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="preview-footer-info">
              {t('options.previewFooterInfo')}
            </div>
          </div>
        </section>

        {/* ─── Right Column: Print Configuration Options ─── */}
        <section className="options-column">
          <div className="config-card">
            {/* 1. Color Mode */}
            <div className="config-group">
              <div className="group-label">
                <span>{t('options.colorLabel')}</span>
                <span className="group-hint">{t('options.colorHint')}</span>
              </div>
              <div className="segmented-grid segmented-2">
                <button
                  type="button"
                  className={`segmented-btn ${colorMode === 'bw' ? 'active' : ''}`}
                  onClick={() => setColorMode('bw')}
                  aria-pressed={colorMode === 'bw'}
                >
                  <span className="nup-icon" aria-hidden="true">B/W</span>
                  <div className="btn-text">
                    <strong>{t('options.bw')}</strong>
                    <span>{t('options.bwRate')}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`segmented-btn ${colorMode === 'color' ? 'active' : ''}`}
                  onClick={() => setColorMode('color')}
                  aria-pressed={colorMode === 'color'}
                >
                  <span className="nup-icon" style={{ background: 'linear-gradient(135deg, #00A3D6, #E5007D, #F5C400)', borderColor: 'var(--line-ink)' }} aria-hidden="true" />
                  <div className="btn-text">
                    <strong>{t('options.color')}</strong>
                    <span>{t('options.colorRate')}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Sides (Duplex) */}
            <div className="config-group">
              <div className="group-label">
                <span>{t('options.sides')}</span>
                <span className="eco-pill">{t('options.duplexEco')}</span>
              </div>
              <div className="segmented-grid segmented-2">
                <button
                  type="button"
                  className={`segmented-btn ${duplex === 'duplex' ? 'active' : ''}`}
                  onClick={() => setDuplex('duplex')}
                  aria-pressed={duplex === 'duplex'}
                >
                  <span className="btn-icon" aria-hidden="true">⇄</span>
                  <div className="btn-text">
                    <strong>{t('options.duplex')}</strong>
                    <span>{t('options.duplexDesc')}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`segmented-btn ${duplex === 'simplex' ? 'active' : ''}`}
                  onClick={() => setDuplex('simplex')}
                  aria-pressed={duplex === 'simplex'}
                >
                  <span className="btn-icon" aria-hidden="true">▤</span>
                  <div className="btn-text">
                    <strong>{t('options.simplex')}</strong>
                    <span>{t('options.simplexDesc')}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Layout: Pages per Sheet (N-Up) */}
            <div className="config-group">
              <div className="group-label">
                <span>{t('options.pagesPerSheet')}</span>
                <span className="group-hint">{t('options.pagesHint')}</span>
              </div>
              <div className="segmented-grid segmented-3">
                {[1, 2, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`segmented-btn ${pagesPerSheet === n ? 'active' : ''}`}
                    onClick={() => setPagesPerSheet(n)}
                    aria-pressed={pagesPerSheet === n}
                  >
                    <span className="nup-icon" aria-hidden="true">{n}</span>
                    <div className="btn-text">
                      <strong>{n}-Up</strong>
                      <span>{n === 1 ? t('options.standard') : n === 2 ? t('options.sideBySide') : t('options.handoutGrid')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Page Range Selection */}
            <div className="config-group">
              <div className="group-label">
                <span>{t('options.pageRange')}</span>
              </div>
              <div className="segmented-grid segmented-2">
                <button
                  type="button"
                  className={`segmented-btn ${pageSelectionType === 'all' ? 'active' : ''}`}
                  onClick={() => setPageSelectionType('all')}
                  aria-pressed={pageSelectionType === 'all'}
                >
                  <span className="btn-icon" aria-hidden="true">≡</span>
                  <div className="btn-text">
                    <strong>{t('options.allPages')}</strong>
                    <span>{t('options.allPagesDesc', { total: totalDocPages })}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`segmented-btn ${pageSelectionType === 'custom' ? 'active' : ''}`}
                  onClick={() => setPageSelectionType('custom')}
                  aria-pressed={pageSelectionType === 'custom'}
                >
                  <span className="btn-icon" aria-hidden="true">✂</span>
                  <div className="btn-text">
                    <strong>{t('options.customRange')}</strong>
                    <span>{t('options.customRangeDesc')}</span>
                  </div>
                </button>
              </div>

              {pageSelectionType === 'custom' && (
                <div className="custom-range-box">
                  <input
                    type="text"
                    className="range-input"
                    placeholder={t('options.customRangePlaceholder', { total: totalDocPages })}
                    value={customRange}
                    onChange={(e) => setCustomRange(e.target.value)}
                    aria-label="Custom page range"
                  />
                  <span className="range-feedback">
                    {t('options.customRangeFeedback', { effective: calculation.effectivePages, total: totalDocPages })}
                  </span>
                </div>
              )}
            </div>

            {/* 5. Copies Stepper */}
            <div className="config-group config-group-inline">
              <div className="group-label">
                <span>{t('options.copies')}</span>
                <span className="group-hint">{t('options.copiesHint')}</span>
              </div>
              <div className="stepper-box">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setCopies((c) => Math.max(1, c - 1))}
                  disabled={copies <= 1}
                  aria-label="Fewer copies"
                >
                  −
                </button>
                <span className="stepper-value">{copies}</span>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setCopies((c) => Math.min(20, c + 1))}
                  disabled={copies >= 20}
                  aria-label="More copies"
                >
                  +
                </button>
              </div>
            </div>

            {/* 6. AI Summarization Card */}
            <div className="ai-feature-card">
              <div className="ai-card-header">
                <div className="ai-title-row">
                  <AiMark className="ai-mark" />
                  <div>
                    <strong>{t('options.aiCardTitle')}</strong>
                    <p>{t('options.aiCardDesc')}</p>
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={aiMode === 'summarize'}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setAiMode(enabled ? 'summarize' : 'none');
                      if (enabled) setPreviewTab('ai');
                      else setPreviewTab('pdf');
                    }}
                    aria-label="Enable AI study summarizer"
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {aiMode === 'summarize' && (
                <div className="ai-sub-config">
                  <div className="ai-benefits-row">
                    <span className="ai-benefit-badge">
                      {t('options.aiSavesPages', { count: Math.max(0, totalDocPages - Math.ceil(totalDocPages / 10)) })}
                    </span>
                    <span className="ai-benefit-badge fee">{t('options.aiFeeBadge')}</span>
                  </div>
                  <input
                    type="text"
                    className="ai-prompt-input"
                    placeholder={t('options.aiPromptPlaceholder')}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    aria-label="Custom AI focus prompt"
                  />
                </div>
              )}
            </div>

            {/* ─── Live Dynamic Receipt & Calculation ─── */}
            <div className="live-summary-card">
              <div className="summary-headline">
                <span>{t('options.liveSummaryTitle')}</span>
                {calculation.sheetsSaved > 0 && (
                  <span className="eco-badge">
                    {t('options.sheetsSavedBadge', { count: calculation.sheetsSaved })}
                  </span>
                )}
              </div>

              <div className="summary-details-grid">
                <div className="metric-box">
                  <span className="metric-label">{t('options.contentPagesMetric')}</span>
                  <span className="metric-val">{calculation.effectivePages}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">{t('options.paperSheetsMetric')}</span>
                  <span className="metric-val highlight">{calculation.totalPhysicalSheets}</span>
                  <span className="metric-sub">{duplex === 'duplex' ? t('options.duplex') : t('options.simplex')}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">{t('options.copiesMetric')}</span>
                  <span className="metric-val">{copies}×</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">{t('options.totalPriceMetric')}</span>
                  <span className="metric-val price-val">{calculation.totalPrice.toFixed(2)} EGP</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="step-actions studio-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onBack}
                disabled={isProcessing}
              >
                {t('options.backToUpload')}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-pay"
                onClick={handleContinue}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-small"></span>
                    {t('options.configuringJob')}
                  </>
                ) : (
                  t('options.continueToPayment', { price: calculation.totalPrice.toFixed(2) })
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default OptionsStep;
