import { useState, useCallback } from 'react';
import { uploadFile } from '../api';
import { DropMark } from './icons';
import { useTranslation } from '../i18n';

function UploadStep({ onComplete }) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFile = useCallback(async (file) => {
    setError(null);

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError(t('upload.errorExt'));
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError(t('upload.errorSize'));
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);

    try {
      const result = await uploadFile(file);
      onComplete(result);
    } catch (err) {
      setError(err.message || t('upload.errorFailed'));
      setIsUploading(false);
    }
  }, [onComplete, t]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="step-card">
      <h2>{t('upload.title')}</h2>
      <p className="step-description">
        {t('upload.description')}
      </p>

      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && document.getElementById('file-input').click()}
        role="button"
        tabIndex={0}
        aria-label="Upload PDF document"
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
            e.preventDefault();
            document.getElementById('file-input').click();
          }
        }}
      >
        {isUploading ? (
          <div className="upload-progress">
            <div className="spinner" aria-label="Uploading"></div>
            <p>{t('upload.uploading', { filename: selectedFile?.name })}</p>
          </div>
        ) : (
          <>
            <span className="drop-mark"><DropMark /></span>
            <p className="drop-text">
              {t('upload.dragText')}
            </p>
            <p className="drop-subtext">{t('upload.browseText')}</p>
            <span className="file-limit">{t('upload.fileLimit')}</span>
          </>
        )}
      </div>

      <input
        id="file-input"
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        aria-label="Upload PDF document"
        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' }}
      />

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default UploadStep;
