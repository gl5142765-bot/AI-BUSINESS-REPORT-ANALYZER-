
// src/components/AskVistaSection.jsx
import { useState } from 'react';
import { askQuestion } from '../services/askService';

function AskVistaSection({
  activeReportId,
  activeReportQuestionCount,
  mode1QuestionLimit,
  isLockedByUsage,
  onAskCustomQuestion,   // (question, answer) => void
  onLockedClick,         // () => void
  onAnalysisStart,       // () => void
  onAnalysisComplete,    // () => void
}) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState('');

  async function handleAskVista(e) {
    e.preventDefault();
    if (!question.trim()) return;

    // If usage is locked (8 reports or 10 questions for this report), just show paywall
    if (isLockedByUsage) {
      setError('');
      if (typeof onLockedClick === 'function') {
        onLockedClick();
      }
      return;
    }

    if (!activeReportId) {
      setError('Please upload and select an active report before asking Vista.');
      return;
    }

    // Local guard based on counts, in case parent flags aren’t available yet
    if (
      typeof activeReportQuestionCount === 'number' &&
      typeof mode1QuestionLimit === 'number' &&
      activeReportQuestionCount >= mode1QuestionLimit
    ) {
      setError(
        'You have reached the custom-question limit for this report on your current plan.'
      );
      return;
    }

    try {
      setIsAsking(true);
      setError('');
      setAnswer('');

      if (typeof onAnalysisStart === 'function') {
        onAnalysisStart();
      }

      const result = await askQuestion(question, { reportId: activeReportId });
      const nextAnswer = result?.answer || '';
      setAnswer(nextAnswer);

      if (typeof onAskCustomQuestion === 'function') {
        // Let App count usage + push into featureHistory.mode1
        onAskCustomQuestion(question, nextAnswer);
      }
    } catch (err) {
      setError(
        err?.message || 'Vista could not answer right now. Please try again.'
      );
    } finally {
      setIsAsking(false);

      if (typeof onAnalysisComplete === 'function') {
        onAnalysisComplete();
      }
    }
  }

  return (
    <section
      style={{
        marginTop: '32px',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
      }}
    >
      <h2 style={{ margin: 0, marginBottom: '8px', color: '#0f172a' }}>
        Ask Vista about your report
      </h2>

      <p
        style={{
          margin: 0,
          marginBottom: '16px',
          color: '#64748b',
          lineHeight: 1.6,
        }}
      >
        Type your question about this annual report. Vista will answer using only
        the uploaded document, not the open internet.
      </p>

      <form onSubmit={handleAskVista} style={{ marginBottom: '16px' }}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Example: How did revenue change in FY 2024–25?"
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '12px',
            border: '1px solid #775c5c',
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: '0.95rem',
            marginBottom: '10px',
          }}
        />

        <button
          type="submit"
          disabled={isAsking}
          style={{
            padding: '8px 16px',
            borderRadius: '999px',
            border: isLockedByUsage ? '1px dashed #94a3b8' : '1px solid #1d4ed8',
            background: isLockedByUsage ? '#e5e7eb' : '#1d4ed8',
            color: isLockedByUsage ? '#4b5563' : '#ffffff',
            fontWeight: 600,
            fontSize: '0.95rem',
            opacity: isAsking ? 0.7 : 1,
            cursor: isAsking ? 'wait' : 'pointer',
            transition: 'background 0.15s ease, opacity 0.15s ease',
          }}
        >
          {isAsking
            ? 'Asking Vista...'
            : isLockedByUsage
            ? 'Ask (Unlock with Pro)'
            : 'Ask Vista'}
        </button>
      </form>

      {error && (
        <p
          style={{
            margin: 0,
            marginBottom: '8px',
            color: '#dc2626',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </p>
      )}

      {answer && (
        <div
          style={{
            marginTop: '8px',
            padding: '14px',
            borderRadius: '12px',
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
            Answer
          </h3>
          <div style={{ color: '#0f172a', lineHeight: 1.6 }}>{answer}</div>
        </div>
      )}
    </section>
  );
}

export default AskVistaSection;