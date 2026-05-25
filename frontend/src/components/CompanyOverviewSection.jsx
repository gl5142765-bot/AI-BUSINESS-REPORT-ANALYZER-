// src/components/CompanyOverviewSection.jsx
import { useState } from 'react';
import { getCompanyOverview } from '../services/analysisService';

function CompanyOverviewSection({
  activeReportId,
  onAnalysisStart,
  onAnalysisComplete,
  onFeatureResult,
  isLockedByUsage,
  onLockedClick,
}) {
  const [overviewText, setOverviewText] = useState('');
  const [overviewJson, setOverviewJson] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [analysisStartTime, setAnalysisStartTime] = useState(null);
  const [analysisDuration, setAnalysisDuration] = useState(null);

  async function handleRunOverview() {
    // If F‑1 is locked (free plan limit reached), do not analyse, only open upgrade
    if (isLockedByUsage) {
      if (onLockedClick) onLockedClick();
      return;
    }

    if (!activeReportId) {
      setError(
        'Please upload and select an active report before running Vista company overview.'
      );
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      setOverviewText('');
      setOverviewJson(null);

      if (onAnalysisStart) {
        onAnalysisStart('F1');
      }

      // start timer
      const start = Date.now();
      setAnalysisStartTime(start);
      setAnalysisDuration(null);

      // Call backend with active report ID
      const raw = await getCompanyOverview(activeReportId);

      const text =
        typeof raw === 'string'
          ? raw
          : typeof raw?.output === 'string'
          ? raw.output
          : JSON.stringify(raw?.output ?? raw, null, 2);

      setOverviewText(text);

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
      setOverviewJson(parsed);

      if (onFeatureResult) {
        // Let App know F1 completed with this text so it can update featureHistory.F1
        onFeatureResult('F1', { text });
      }

      // end timer
      const end = Date.now();
      const seconds = ((end - start) / 1000).toFixed(1);
      setAnalysisDuration(seconds);

      if (onAnalysisComplete) {
        onAnalysisComplete('F1');
      }
    } catch (err) {
      setError(err?.message || 'Failed to run company overview.');
      setAnalysisDuration(null);

      if (onAnalysisComplete) {
        onAnalysisComplete('F1');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function renderOverviewContent() {
    // Fallback: old behaviour, just show plain text
    if (!overviewJson || typeof overviewJson !== 'object') {
      return (
        <p
          style={{
            margin: 0,
            color: '#334155',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}
        >
          {overviewText}
        </p>
      );
    }

    const data = overviewJson;

    // Normalise metrics and decide if we should hide placeholder message
    const metrics = data?.financial_and_operating_metrics;
    const metricsUnavailable =
      typeof metrics === 'string' &&
      metrics.trim().toLowerCase().startsWith('not available in the retrieved context');

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

        {/* Business description */}
        {data.business_description && (
          <div>
            <strong>Business description</strong>
            <p
              style={{
                margin: '4px 0 0',
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.business_description}
            </p>
          </div>
        )}

        {/* Segments */}
        {data.business_segments && (
          <div>
            <strong>Business segments</strong>
            <p
              style={{
                margin: '4px 0 0',
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.business_segments}
            </p>
          </div>
        )}

        {/* Geography */}
        {data.geography && (
          <div>
            <strong>Geography</strong>
            <p
              style={{
                margin: '4px 0 0',
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.geography}
            </p>
          </div>
        )}

        {/* Products & services */}
        {data.products_and_services && (
          <div>
            <strong>Products and services</strong>
            <p
              style={{
                margin: '4px 0 0',
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.products_and_services}
            </p>
          </div>
        )}

        {/* Ownership & leadership */}
        {data.ownership_and_leadership && (
          <div>
            <strong>Ownership and leadership</strong>
            <p
              style={{
                margin: '4px 0 0',
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.ownership_and_leadership}
            </p>
          </div>
        )}

        {/* Key highlights */}
        {data.key_highlights && (
          <div>
            <strong>Key highlights</strong>
            <p
              style={{
                margin: '4px 0 0',
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.key_highlights}
            </p>
          </div>
        )}

        {/* Metrics */}
        {metrics && !metricsUnavailable && (
          <div>
            <strong>Financial and operating metrics</strong>

            {typeof metrics === 'string' && (
              <p
                style={{
                  margin: '6px 0 0',
                  color: '#334155',
                  lineHeight: 1.7,
                }}
              >
                {metrics}
              </p>
            )}

            {typeof metrics === 'object' && (
              <ul
                style={{
                  margin: '6px 0 0 18px',
                  padding: 0,
                  color: '#334155',
                  lineHeight: 1.7,
                }}
              >
                {Array.isArray(metrics)
                  ? metrics.map((item, index) => (
                      <li key={index}>
                        {typeof item === 'object'
                          ? JSON.stringify(item)
                          : String(item)}
                      </li>
                    ))
                  : Object.entries(metrics).map(([key, value]) => (
                      <li key={key}>
                        <span style={{ textTransform: 'capitalize' }}>
                          {key.replace(/_/g, ' ')}:
                        </span>{' '}
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                      </li>
                    ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  const buttonLabel = isLockedByUsage
    ? 'Generate company overview (Unlock with Pro)'
    : isLoading
    ? 'Vista is analysing…'
    : 'Generate company overview';

const buttonStyle = {
  background: isLockedByUsage || isLoading ? '#fecaca' : '#dc2626',
  color: isLockedByUsage ? '#b91c1c' : '#ffffff',
  border: isLockedByUsage ? '1.5px dashed #f97373' : 'none',
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
        marginTop: '28px',
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
        {/* F‑1 chip: soft red */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: '#fee2e2',
            color: '#b91c1c',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          F‑1 · Vista company overview
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: '1.4rem',
            color: '#0f172a',
            fontWeight: 800,
          }}
        >
          KNOW EVERYTHING ABOUT THE COMPANY
        </h2>

        <p
          style={{
            margin: 0,
            color: '#64748b',
            fontSize: '0.96rem',
            lineHeight: 1.7,
          }}
        >
          Vista analyses the annual report and gives you a simple, clear overview
          of the company. Understand the business model, financial performance, key
          risks, and future outlook in minutes.
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
        onClick={handleRunOverview}
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

      {overviewText && (
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
            Vista’s company overview
          </h3>

          {renderOverviewContent()}
        </div>
      )}
    </section>
  );
}

export default CompanyOverviewSection;