import { useEffect, useState } from 'react';

function AuthModal({
  show,
  authMode,
  setAuthMode,
  onClose,
  onSignIn,
  onLogin,
  authError,
}) {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      setFormData({
        name: '',
        mobile: '',
        email: '',
      });
      setErrors({});
    }
  }, [show, authMode]);

  if (!show) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validateForm() {
    const newErrors = {};

    if (authMode === 'signin' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobile.trim())) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = 'Enter a valid email address';
    }

    return newErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    if (authMode === 'signin') {
      onSignIn(formData);
    } else {
      onLogin(formData);
    }
  }

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        `}
      </style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8, 12, 24, 0.58)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '460px',
            borderRadius: '18px',
            padding: '32px',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.22)',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '14px',
              border: 'none',
              background: 'transparent',
              fontSize: '1.4rem',
              color: '#475569',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>

          <h2
            style={{
              fontSize: '1.9rem',
              lineHeight: 1.2,
              color: '#0f172a',
              marginBottom: '10px',
              textAlign: 'center',
              fontWeight: 800,
            }}
          >
            {authMode === 'signin'
              ? 'Sign in to Annual business report analyzer'
              : 'Login to Annual business report analyzer'}
          </h2>

          <p
            style={{
              color: '#475569',
              marginBottom: '22px',
              textAlign: 'center',
              fontSize: '1rem',
            }}
          >
            {authMode === 'signin'
              ? 'Create your account to continue.'
              : 'Log in with your signed-in mobile number.'}
          </p>

          <button
            type="button"
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#0f172a',
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: '18px',
            }}
          >
            Continue with Google
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            <div style={{ height: '1px', background: '#e2e8f0', flex: 1 }} />
            <span style={{ color: '#64748b', fontSize: '0.92rem' }}>or</span>
            <div style={{ height: '1px', background: '#e2e8f0', flex: 1 }} />
          </div>

          {authError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '12px 14px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '0.94rem',
              }}
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {authMode === 'signin' && (
              <div style={{ marginBottom: '15px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  style={inputStyle}
                />
                {errors.name && <p style={errorStyle}>{errors.name}</p>}
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                Mobile number
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter your mobile number"
                style={inputStyle}
              />
              {errors.mobile && <p style={errorStyle}>{errors.mobile}</p>}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                Email (optional)
              </label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                style={inputStyle}
              />
              {errors.email && <p style={errorStyle}>{errors.email}</p>}
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: 'none',
                background: '#0f172a',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              {authMode === 'signin' ? 'Sign in' : 'Login'}
            </button>
          </form>

          <p
            style={{
              marginTop: '18px',
              color: '#475569',
              fontSize: '0.96rem',
              textAlign: 'center',
            }}
          >
            {authMode === 'signin' ? 'Already have an account?' : 'New here?'}{' '}
            <button
              type="button"
              onClick={() =>
                setAuthMode(authMode === 'signin' ? 'login' : 'signin')
              }
              style={{
                border: 'none',
                background: 'transparent',
                color: '#2563eb',
                cursor: 'pointer',
                fontWeight: 700,
                padding: 0,
              }}
            >
              {authMode === 'signin' ? 'Login' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

const inputStyle = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#0f172a',
  fontSize: '1rem',
  outline: 'none',
};

const errorStyle = {
  color: '#dc2626',
  fontSize: '0.88rem',
  marginTop: '6px',
};

export default AuthModal;