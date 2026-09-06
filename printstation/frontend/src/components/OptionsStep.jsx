import { useState, useMemo } from 'react';
import { updatePrintOptions, getPreviewUrl, getAiPreviewUrl } from '../api';
import { BrandMark, AiMark } from './icons';
import PdfPreview from './PdfPreview';

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

    const rate = colorMode === 'color' ? 3.50 : 1.25;
    const printedSidesPerCopy = Math.ceil(effectivePages / pagesPerSheet);
    const sheetsPerCopy = duplex === 'duplex' ? Math.ceil(printedSidesPerCopy / 2) : printedSidesPerCopy;
    const totalPhysicalSheets = sheetsPerCopy * copies;

    const baseCost = printedSidesPerCopy * copies * rate;
    const aiFee = aiMode === 'summarize' ? 2.00 : 0.00;
    const totalPrice = Math.max(3.00, Math.round((baseCost + aiFee) * 100) / 100);

    const standardTotalSheets = totalDocPages * copies;
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
            Print Studio
          </h2>
          <p className="studio-subtitle">
            Check the preview, set your print options, and watch the sheet count
            and price update as you go.
          </p>
        </div>
        <div className="doc-meta-badge">
          <span className="doc-meta-filename">{jobData.filename || jobData.original_filename}</span>
          <span className="doc-meta-pages">{totalDocPages} {totalDocPages === 1 ? 'page' : 'pages'}</span>
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
                  <span>Original PDF</span>
                  <span className="tab-pill">{totalDocPages}p</span>
                </button>

                {aiMode === 'summarize' && (
                  <button
                    type="button"
                    className={`preview-tab-btn ai-tab ${previewTab === 'ai' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('ai')}
                  >
                    <span>AI Summary</span>
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
                  Fullscreen ↗
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
                  <h4>AI Summary is on</h4>
                  <p>
                    Your document will be condensed from <strong>{totalDocPages} pages</strong> to
                    <strong> ~{Math.max(1, Math.ceil(totalDocPages / 10))} study sheets</strong> with key concepts and formulas highlighted.
                  </p>
                  {jobData.ai_result_filename ? (
                    <iframe
                      src={previewAiUrl}
                      title="AI summary content"
                      className="preview-iframe ai-text-frame"
                    />
                  ) : (
                    <div className="ai-summary-will-generate-badge">
                      Summary generates automatically when you continue
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="preview-footer-info">
              Scroll and zoom the preview to verify your pages before paying.
            </div>
          </div>
        </section>

        {/* ─── Right Column: Print Configuration Options ─── */}
        <section className="options-column">
          <div className="config-card">
            {/* 1. Color Mode */}
            <div className="config-group">
              <div className="group-label">
                <span>Color</span>
                <span className="group-hint">B&W is recommended for text lectures</span>
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
                    <strong>Black & White</strong>
                    <span>1.25 EGP / side</span>
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
                    <strong>Full Color</strong>
                    <span>3.50 EGP / side</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Sides (Duplex) */}
            <div className="config-group">
              <div className="group-label">
                <span>Sides</span>
                <span className="eco-pill">Saves 50% paper</span>
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
                    <strong>Double-Sided</strong>
                    <span>Print on both sides</span>
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
                    <strong>Single-Sided</strong>
                    <span>One page per sheet</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Layout: Pages per Sheet (N-Up) */}
            <div className="config-group">
              <div className="group-label">
                <span>Pages per sheet</span>
                <span className="group-hint">Compress slides or handouts</span>
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
                      <span>{n === 1 ? 'Standard' : n === 2 ? 'Side-by-side' : 'Handout grid'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Page Range Selection */}
            <div className="config-group">
              <div className="group-label">
                <span>Pages</span>
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
                    <strong>All Pages</strong>
                    <span>1 to {totalDocPages}</span>
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
                    <strong>Custom Range</strong>
                    <span>Pick pages</span>
                  </div>
                </button>
              </div>

              {pageSelectionType === 'custom' && (
                <div className="custom-range-box">
                  <input
                    type="text"
                    className="range-input"
                    placeholder={`e.g. 1-2, 4 (doc has ${totalDocPages} pages)`}
                    value={customRange}
                    onChange={(e) => setCustomRange(e.target.value)}
                    aria-label="Custom page range"
                  />
                  <span className="range-feedback">
                    Selected <strong>{calculation.effectivePages}</strong> of {totalDocPages} pages
                  </span>
                </div>
              )}
            </div>

            {/* 5. Copies Stepper */}
            <div className="config-group config-group-inline">
              <div className="group-label">
                <span>Copies</span>
                <span className="group-hint">For teammates or extra sets</span>
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
                    <strong>AI Study Summarizer</strong>
                    <p>Condense long lectures into key points and formulas</p>
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
                    <span className="ai-benefit-badge">Saves ~{Math.max(0, totalDocPages - Math.ceil(totalDocPages / 10))} pages</span>
                    <span className="ai-benefit-badge fee">+2.00 EGP AI fee</span>
                  </div>
                  <input
                    type="text"
                    className="ai-prompt-input"
                    placeholder='Custom focus (optional, e.g. "Focus on Chapter 4 formulas")'
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
                <span>Calculated summary</span>
                {calculation.sheetsSaved > 0 && (
                  <span className="eco-badge">{calculation.sheetsSaved} sheets saved</span>
                )}
              </div>

              <div className="summary-details-grid">
                <div className="metric-box">
                  <span className="metric-label">Content pages</span>
                  <span className="metric-val">{calculation.effectivePages}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Paper sheets</span>
                  <span className="metric-val highlight">{calculation.totalPhysicalSheets}</span>
                  <span className="metric-sub">{duplex === 'duplex' ? 'Double-sided' : 'Single-sided'}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Copies</span>
                  <span className="metric-val">{copies}×</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Total price</span>
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
                ← Back to upload
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
                    Configuring job...
                  </>
                ) : (
                  `Continue to payment (${calculation.totalPrice.toFixed(2)} EGP) →`
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
