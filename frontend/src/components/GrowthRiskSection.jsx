// src/components/GrowthRiskSection.jsx
import { useState } from 'react';
import { getGrowthRisk } from '../services/analysisService';

function GrowthRiskSection({
  activeReportId,
  onAnalysisStart,
  onAnalysisComplete,
  onFeatureResult,
  isLockedByUsage,
  onLockedClick,
}) {
  const [analysisText, setAnalysisText] = useState('');
  const [analysisJson, setAnalysisJson] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [analysisStartTime, setAnalysisStartTime] = useState(null);
  const [analysisDuration, setAnalysisDuration] = useState(null);

  async function handleRunGrowthRisk() {
    // If F‑2 is locked (free plan limit reached), do not analyse, only open upgrade
    if (isLockedByUsage) {
      if (onLockedClick) onLockedClick();
      return;
    }

    if (!activeReportId) {
      setError(
        'Please upload and select an active report before running Growth & risk.'
      );
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      setAnalysisText('');
      setAnalysisJson(null);

      if (onAnalysisStart) {
        onAnalysisStart('F2');
      }

      // start timer
      const start = Date.now();
      setAnalysisStartTime(start);
      setAnalysisDuration(null);

      // Call backend with active report ID
      const raw = await getGrowthRisk(activeReportId);

      // EXACT same pattern as F‑1, but adapted to F‑2’s return shape
      const text =
        typeof raw === 'string'
          ? raw
          : typeof raw?.summary === 'string'
          ? raw.summary
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
          // F‑2 service returns { summary, raw } or similar
          parsed = raw.output ?? raw.raw ?? raw;
        }
      } catch {
        parsed = null;
      }
      setAnalysisJson(parsed);

      if (onFeatureResult) {
        // Let App know F2 completed with this text so it can update featureHistory.F2
        onFeatureResult('F2', { text });
      }

      // end timer
      const end = Date.now();
      const seconds = ((end - start) / 1000).toFixed(1);
      setAnalysisDuration(seconds);

      if (onAnalysisComplete) {
        onAnalysisComplete('F2');
      }
    } catch (err) {
      setError(
        err?.message ||
          'Vista hit a snag while analysing growth & risk. Try again in a moment.'
      );
      setAnalysisDuration(null);

      if (onAnalysisComplete) {
        onAnalysisComplete('F2');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function renderAnalysisContent() {
    // Fallback: old behaviour, just show plain text
    if (!analysisJson || typeof analysisJson !== 'object') {
      return (
        <p
          style={{
            margin: 0,
            color: '#334155',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
          }}
        >
          {analysisText}
        </p>
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

        {/* Growth analysis */}
        {data.growth_analysis && (
          <div>
            <strong>Growth analysis</strong>
            <div
              style={{
                marginTop: 4,
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.growth_analysis.revenue_growth && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Revenue growth:</strong>{' '}
                  {data.growth_analysis.revenue_growth}
                </p>
              )}
              {data.growth_analysis.profitability_trend && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Profitability trend:</strong>{' '}
                  {data.growth_analysis.profitability_trend}
                </p>
              )}
              {data.growth_analysis.growth_drivers && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Growth drivers:</strong>{' '}
                  {data.growth_analysis.growth_drivers}
                </p>
              )}
              {data.growth_analysis.market_outlook && (
                <p style={{ margin: 0 }}>
                  <strong>Market outlook:</strong>{' '}
                  {data.growth_analysis.market_outlook}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Risk analysis */}
        {data.risk_analysis && (
          <div>
            <strong>Risk analysis</strong>
            <div
              style={{
                marginTop: 4,
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.risk_analysis.business_risks && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Business risks:</strong>{' '}
                  {data.risk_analysis.business_risks}
                </p>
              )}
              {data.risk_analysis.credit_and_liquidity_risks && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Credit & liquidity risks:</strong>{' '}
                  {data.risk_analysis.credit_and_liquidity_risks}
                </p>
              )}
              {data.risk_analysis.macro_and_regulatory_risks && (
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Macro & regulatory risks:</strong>{' '}
                  {data.risk_analysis.macro_and_regulatory_risks}
                </p>
              )}
              {data.risk_analysis.governance_or_execution_concerns && (
                <p style={{ margin: 0 }}>
                  <strong>Governance / execution concerns:</strong>{' '}
                  {data.risk_analysis.governance_or_execution_concerns}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Final insight */}
        {data.final_insight && (
          <div>
            <strong>Final insight</strong>
            <p
              style={{
                margin: '4px 0 0',
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {data.final_insight}
            </p>
          </div>
        )}
      </div>
    );
  }

  const buttonLabel = isLockedByUsage
    ? 'Analyse growth & risk (Unlock with Pro)'
    : isLoading
    ? 'Vista is analysing…'
    : 'Analyse growth & risk';

  const buttonStyle = {
    background: isLockedByUsage || isLoading ? '#fef3c7' : '#f59e0b',
    color: isLockedByUsage ? '#b45309' : '#ffffff',
    border: isLockedByUsage ? '1.5px dashed #fbbf24' : 'none',
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
            background: '#fef3c7',
            color: '#b45309',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          F‑2 · Growth & risk
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: '1.3rem',
            color: '#0f172a',
            fontWeight: 800,
          }}
        >
          KNOW THE GROWTH OPPORTUNITIES AND MAJOR RISKS
        </h2>

        <p
          style={{
            margin: 0,
            color: '#64748b',
            fontSize: '0.96rem',
            lineHeight: 1.7,
          }}
        >
          Vista analyses the company’s growth opportunities and major risks based
          on the annual report, so you can see where the company can grow and
          what might hold it back.
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
        onClick={handleRunGrowthRisk}
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

      {analysisText && (
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
            Vista’s growth & risk view
          </h3>

          {renderAnalysisContent()}
        </div>
      )}
    </section>
  );
}

export default GrowthRiskSection;