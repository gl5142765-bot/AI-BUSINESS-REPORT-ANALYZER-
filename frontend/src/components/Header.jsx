// src/components/Header.jsx
function Header({ user, onSignInClick, onLoginClick, onLogoutClick }) {
  const isLoggedIn = !!user;

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 40px',
        borderBottom: '1px solid #e0e0e0',
        background: '#ffffff',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>
        Annual business report analyzer
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {isLoggedIn ? (
          <>
            <span
              style={{
                fontSize: '0.9rem',
                color: '#64748b',
              }}
            >
              {user.name ? `Hi, ${user.name}` : 'Logged in'}
            </span>
            <button
              type="button"
              onClick={onLogoutClick}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onSignInClick}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onLoginClick}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: 'none',
                background: '#2563eb',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Login
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;