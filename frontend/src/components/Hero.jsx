function Hero({ onUploadClick }) {
  return (
    <section
      style={{
        padding: '80px 20px 100px',
        textAlign: 'center',
        background: 'radial-gradient(circle at top, #1f2937 0, #020617 55%, #000 100%)',
        color: '#e5efff',
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: '16px',
          fontSize: '0.9rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#60a5fa',
          fontWeight: 700,
        }}
      >
        AI‑powered annual report insights
      </p>

      <h1
        style={{
          margin: 0,
          marginBottom: '16px',
          fontSize: '3.2rem',
          lineHeight: 1.1,
          fontWeight: 900,
          color: '#f9fafb',
        }}
      >
        Annual business
        <br />
        report analyzer
      </h1>

      <p
        style={{
          margin: 0,
          marginBottom: '32px',
          fontSize: '1.05rem',
          color: '#cbd5f5',
          maxWidth: '640px',
          marginInline: 'auto',
          lineHeight: 1.75,
        }}
      >
        Turn long annual reports into clear, AI‑powered business insights in minutes.
      </p>

      <button
        type="button"
        onClick={onUploadClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 28px',
          borderRadius: '999px',
          border: '1px solid #38bdf8',
          background:
            'linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #38bdf8 100%)',
          boxShadow: '0 18px 45px rgba(37, 99, 235, 0.6)',
          color: '#f9fafb',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        Upload annual report
      </button>
    </section>
  );
}

export default Hero;