const aboutItems = [
  {
    title: 'What',
    text: 'An AI-powered annual business report analyzer that turns long, complex PDFs into structured insights across company overview, growth, risk, finance, and compliance.',
  },
  {
    title: 'How',
    text: 'Upload a company\'s annual report and our system reads, segments, and analyzes it — then surfaces key findings and answers your custom questions.',
  },
  {
    title: 'Who',
    text: 'Built for commerce and finance students, MBA aspirants, retail investors, research teams, and early-career analysts who need clarity fast.',
  },
  {
    title: 'Why',
    text: 'Annual reports are dense and time-consuming. This tool cuts hours of reading into minutes of focused insight, so you can focus on decisions, not documents.',
  },
];

function AboutSection() {
  return (
    <section style={{ padding: '70px 40px', background: '#f8f8f8' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '10px',
            letterSpacing: '-0.02em',
          }}
        >
          About the Analyzer
        </h2>
        <p
          style={{
            fontSize: '1rem',
            color: '#475569',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.7',
          }}
        >
          Understand what the tool does, how it works, who it helps, and why it matters.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
        }}
      >
        {aboutItems.map((item) => (
          <div
            key={item.title}
            style={{
              padding: '24px',
              background: '#fff',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <h3
              style={{
                marginBottom: '12px',
                fontSize: '1.7rem',
                fontWeight: 700,
                color: '#94a3b8',
                textAlign: 'center',
              }}
            >
              {item.title}
            </h3>
            <p
              style={{
                fontSize: '0.98rem',
                lineHeight: '1.9',
                color: '#334155',
                textAlign: 'center',
              }}
            >
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AboutSection;