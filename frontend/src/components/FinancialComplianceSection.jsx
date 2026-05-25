// src/components/FinancialComplianceSection.jsx
import { useState } from 'react';
import { getFinancialCompliance } from '../services/analysisService';

function FinancialComplianceSection({
  activeReportId,
  onAnalysisStart,
  onAnalysisComplete,
  onFeatureResult,
  isLockedByUsage,
  onLockedClick,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [analysisJson, setAnalysisJson] = useState(null);
  const [error, setError] = useState('');

  const [analysisStartTime, setAnalysisStartTime] = useState(null);
  const [analysisDuration, setAnalysisDuration] = useState(null);

  async function handleRunFinancialCompliance() {
    // If F‑3 is locked for this usage/plan, do not run analysis – just open upgrade
    if (isLockedByUsage) {
      if (onLockedClick) onLockedClick();
      return;
    }

    // Require an active report, same as F‑1/F‑2
    if (!activeReportId) {
      setError(
        'Please upload and select an active report before scanning financials & compliance.'
      );
      return;
    }

    try {
      if (onAnalysisStart) {
        onAnalysisStart('F3');
      }

      setIsLoading(true);
      setError('');
      setAnalysisText('');
      setAnalysisJson(null);

      // start timer
      const start = Date.now();
      setAnalysisStartTime(start);
      setAnalysisDuration(null);

      // Call backend with active report ID
      const raw = await getFinancialCompliance(activeReportId);

      const text =
        typeof raw === 'string'
          ? raw
          : typeof raw?.output === 'string'
          ? raw.output
          : JSON.stringify(raw?.output ?? raw, null, 2);

      setAnalysisText(text);

      // Try to keep a parsed version for clean UI
      let parsed = null;
      try {
        if (typeof raw === 'string') {
          parsed = JSON.parse(raw);
        } else if (raw && typeof raw === 'object') {
          parsed = raw.output ?? raw;
        }
      } catch {
        parsed = null;
      }
      setAnalysisJson(parsed);

      if (onFeatureResult) {
        onFeatureResult('F3', { text });
      }

      // end timer
      const end = Date.now();
      const seconds = ((end - start) / 1000).toFixed(1);
      setAnalysisDuration(seconds);
    } catch (err) {
      setError(
        err?.message ||
          'Vista hit a snag while analysing financials & compliance. Try again in a moment.'
      );
      setAnalysisDuration(null);
    } finally {
      setIsLoading(false);
      if (onAnalysisComplete) {
        onAnalysisComplete('F3');
      }
    }
  }

  function renderAnalysisContent() {
    if (!analysisJson || typeof analysisJson !== 'object') {
      // Fallback: old behaviour
      return (
        <pre
          style={{
            margin: 0,
            color: '#334155',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
          }}
        >
          {analysisText}
        </pre>
      );
    }

    const data = analysisJson;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Title */}
        {data.title && (
          <h4
            style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            {data.title}
          </h4>
        )}

        {/* Financial performance */}
        {data.financial_performance && (
          <div>
            <strong>Financial performance</strong>
            <div
              style={{
                marginTop: 4,
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.financial_performance.revenue_analysis && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Revenue analysis:</strong>{' '}
                  {data.financial_performance.revenue_analysis}
                </p>
              )}
              {data.financial_performance.directors_report_analysis && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Directors’ report:</strong>{' '}
                  {data.financial_performance.directors_report_analysis}
                </p>
              )}
              {data.financial_performance.balance_sheet_analysis && (
                <p style={{ margin: 0 }}>
                  <strong>Balance sheet:</strong>{' '}
                  {data.financial_performance.balance_sheet_analysis}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Compliance and governance */}
        {data.compliance_and_governance && (
          <div>
            <strong>Compliance & governance</strong>
            <div
              style={{
                marginTop: 4,
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.compliance_and_governance.auditor_opinion && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Auditor opinion:</strong>{' '}
                  {data.compliance_and_governance.auditor_opinion}
                </p>
              )}
              {data.compliance_and_governance.corporate_governance && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Corporate governance:</strong>{' '}
                  {data.compliance_and_governance.corporate_governance}
                </p>
              )}
              {data.compliance_and_governance.disclosures && (
                <p style={{ margin: 0 }}>
                  <strong>Disclosures:</strong>{' '}
                  {data.compliance_and_governance.disclosures}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Financial conclusion */}
        {data.financial_conclusion && (
          <div>
            <strong>Financial conclusion</strong>
            <div
              style={{
                marginTop: 4,
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.financial_conclusion.overall_financial_health && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Overall health:</strong>{' '}
                  {data.financial_conclusion.overall_financial_health}
                </p>
              )}
              {data.financial_conclusion.warning_signs_and_reality_checks && (
                <p style={{ margin: 0 }}>
                  <strong>Warning signs & reality checks:</strong>{' '}
                  {data.financial_conclusion.warning_signs_and_reality_checks}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const buttonLabel = isLockedByUsage
    ? 'Scan financials & compliance (Unlock with Pro)'
    : isLoading
    ? 'Vista is analysing…'
    : 'Scan financials & compliance';

  const buttonStyle = {
    background: isLockedByUsage || isLoading ? '#dbeafe' : '#2563eb',
    color: isLockedByUsage ? '#1d4ed8' : '#ffffff',
    border: isLockedByUsage ? '1.5px dashed #60a5fa' : 'none',
    borderRadius: '999px',
    padding: '10px 18px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: isLockedByUsage || isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.9 : 1,
    marginBottom: '16px',
  };

  return (
    <section
      style={{
        marginTop: '24px',
        padding: '22px',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        background: '#f9fafb',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        {/* Feature chip */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: '#dbeafe',
            color: '#1d4ed8',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          F‑3 · Financial & compliance
        </div>

        {/* Hero line */}
        <h2
          style={{
            margin: 0,
            fontSize: '1.3rem',
            color: '#0f172a',
            fontWeight: 800,
          }}
        >
          CHECK THE FINANCIALS AND COMPLIANCE SIGNALS
        </h2>

        {/* Explanation */}
        <p
          style={{
            margin: 0,
            color: '#64748b',
            fontSize: '0.96rem',
            lineHeight: 1.7,
          }}
        >
          Vista scans the financial statements and key disclosures to highlight
          important financial signals and any compliance‑related red flags, so you
          don’t have to read every line yourself.
        </p>

        {/* Reassurance */}
        <p
          style={{
            margin: 0,
            color: '#94a3b8',
            fontSize: '0.9rem',
            lineHeight: 1.6,
          }}
        >
          Don’t worry, Vista will go through the numbers and notes for you.
        </p>
      </div>

      {/* Primary button */}
      <button
        type="button"
        onClick={handleRunFinancialCompliance}
        disabled={isLoading || isLockedByUsage}
        style={buttonStyle}
      >
        {buttonLabel}
      </button>

      {/* Error message */}
      {error && (
        <p
          style={{
            margin: 0,
            marginBottom: '10px',
            color: '#dc2626',
            fontSize: '0.9rem',
            lineHeight: 1.6,
          }}
        >
          {error}
        </p>
      )}

      {/* Duration */}
      {analysisDuration && (
        <p
          style={{
            margin: '4px 0 8px',
            color: '#9ca3af',
            fontSize: '0.85rem',
          }}
        >
          Analysis completed in {analysisDuration} seconds.
        </p>
      )}

      {/* Result block */}
      {analysisText !== '' && (
        <div
          style={{
            marginTop: '4px',
            padding: '16px',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            Vista’s financial & compliance view
          </h3>

          {renderAnalysisContent()}
        </div>
      )}
    </section>
  );
}

export default FinancialComplianceSection;