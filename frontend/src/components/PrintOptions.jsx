import React from 'react';
import { useI18n } from '../i18n';

export function PrintOptions({ options, onChange, pageCount }) {
  const { t } = useI18n();

  const update = (key, value) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="options-card">
      <h3 className="section-title">Print Settings</h3>

      {/* Color Mode */}
      <div className="option-row">
        <label className="option-label">Color Mode</label>
        <div className="button-group">
          <button
            type="button"
            className={`btn-toggle ${options.color_mode === 'bw' ? 'active' : ''}`}
            onClick={() => update('color_mode', 'bw')}
          >
            {t('bw')}
          </button>
          <button
            type="button"
            className={`btn-toggle ${options.color_mode === 'color' ? 'active' : ''}`}
            onClick={() => update('color_mode', 'color')}
          >
            {t('color')}
          </button>
        </div>
      </div>

      {/* Duplex */}
      <div className="option-row">
        <label className="option-label">Sides</label>
        <div className="button-group">
          <button
            type="button"
            className={`btn-toggle ${options.duplex === 'single' ? 'active' : ''}`}
            onClick={() => update('duplex', 'single')}
          >
            {t('singleSided')}
          </button>
          <button
            type="button"
            className={`btn-toggle ${options.duplex === 'long_edge' ? 'active' : ''}`}
            onClick={() => update('duplex', 'long_edge')}
          >
            {t('doubleSided')}
          </button>
        </div>
      </div>

      {/* Copies */}
      <div className="option-row">
        <label className="option-label">{t('copies')}</label>
        <div className="counter-input">
          <button
            type="button"
            onClick={() => update('copies', Math.max(1, (options.copies || 1) - 1))}
          >
            -
          </button>
          <span>{options.copies || 1}</span>
          <button
            type="button"
            onClick={() => update('copies', Math.min(20, (options.copies || 1) + 1))}
          >
            +
          </button>
        </div>
      </div>

      {/* AI Summarize Feature */}
      <div className="ai-toggle-box">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={!!options.ai_summarize}
            onChange={(e) => update('ai_summarize', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
        <div className="ai-text">
          <div className="ai-title">
            <span className="sparkle">✨</span> {t('aiSummary')}
          </div>
          <div className="ai-desc">{t('aiSummaryDesc')}</div>
        </div>
      </div>
    </div>
  );
}
