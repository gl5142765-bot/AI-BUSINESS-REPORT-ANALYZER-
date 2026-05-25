// src/components/ResultPanelSection.jsx

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Just now';

  try {
    return new Date(timestamp).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return 'Just now';
  }
}

function getPreviewText(entry) {
  if (!entry) return 'No history yet.';
  if (typeof entry === 'string') return entry;
  if (entry.answer) return entry.answer;
  if (entry.text) return entry.text;
  if (entry.summary) return entry.summary;
  return 'Result available.';
}

function getSuggestions(featureHistory) {
  const history =
    featureHistory && typeof featureHistory === 'object'
      ? featureHistory
      : { mode1: [], F1: [], F2: [], F3: [], F4: [] };

  const suggestions = [];

  const hasMode1 = history.mode1?.length > 0;
  const hasF1 = history.F1?.length > 0;
  const hasF2 = history.F2?.length > 0;
  const hasF3 = history.F3?.length > 0;
  const hasF4 = history.F4?.length > 0;

  if (hasF1 && hasF2 && !hasF3) {
    suggestions.push('You ran F‑1 and F‑2. Scan financials & compliance (F‑3) next.');
  }

  if (hasF2) {
    suggestions.push(
      "Based on F‑2 risks, ask Vista: “How do these risks show up in the financial numbers?”"
    );
  }

  if (hasF1 && hasF2 && hasF3 && !hasF4) {
    suggestions.push(
      'You already have the core analysis. Generate the executive summary (F‑4) next.'
    );
  }

  if (!hasMode1 && hasF1) {
    suggestions.push(
      'Use Ask Vista to ask a follow‑up question on the company overview.'
    );
  }

  if (hasMode1 && !hasF1 && !hasF2 && !hasF3 && !hasF4) {
    suggestions.push(
      'You have good Q&A history. Run F‑1 company overview to get Vista’s structured summary.'
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      'Run more analysis steps or ask follow‑up questions to unlock smarter suggestions.'
    );
  }

  return suggestions;
}

// Simple card for single latest entry (F1–F4)
function LatestEntryCard({ title, accentBg, accentText, entry, emptyText }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '18px',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 10px',
          borderRadius: '999px',
          background: accentBg,
          color: accentText,
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}
      >
        {title}
      </div>

      {entry ? (
        <>
          <p
            style={{
              margin: 0,
              marginBottom: '8px',
              color: '#94a3b8',
              fontSize: '0.84rem',
              fontWeight: 600,
            }}
          >
            {formatTimestamp(entry.timestamp)}
          </p>

          {'question' in entry && entry.question ? (
            <p
              style={{
                margin: 0,
                marginBottom: '8px',
                color: '#0f172a',
                fontSize: '0.92rem',
                fontWeight: 700,
                lineHeight: 1.6,
              }}
            >
              Q: {entry.question}
            </p>
          ) : null}

          <p
            style={{
              margin: 0,
              color: '#475569',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {getPreviewText(entry)}
          </p>
        </>
      ) : (
        <p
          style={{
            margin: 0,
            color: '#94a3b8',
            fontSize: '0.95rem',
            lineHeight: 1.7,
          }}
        >
          {emptyText}
        </p>
      )}
    </div>
  );
}

// New: list of up to 10 Mode‑1 Q&A entries
function Mode1HistoryCard({ entries }) {
  const hasEntries = Array.isArray(entries) && entries.length > 0;
  const lastTen = hasEntries ? entries.slice(-10) : [];

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '18px',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 10px',
          borderRadius: '999px',
          background: '#ede9fe',
          color: '#6d28d9',
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}
      >
        Mode‑1 · Ask Vista
      </div>

      {!hasEntries ? (
        <p
          style={{
            margin: 0,
            color: '#94a3b8',
            fontSize: '0.95rem',
            lineHeight: 1.7,
          }}
        >
          No custom questions asked yet.
        </p>
      ) : (
        <>
          <p
            style={{
              margin: 0,
              marginBottom: '10px',
              color: '#94a3b8',
              fontSize: '0.84rem',
              fontWeight: 500,
            }}
          >
            Showing your last {lastTen.length} question
            {lastTen.length > 1 ? 's' : ''} for this report.
          </p>

          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: '260px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {lastTen
              .slice()
              .reverse()
              .map((entry, index) => (
                <div
                  key={entry.timestamp || index}
                  style={{
                    borderRadius: '14px',
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                    padding: '10px 12px',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      marginBottom: '4px',
                      color: '#9ca3af',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                    }}
                  >
                    {formatTimestamp(entry.timestamp)}
                  </p>

                  {entry.question && (
                    <p
                      style={{
                        margin: 0,
                        marginBottom: '4px',
                        color: '#0f172a',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        lineHeight: 1.5,
                      }}
                    >
                      Q: {entry.question}
                    </p>
                  )}

                  <p
                    style={{
                      margin: 0,
                      color: '#475569',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {getPreviewText(entry)}
                  </p>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function ResultPanelSection({ featureHistory }) {
  const safeHistory =
    featureHistory && typeof featureHistory === 'object'
      ? featureHistory
      : { mode1: [], F1: [], F2: [], F3: [], F4: [] };

  const mode1Entries = safeHistory.mode1 || [];

  const latestF1 =
    Array.isArray(safeHistory.F1) && safeHistory.F1.length
      ? safeHistory.F1[safeHistory.F1.length - 1]
      : null;
  const latestF2 =
    Array.isArray(safeHistory.F2) && safeHistory.F2.length
      ? safeHistory.F2[safeHistory.F2.length - 1]
      : null;
  const latestF3 =
    Array.isArray(safeHistory.F3) && safeHistory.F3.length
      ? safeHistory.F3[safeHistory.F3.length - 1]
      : null;
  const latestF4 =
    Array.isArray(safeHistory.F4) && safeHistory.F4.length
      ? safeHistory.F4[safeHistory.F4.length - 1]
      : null;

  const suggestions = getSuggestions(safeHistory);

  return (
    <section
      style={{
        marginTop: '28px',
        padding: '28px',
        borderRadius: '24px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          marginBottom: '22px',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 12px',
            borderRadius: '999px',
            background: '#e2e8f0',
            color: '#334155',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '12px',
          }}
        >
          Result panel
        </div>

        <h2
          style={{
            margin: 0,
            marginBottom: '8px',
            fontSize: '1.6rem',
            color: '#0f172a',
            fontWeight: 800,
          }}
        >
          See what you ran and what to do next
        </h2>

        <p
          style={{
            margin: 0,
            color: '#64748b',
            fontSize: '0.98rem',
            lineHeight: 1.7,
          }}
        >
          Review your Ask Vista questions and F‑1 to F‑4 outputs, then pick the
          next best action.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 0.9fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: '16px',
          }}
        >
          {/* Mode‑1: list of last 10 Q&A */}
          <Mode1HistoryCard entries={mode1Entries} />

          {/* F1–F4: latest entry per feature */}
          <LatestEntryCard
            title="F‑1 · Company overview"
            accentBg="#fee2e2"
            accentText="#b91c1c"
            entry={latestF1}
            emptyText="No company overview generated yet."
          />

          <LatestEntryCard
            title="F‑2 · Growth & risk"
            accentBg="#fef3c7"
            accentText="#b45309"
            entry={latestF2}
            emptyText="No growth & risk analysis generated yet."
          />

          <LatestEntryCard
            title="F‑3 · Financial & compliance"
            accentBg="#dbeafe"
            accentText="#1d4ed8"
            entry={latestF3}
            emptyText="No financial & compliance analysis generated yet."
          />

          <LatestEntryCard
            title="F‑4 · Executive summary"
            accentBg="#dcfce7"
            accentText="#15803d"
            entry={latestF4}
            emptyText="No executive summary generated yet."
          />
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: '10px',
              color: '#0f172a',
              fontSize: '1.05rem',
              fontWeight: 800,
            }}
          >
            Suggested next steps
          </h3>

          <p
            style={{
              margin: 0,
              marginBottom: '16px',
              color: '#64748b',
              fontSize: '0.92rem',
              lineHeight: 1.7,
            }}
          >
            Vista looks at your recent runs and suggests the next useful move.
          </p>

          <div
            style={{
              display: 'grid',
              gap: '12px',
            }}
          >
            {suggestions.map((item) => (
              <div
                key={item}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '14px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: '#334155',
                    fontSize: '0.94rem',
                    lineHeight: 1.7,
                  }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResultPanelSection;