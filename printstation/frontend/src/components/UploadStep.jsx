import { useState, useCallback } from 'react';
import { uploadFile } from '../api';
import { DropMark } from './icons';

function UploadStep({ onComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFile = useCallback(async (file) => {
    setError(null);

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are accepted. Export your document as PDF first, then upload it.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File is too large. Maximum size is 50MB.');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);

    try {
      const result = await uploadFile(file);
      onComplete(result);
    } catch (err) {
      setError(err.message || 'Upload failed. Is the backend running?');
      setIsUploading(false);
    }
  }, [onComplete]);

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
      <h2>Upload your document</h2>
      <p className="step-description">
        Drop in a PDF and it goes straight into the print queue. PDF is the only
        format this prototype accepts.
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
            <p>Uploading {selectedFile?.name}...</p>
          </div>
        ) : (
          <>
            <span className="drop-mark"><DropMark /></span>
            <p className="drop-text">
              Drag & drop your PDF here
            </p>
            <p className="drop-subtext">or click to browse</p>
            <span className="file-limit">PDF only · Max 50MB · No page limit</span>
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
