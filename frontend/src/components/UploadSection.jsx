// src/components/UploadSection.jsx
import { forwardRef, useRef, useState } from 'react';
import { uploadReport } from '../services/reportService';

const uploadInstructions = [
  "Upload the company’s annual report – PDF only.",
  'PDF of 60–100 pages: 8–15 seconds to load.',
  'PDF of 150–300 pages: 20–40 seconds to load.',
  'PDF of 350–500 pages: 45–60 seconds.',
  'PDF of 500+ pages: about 1 minute.',
  'Use a clear text-based PDF scan for best performance.',
];

const UploadSection = forwardRef(
  (
    {
      user,
      requireAuth,
      onSignInClick,
      onLoginClick,
      plan,
      reportsUsed,
      reportsLimit,
      activeReportId,
      activeReportQuestionCount,
      activeReportQuestionLimit,
      onUploadReport,
      isUploadLocked,
      onLockedClick,
      // analysis / mode props
      analysisProgress,
      isAnalysing,
      activeAnalysisMode,
    },
    ref
  ) => {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [uploadError, setUploadError] = useState('');
    const [uploadStep, setUploadStep] = useState('idle');
    const [uploadStartTime, setUploadStartTime] = useState(null);
    const [uploadDuration, setUploadDuration] = useState(null);
    const uploadStage =
      isUploading ? 'uploading' : uploadResult ? 'complete' : 'idle';

    async function handleProtectedUploadClick() {
  // prevent double‑clicks
  if (isUploading) return;

  if (!selectedFile) {
    setUploadError('Please select a PDF file before uploading.');
    setUploadResult(null);
    return;
  }

  const allowed = requireAuth ? requireAuth() : true;
  if (allowed === false) return;

  try {
    setIsUploading(true);
    setUploadError('');
    setUploadResult(null);

    // start multi‑step UI
    setUploadStep('uploading');
    setUploadDuration(null);
    const start = Date.now();
    setUploadStartTime(start);

    // fake intermediate steps while real upload runs
    // short delays so user feels progress
    setTimeout(() => {
      setUploadStep((prev) => (prev === 'uploading' ? 'splitting' : prev));
    }, 1500);

    setTimeout(() => {
      setUploadStep((prev) =>
        prev === 'splitting' || prev === 'uploading' ? 'embedding' : prev
      );
    }, 3000);

    // Call backend via reportService
    const result = await uploadReport(selectedFile);
    setUploadResult(result);

    // final step + duration
    const end = Date.now();
    setUploadStep('done');
    setUploadDuration(((end - start) / 1000).toFixed(1));

    if (onUploadReport) {
      onUploadReport(result);
    }
  } catch (error) {
    setUploadError(error?.message || 'Upload failed. Please try again.');
    setUploadStep('idle');
    setUploadStartTime(null);
    setUploadDuration(null);
  } finally {
    setIsUploading(false);
  }
}

    function handleFileSelection(file) {
      if (!file) return;

      if (file.type !== 'application/pdf') {
        setUploadError('Please select a PDF file only.');
        setUploadResult(null);
        return;
      }

      setSelectedFile(file);
      setUploadError('');
      setUploadResult(null);
    }

    function handleInputChange(event) {
      const file = event.target.files?.[0];
      handleFileSelection(file);
    }

    function handleDrop(event) {
      event.preventDefault();
      setIsDragActive(false);

      const file = event.dataTransfer.files?.[0];
      handleFileSelection(file);
    }

    function handleDragOver(event) {
      event.preventDefault();
      setIsDragActive(true);
    }

    function handleDragLeave(event) {
      event.preventDefault();
      setIsDragActive(false);
    }

    function openFilePicker() {
      fileInputRef.current?.click();
    }

    // overall step index (0–4) for Upload + F‑1..F‑4
    const currentStepIndex = getCurrentStepIndex(uploadStage, analysisProgress);

    // F‑1..F‑4 dots: coloured per feature
    const f1DotStyle = getStepDotStyle(currentStepIndex, 1, '#dc2626'); // red
    const f2DotStyle = getStepDotStyle(currentStepIndex, 2, '#f59e0b'); // yellow
    const f3DotStyle = getStepDotStyle(currentStepIndex, 3, '#2563eb'); // blue
    const f4DotStyle = getStepDotStyle(currentStepIndex, 4, '#16a34a'); // green

    // text status under the rail
    const journeyStatusText = getJourneyStatusText(uploadStage, currentStepIndex);

    return (
      <section
        ref={ref}
        id="upload-section"
        style={{
          padding: '80px 40px',
          textAlign: 'center',
          background: '#f8fafc',
        }}
      >
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '12px',
          }}
        >
          Upload Section
        </h2>

        {!user ? (
          <>
            <p
              style={{
                color: '#64748b',
                marginTop: '10px',
                fontSize: '1rem',
              }}
            >
              Please sign in to continue and upload an annual report.
            </p>

            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <button onClick={onSignInClick} style={secondaryButtonStyle}>
                Sign in
              </button>

              <button onClick={onLoginClick} style={secondaryButtonStyle}>
                Login
              </button>

              <button
                onClick={() => {
                  // allow a trial upload only if not locked and user passes auth
                  if (isUploadLocked) {
                    if (onLockedClick) onLockedClick();
                    return;
                  }
                  handleProtectedUploadClick();
                }}
                style={{
                  ...primaryButtonStyle,
                  opacity: isUploading || isUploadLocked ? 0.7 : 1,
                  cursor:
                    isUploading || isUploadLocked ? 'not-allowed' : 'pointer',
                }}
                disabled={isUploading || isUploadLocked}
              >
                {isUploadLocked
                  ? 'Upload limit reached – Upgrade to Pro'
                  : isUploading
                  ? 'Uploading...'
                  : 'Try upload'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              style={{
                color: '#64748b',
                marginTop: '10px',
                fontSize: '1rem',
              }}
            >
              Welcome, {user.name || 'User'}. You can continue to upload your
              annual report.
            </p>

            <div
              style={{
                marginTop: '26px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                maxWidth: '900px',
                marginInline: 'auto',
                textAlign: 'left',
              }}
            >
              <div style={usageCardStyle}>
                <p style={usageLabelStyle}>Current plan</p>
                <h3 style={usageValueStyle}>
                  {plan === 'pro' ? 'Pro' : 'Free'}
                </h3>
              </div>

              <div style={usageCardStyle}>
                <p style={usageLabelStyle}>Reports used</p>
                <h3 style={usageValueStyle}>
                  {reportsUsed ?? 0} / {reportsLimit ?? 8}
                </h3>
              </div>

              <div style={usageCardStyle}>
                <p style={usageLabelStyle}>Questions for active report</p>
                <h3 style={usageValueStyle}>
                  {activeReportId
                    ? `${activeReportQuestionCount ?? 0} / ${
                        activeReportQuestionLimit ?? 10
                      }`
                    : `0 / ${activeReportQuestionLimit ?? 10}`}
                </h3>
              </div>
            </div>

            <div
              style={{
                marginTop: '30px',
                maxWidth: '980px',
                marginInline: 'auto',
                textAlign: 'left',
              }}
            >
              <div style={instructionCardStyle}>
                <p style={instructionHeadingStyle}>Before you upload</p>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {uploadInstructions.map((item) => (
                    <div key={item} style={instructionRowStyle}>
                      <span style={instructionBulletStyle}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={uploaderShellStyle}>
                <div style={progressRailStyle}>
                  {/* Upload step pill */}
                  <div style={getProgressPillStyle(uploadStage)} />
                  <p style={railStageTextStyle}>
                    {uploadStage === 'uploading'
                      ? 'Uploading'
                      : uploadStage === 'complete'
                      ? 'Upload done'
                      : 'Idle'}
                  </p>

                  {/* Upload→F‑1 segment */}
                  <div style={getSegmentLineStyle(currentStepIndex, 0)} />

                  {/* F‑1 dot */}
                  <div style={f1DotStyle} />

                  {/* F‑1→F‑2 */}
                  <div style={getSegmentLineStyle(currentStepIndex, 1)} />

                  {/* F‑2 dot */}
                  <div style={f2DotStyle} />

                  {/* F‑2→F‑3 */}
                  <div style={getSegmentLineStyle(currentStepIndex, 2)} />

                  {/* F‑3 dot */}
                  <div style={f3DotStyle} />

                  {/* F‑3→F‑4 */}
                  <div style={getSegmentLineStyle(currentStepIndex, 3)} />

                  {/* F‑4 dot */}
                  <div style={f4DotStyle} />

                  <p
                    style={{
                      margin: '12px 10px 0',
                      padding: '8px 10px 0',
                      borderTop: '1px solid #e5e7eb',
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      textAlign: 'center',
                    }}
                  >
                    {journeyStatusText}
                  </p>
                </div>

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  style={{
                    ...uploadBoxStyle,
                    border: isDragActive
                      ? '2px solid #2563eb'
                      : '2px dashed #cbd5e1',
                    background: isDragActive ? '#eff6ff' : '#ffffff',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                  />

                  <div style={uploadInnerContentStyle}>
                    <div style={uploadBadgeStyle}>PDF only</div>

                    <h3 style={uploadHeadingStyle}>
                      Drag and drop PDF uploader
                    </h3>

                    <p style={uploadDescriptionStyle}>
                      Drop the company’s annual report here, or choose the file
                      manually.
                    </p>

                    <button
                      type="button"
                      onClick={openFilePicker}
                      style={primaryButtonStyle}
                    >
                      Select file
                    </button>

                    <p style={uploadStageLabelStyle}>
                      {isUploading
                        ? 'Uploading...'
                        : uploadResult
                        ? 'Upload complete'
                        : 'Ready to upload'}
                    </p>
                      {/* Detailed upload step + timer */}
{uploadStep !== 'idle' && (
  <p
    style={{
      marginTop: '6px',
      marginBottom: 0,
      color: '#64748b',
      fontSize: '0.9rem',
    }}
  >
    {uploadStep === 'uploading' && 'Step 1 of 4: Uploading file…'}
    {uploadStep === 'splitting' && 'Step 2 of 4: Splitting pages into smaller chunks…'}
    {uploadStep === 'embedding' && 'Step 3 of 4: Embedding content for fast analysis…'}
    {uploadStep === 'done' &&
      (uploadDuration
        ? `Step 4 of 4: Stored successfully. Upload completed in ${uploadDuration} seconds.`
        : 'Step 4 of 4: Stored successfully.')}
  </p>
)}
                    {selectedFile ? (
                      <div style={selectedFileCardStyle}>
                        <p style={selectedFileLabelStyle}>Selected file</p>
                        <p style={selectedFileNameStyle}>
                          {selectedFile.name}
                        </p>
                        <p style={selectedFileMetaStyle}>
                          {isUploading
                            ? 'Uploading and processing your annual report...'
                            : uploadResult
                            ? 'File uploaded and ready for analysis.'
                            : 'Ready to upload.'}
                        </p>
                      </div>
                    ) : (
                      <p style={emptyFileTextStyle}>No file selected yet.</p>
                    )}

                    {uploadError ? (
                      <div style={errorCardStyle}>
                        <p style={statusTitleStyle}>Upload error</p>
                        <p style={statusTextStyle}>{uploadError}</p>
                      </div>
                    ) : null}

                    {uploadResult ? (
                      <div style={successCardStyle}>
                        <p style={statusTitleStyle}>Upload complete</p>
                        <p style={statusTextStyle}>{uploadResult.message}</p>

                        <div style={resultGridStyle}>
                          {'report_id' in uploadResult ? (
                            <div style={resultItemStyle}>
                              <span style={resultLabelStyle}>Report ID</span>
                              <strong style={resultValueStyle}>
                                {uploadResult.report_id}
                              </strong>
                            </div>
                          ) : null}

                          <div style={resultItemStyle}>
                            <span style={resultLabelStyle}>Original file</span>
                            <strong style={resultValueStyle}>
                              {uploadResult.original_filename}
                            </strong>
                          </div>

                          <div style={resultItemStyle}>
                            <span style={resultLabelStyle}>Saved file</span>
                            <strong style={resultValueStyle}>
                              {uploadResult.saved_filename}
                            </strong>
                          </div>

                          <div style={resultItemStyle}>
                            <span style={resultLabelStyle}>Pages loaded</span>
                            <strong style={resultValueStyle}>
                              {uploadResult.pages_loaded}
                            </strong>
                          </div>

                          <div style={resultItemStyle}>
                            <span style={resultLabelStyle}>
                              Chunks created
                            </span>
                            <strong style={resultValueStyle}>
                              {uploadResult.chunks_created}
                            </strong>
                          </div>

                          <div style={resultItemStyle}>
                            <span style={resultLabelStyle}>
                              Pipeline status
                            </span>
                            <strong style={resultValueStyle}>
                              {uploadResult.pipeline_status}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (isUploadLocked) {
                    if (onLockedClick) onLockedClick();
                    return;
                  }
                  handleProtectedUploadClick();
                }}
                style={{
                  ...primaryButtonStyle,
                  opacity: isUploading || isUploadLocked ? 0.7 : 1,
                  cursor:
                    isUploading || isUploadLocked ? 'not-allowed' : 'pointer',
                }}
                disabled={isUploading || isUploadLocked}
              >
                {isUploadLocked
                  ? 'Upload limit reached – Upgrade to Pro'
                  : isUploading
                  ? 'Uploading...'
                  : 'Upload annual report'}
              </button>
            </div>
          </>
        )}
      </section>
    );
  }
);

// Upload pill
function getProgressPillStyle(stage) {
  if (stage === 'uploading') {
    return {
      width: '24px',
      height: '24px',
      borderRadius: '999px',
      background: '#000000',
      boxShadow: '0 0 0 8px rgba(0, 0, 0, 0.14)',
    };
  }

  if (stage === 'complete') {
    return {
      width: '24px',
      height: '24px',
      borderRadius: '999px',
      background: '#000000',
      boxShadow: '0 0 0 8px rgba(22, 163, 74, 0.16)',
    };
  }

  return {
    width: '18px',
    height: '18px',
    borderRadius: '999px',
    background: '#cbd5e1',
    boxShadow: 'none',
  };
}

// 0 = upload, 1 = F1, 2 = F2, 3 = F3, 4 = F4
function getCurrentStepIndex(uploadStage, analysisProgress) {
  if (uploadStage !== 'complete') {
    return 0;
  }

  if (analysisProgress >= 100) return 4;
  if (analysisProgress >= 80) return 3;
  if (analysisProgress >= 60) return 2;
  if (analysisProgress >= 40) return 1;

  // upload complete but no feature run yet
  return 0;
}

// dot style: small grey → big coloured + halo when done
function getStepDotStyle(currentStepIndex, thisStepIndex, color) {
  const isDone = currentStepIndex >= thisStepIndex;
  if (!isDone) {
    return progressDotInactiveStyle;
  }

  return {
    width: '20px',
    height: '20px',
    borderRadius: '999px',
    background: color,
    boxShadow: '0 0 0 6px rgba(148, 163, 184, 0.25)',
    transition: 'all 180ms ease-out',
  };
}

// line segment between steps
function getSegmentLineStyle(currentStepIndex, segmentIndex) {
  const isActive = currentStepIndex > segmentIndex;
  return {
    width: '4px',
    flex: 1,
    borderRadius: '999px',
    minHeight: '16px',
    background: isActive ? '#16a34a' : '#e2e8f0',
    transition: 'background 180ms ease-out',
  };
}

// journey text below rail
function getJourneyStatusText(uploadStage, currentStepIndex) {
  if (uploadStage !== 'complete') {
    if (uploadStage === 'uploading') {
      return 'Uploading and preparing your annual report.';
    }
    return 'Start by uploading the annual report to begin analysis.';
  }

  if (currentStepIndex === 0) {
    return 'Upload complete. Run F‑1 company overview to continue.';
  }
  if (currentStepIndex === 1) {
    return 'F‑1 company overview is done. Run F‑2 growth & risk next.';
  }
  if (currentStepIndex === 2) {
    return 'F‑2 growth & risk is done. Run F‑3 financial & compliance next.';
  }
  if (currentStepIndex === 3) {
    return 'F‑3 financial & compliance is done. Run F‑4 executive summary next.';
  }
  if (currentStepIndex === 4) {
    return 'All steps completed – F‑4 executive summary is ready.';
  }

  return '';
}

const primaryButtonStyle = {
  background: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '999px',
  padding: '14px 26px',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButtonStyle = {
  background: '#ffffff',
  color: '#0f172a',
  border: '1px solid #cbd5e1',
  borderRadius: '999px',
  padding: '14px 24px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const usageCardStyle = {
  background: '#ffffff',
  color: '#0f172a',
  border: '1px solid #e2e8f0',
  borderRadius: '18px',
  padding: '18px 18px 16px',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
};

const usageLabelStyle = {
  margin: 0,
  marginBottom: '8px',
  color: '#64748b',
  fontSize: '0.92rem',
  fontWeight: 500,
};

const usageValueStyle = {
  margin: 0,
  fontSize: '1.35rem',
  fontWeight: 800,
  color: '#0f172a',
};

const instructionCardStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '24px',
  padding: '22px',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
  marginBottom: '18px',
};

const instructionHeadingStyle = {
  margin: 0,
  marginBottom: '16px',
  color: '#0f172a',
  fontSize: '1.1rem',
  fontWeight: 800,
};

const instructionRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  color: '#334155',
  fontSize: '0.98rem',
  lineHeight: 1.7,
};

const instructionBulletStyle = {
  color: '#2563eb',
  fontWeight: 900,
  lineHeight: 1.5,
};

const uploaderShellStyle = {
  display: 'grid',
  gridTemplateColumns: '72px 1fr',
  gap: '18px',
  alignItems: 'stretch',
};

const progressRailStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '24px',
  padding: '18px 0',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const railStageTextStyle = {
  margin: '10px 0 8px',
  color: '#000000',
  fontSize: '0.72rem',
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  textAlign: 'center',
  lineHeight: 1.3,
};

const progressDotInactiveStyle = {
  width: '14px',
  height: '14px',
  borderRadius: '999px',
  background: '#cbd5e1',
};

const uploadBoxStyle = {
  background: '#ffffff',
  borderRadius: '24px',
  minHeight: '320px',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
  padding: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const uploadInnerContentStyle = {
  textAlign: 'center',
  maxWidth: '580px',
  width: '100%',
};

const uploadBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 14px',
  borderRadius: '999px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: '0.9rem',
  fontWeight: 700,
  marginBottom: '16px',
};

const uploadHeadingStyle = {
  margin: 0,
  marginBottom: '10px',
  color: '#0f172a',
  fontSize: '1.55rem',
  fontWeight: 800,
};

const uploadDescriptionStyle = {
  margin: '0 auto 22px',
  maxWidth: '460px',
  color: '#64748b',
  fontSize: '1rem',
  lineHeight: 1.7,
};

const uploadStageLabelStyle = {
  marginTop: '16px',
  marginBottom: 0,
  color: '#475569',
  fontSize: '0.94rem',
  fontWeight: 700,
};

const selectedFileCardStyle = {
  marginTop: '22px',
  background: '#f8fafc',
  border: '1px solid #dbeafe',
  borderRadius: '18px',
  padding: '16px',
};

const selectedFileLabelStyle = {
  margin: 0,
  marginBottom: '6px',
  color: '#64748b',
  fontSize: '0.9rem',
  fontWeight: 600,
};

const selectedFileNameStyle = {
  margin: 0,
  color: '#0f172a',
  fontSize: '1rem',
  fontWeight: 700,
  wordBreak: 'break-word',
};

const selectedFileMetaStyle = {
  margin: '8px 0 0',
  color: '#64748b',
  fontSize: '0.92rem',
  lineHeight: 1.6,
};

const emptyFileTextStyle = {
  marginTop: '18px',
  marginBottom: 0,
  color: '#94a3b8',
  fontSize: '0.95rem',
};

const errorCardStyle = {
  marginTop: '18px',
  background: '#fff1f2',
  border: '1px solid #fecdd3',
  borderRadius: '18px',
  padding: '16px',
  textAlign: 'left',
};

const successCardStyle = {
  marginTop: '18px',
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '18px',
  padding: '16px',
  textAlign: 'left',
};

const statusTitleStyle = {
  margin: 0,
  marginBottom: '8px',
  color: '#0f172a',
  fontSize: '1rem',
  fontWeight: 800,
};

const statusTextStyle = {
  margin: 0,
  color: '#475569',
  fontSize: '0.95rem',
  lineHeight: 1.6,
};

const resultGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px',
  marginTop: '14px',
};

const resultItemStyle = {
  background: '#ffffff',
  border: '1px solid #dcfce7',
  borderRadius: '14px',
  padding: '12px',
};

const resultLabelStyle = {
  display: 'block',
  color: '#64748b',
  fontSize: '0.82rem',
  fontWeight: 600,
  marginBottom: '6px',
};

const resultValueStyle = {
  color: '#0f172a',
  fontSize: '0.95rem',
  fontWeight: 700,
  wordBreak: 'break-word',
};

export default UploadSection;