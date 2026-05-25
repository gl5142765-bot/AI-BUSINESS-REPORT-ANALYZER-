// src/components/ExecutiveSummarySection.jsx
import { useState } from 'react';
import { getExecutiveSummary } from '../services/analysisService';

function ExecutiveSummarySection({
  activeReportId,
  onAnalysisStart,
  onAnalysisComplete,
  onFeatureResult,
  isLockedByUsage,
  onLockedClick,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryJson, setSummaryJson] = useState(null);
  const [error, setError] = useState('');

  const [analysisStartTime, setAnalysisStartTime] = useState(null);
  const [analysisDuration, setAnalysisDuration] = useState(null);

  async function handleRunExecutiveSummary() {
    // If F‑4 is locked for this plan/usage, do not run analysis – only show upgrade
    if (isLockedByUsage) {
      if (onLockedClick) onLockedClick();
      return;
    }

    if (!activeReportId) {
      setError(
        'Please upload and select an active report before generating the executive summary.'
      );
      return;
    }

    try {
      if (onAnalysisStart) {
        onAnalysisStart('F4'); // App: handleAnalysisStart('F4')
      }

      setIsLoading(true);
      setError('');
      setSummaryText('');
      setSummaryJson(null);

      // start timer
      const start = Date.now();
      setAnalysisStartTime(start);
      setAnalysisDuration(null);

      const raw = await getExecutiveSummary(activeReportId);

      const text =
        typeof raw === 'string'
          ? raw
          : typeof raw?.output === 'string'
          ? raw.output
          : JSON.stringify(raw?.output ?? raw, null, 2);

      setSummaryText(text);

      // Parsed version for clean UI
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
      setSummaryJson(parsed);

      if (onFeatureResult) {
        onFeatureResult('F4', { text });
      }

      // end timer
      const end = Date.now();
      const seconds = ((end - start) / 1000).toFixed(1);
      setAnalysisDuration(seconds);
    } catch (err) {
      setError(
        err?.message ||
          'Vista hit a snag while creating the executive summary. Try again in a moment.'
      );
      setAnalysisDuration(null);
    } finally {
      setIsLoading(false);
      if (onAnalysisComplete) {
        onAnalysisComplete('F4'); // App: handleAnalysisComplete('F4')
      }
    }
  }

  function renderSummaryContent() {
    if (!summaryJson || typeof summaryJson !== 'object') {
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
          {summaryText}
        </pre>
      );
    }

    const data = summaryJson;

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

        {/* Company snapshot */}
        {data.company_snapshot && (
          <div>
            <strong>Company snapshot</strong>
            <p
              style={{
                margin: '4px 0 0',
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.company_snapshot}
            </p>
          </div>
        )}

        {/* Key highlights */}
        {data.key_highlights && (
          <div>
            <strong>Key highlights</strong>
            <div
              style={{
                marginTop: 4,
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.key_highlights.growth_highlights && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Growth highlights:</strong>{' '}
                  {data.key_highlights.growth_highlights}
                </p>
              )}
              {data.key_highlights.financial_highlights && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Financial highlights:</strong>{' '}
                  {data.key_highlights.financial_highlights}
                </p>
              )}
              {data.key_highlights.major_strengths && (
                <p style={{ margin: 0 }}>
                  <strong>Major strengths:</strong>{' '}
                  {data.key_highlights.major_strengths}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Key risks */}
        {data.key_risks && (
          <div>
            <strong>Key risks</strong>
            <p
              style={{
                margin: '4px 0 0',
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.key_risks.top_risks}
            </p>
          </div>
        )}

        {/* Overall assessment */}
        {data.overall_assessment && (
          <div>
            <strong>Overall assessment</strong>
            <p
              style={{
                margin: '4px 0 0',
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.overall_assessment.business_strength}
            </p>
          </div>
        )}

        {/* Final summary */}
        {data.final_summary && (
          <div>
            <strong>Final summary</strong>
            <p
              style={{
                margin: '4px 0 0',
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.final_summary}
            </p>
          </div>
        )}
      </div>
    );
  }

  const buttonLabel = isLockedByUsage
    ? 'Generate executive summary (Unlock with Pro)'
    : isLoading
    ? 'Vista is analysing…'
    : 'Generate executive summary';

  const buttonStyle = {
    background: isLockedByUsage || isLoading ? '#dcfce7' : '#16a34a',
    color: isLockedByUsage ? '#15803d' : '#ffffff',
    border: isLockedByUsage ? '1.5px dashed #4ade80' : 'none',
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
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: '#dcfce7',
            color: '#15803d',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          F‑4 · Executive summary
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: '1.3rem',
            color: '#0f172a',
            fontWeight: 800,
          }}
        >
          SUMMARY OF YOUR WHOLE REPORT IN ONE CLICK
        </h2>

        <p
          style={{
            margin: 0,
            color: '#64748b',
            fontSize: '0.96rem',
            lineHeight: 1.7,
          }}
        >
          Vista combines all your earlier analysis into a concise summary of
          strengths, weaknesses, and key decisions to consider.
        </p>

        <p
          style={{
            margin: 0,
            color: '#94a3b8',
            fontSize: '0.9rem',
            lineHeight: 1.6,
          }}
        >
          Don’t worry, Vista will analyse this for you.
        </p>
      </div>

      <button
        type="button"
        onClick={handleRunExecutiveSummary}
        disabled={isLoading || isLockedByUsage}
        style={buttonStyle}
      >
        {buttonLabel}
      </button>

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

      {summaryText !== '' && (
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
            Vista’s executive summary
          </h3>

          {renderSummaryContent()}
        </div>
      )}
    </section>
  );
}

export default ExecutiveSummarySection;