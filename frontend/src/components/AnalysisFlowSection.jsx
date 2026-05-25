const steps = [
  {
    number: '1',
    title: 'Upload',
    description:
      "Upload the company's annual report PDF to start the analysis flow.",
  },
  {
    number: '2',
    title: 'Ask Custom Questions',
    description:
      'Ask your report-specific question and get focused answers from the uploaded document.',
  },
  {
    number: '3',
    title: 'F-1 Company Overview',
    description:
      'Understand the company profile, business model, operations, and overall context.',
  },
  {
    number: '4',
    title: 'F-2 Growth and Risk',
    description:
      'Review growth drivers, business strategy, challenges, and major risk signals.',
  },
  {
    number: '5',
    title: 'F-3 Financial and Compliance',
    description:
      'Study financial performance, accounting signals, and compliance-related observations.',
  },
  {
    number: '6',
    title: 'F-4 Execution Summary',
    description:
      'See the final structured wrap-up of the report analysis in one clear view.',
  },
];

function AnalysisFlowSection() {
  return (
    <section className="analysis-flow-section">
      <div className="analysis-flow-container">
        <div className="analysis-flow-header">
          <h2>How the analysis flows</h2>
          <p>
            From upload to structured insight, the analyzer follows a guided
            six-step workflow so users can move from dense annual reports to
            focused business understanding.
          </p>
        </div>

        <div className="analysis-flow-timeline">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`analysis-flow-row ${index % 2 === 0 ? 'left' : 'right'}`}
            >
              <div className="analysis-flow-card">
                <div className="analysis-flow-badge">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              <div className="analysis-flow-dot" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .analysis-flow-section {
          background: #f8fafc;
          padding: 72px 24px 52px;
        }

        .analysis-flow-container {
          max-width: 1050px;
          margin: 0 auto;
        }

        .analysis-flow-header {
          text-align: center;
          margin-bottom: 34px;
        }

        .analysis-flow-header h2 {
          font-size: clamp(2rem, 4vw, 3.6rem);
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 12px;
          line-height: 1.08;
          letter-spacing: -0.03em;
        }

        .analysis-flow-header p {
          max-width: 760px;
          margin: 0 auto;
          font-size: 1rem;
          line-height: 1.75;
          color: #64748b;
        }

        .analysis-flow-timeline {
          position: relative;
          max-width: 920px;
          margin: 0 auto;
          padding: 6px 0 0;
        }

        .analysis-flow-timeline::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          border-radius: 999px;
          background: linear-gradient(180deg, #60a5fa 0%, #2563eb 45%, #1d4ed8 100%);
        }

        .analysis-flow-row {
          position: relative;
          display: flex;
          margin-bottom: 24px;
        }

        .analysis-flow-row.left {
          justify-content: flex-start;
        }

        .analysis-flow-row.right {
          justify-content: flex-end;
        }

        .analysis-flow-card {
          width: calc(50% - 42px);
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 22px 22px 20px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.07);
          position: relative;
        }

        .analysis-flow-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
          height: 40px;
          border-radius: 999px;
          background: #dbeafe;
          color: #1d4ed8;
          font-weight: 800;
          font-size: 0.98rem;
          margin-bottom: 12px;
        }

        .analysis-flow-card h3 {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 10px;
          line-height: 1.25;
        }

        .analysis-flow-card p {
          font-size: 0.98rem;
          line-height: 1.75;
          color: #475569;
          margin: 0;
        }

        .analysis-flow-dot {
          position: absolute;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #2563eb;
          border: 5px solid #eff6ff;
          box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.10);
          z-index: 2;
        }

        .analysis-flow-row.left .analysis-flow-card::after,
        .analysis-flow-row.right .analysis-flow-card::after {
          content: '';
          position: absolute;
          top: 40px;
          width: 18px;
          height: 2px;
          background: #60a5fa;
        }

        .analysis-flow-row.left .analysis-flow-card::after {
          right: -18px;
        }

        .analysis-flow-row.right .analysis-flow-card::after {
          left: -18px;
        }

        @media (max-width: 768px) {
          .analysis-flow-section {
            padding: 60px 18px 36px;
          }

          .analysis-flow-header {
            margin-bottom: 26px;
          }

          .analysis-flow-header h2 {
            font-size: clamp(2rem, 7vw, 2.8rem);
          }

          .analysis-flow-header p {
            font-size: 0.96rem;
            line-height: 1.7;
          }

          .analysis-flow-timeline::before {
            left: 18px;
            transform: none;
          }

          .analysis-flow-row,
          .analysis-flow-row.left,
          .analysis-flow-row.right {
            justify-content: flex-start;
            margin-bottom: 18px;
          }

          .analysis-flow-card {
            width: calc(100% - 50px);
            margin-left: 50px;
            padding: 18px 16px 16px;
            border-radius: 18px;
          }

          .analysis-flow-dot {
            left: 18px;
            top: 28px;
            width: 18px;
            height: 18px;
          }

          .analysis-flow-row.left .analysis-flow-card::after,
          .analysis-flow-row.right .analysis-flow-card::after {
            left: -16px;
            right: auto;
            width: 16px;
            top: 36px;
          }

          .analysis-flow-badge {
            min-width: 36px;
            height: 36px;
            font-size: 0.92rem;
            margin-bottom: 10px;
          }

          .analysis-flow-card h3 {
            font-size: 1.06rem;
            margin-bottom: 8px;
          }

          .analysis-flow-card p {
            font-size: 0.94rem;
            line-height: 1.65;
          }
        }
      `}</style>
    </section>
  );
}

export default AnalysisFlowSection;