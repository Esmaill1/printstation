import React, { useState, useRef } from 'react';
import { useI18n } from '../i18n';

const SUPPORTED_EXTS = [
  'pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt', 'md',
  'jpg', 'jpeg', 'png', 'webp', 'heic', 'bmp', 'tiff'
];

export function FileUploader({ onFileSelected, isLoading }) {
  const { t } = useI18n();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndPassFile = (file) => {
    setError(null);
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    const isOffice = file.name.endsWith('.docx') || file.name.endsWith('.pptx') || file.name.endsWith('.doc');

    if (!SUPPORTED_EXTS.includes(ext) && !isImage && !isPdf && !isOffice) {
      setError('Supported formats: PDF, Images (JPG/PNG/WEBP/HEIC), Word (DOCX), Presentations (PPTX), and Text.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit.');
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  return (
    <div className="upload-container">
      <div
        className={`dropzone ${dragActive ? 'dropzone-active' : ''} ${isLoading ? 'dropzone-loading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.jpg,.jpeg,.png,.webp,.heic,image/*,application/pdf"
          style={{ display: 'none' }}
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="upload-icon">
          <svg width="52" height="52" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <h3>{isLoading ? 'Converting & Analyzing Document...' : t('uploadPrompt')}</h3>
        <p className="upload-subtext">{t('uploadLimit')}</p>
        <p className="format-tags">PDF • Word (DOCX) • Slides (PPTX) • Phone Photos & Notes (JPG/PNG/HEIC)</p>

        {error && <p className="upload-error">{error}</p>}
      </div>
    </div>
  );
}
