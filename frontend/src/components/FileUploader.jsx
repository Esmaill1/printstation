import React from 'react';
import { useI18n } from '../i18n';

/**
 * FileUploader Component (Skeleton / Scheme).
 * 
 * Owner: Member 1 (Frontend Lead)
 * Ref: docs/team/member-1-frontend/TASKS.md §2
 * 
 * TODO (Member 1):
 * 1. Implement drag-and-drop zone and hidden file picker.
 * 2. Accept PDF, DOCX, PPTX, TXT, and Images (JPG, PNG, WEBP, HEIC).
 * 3. Enforce 50MB file size limit with user-friendly error state.
 * 4. Call `onFileSelected(file)` upon valid selection.
 */
export function FileUploader({ onFileSelected, isLoading }) {
  const { t } = useI18n();

  return (
    <div className="upload-container">
      <div className="dropzone" onClick={() => {/* Member 1 to trigger file input */}}>
        <div className="upload-icon">📄</div>
        <h3>{isLoading ? 'Processing...' : t('uploadPrompt')}</h3>
        <p className="upload-subtext">{t('uploadLimit')}</p>
        {/* Member 1: Add input[type=file] and drop listeners */}
      </div>
    </div>
  );
}
