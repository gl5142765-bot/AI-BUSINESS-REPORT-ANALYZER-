// src/App.jsx
import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import AboutSection from './components/AboutSection';
import AnalysisFlowSection from './components/AnalysisFlowSection';
import UploadSection from './components/UploadSection';
import AuthModal from './components/AuthModal';
import AskVistaSection from './components/AskVistaSection';
import CompanyOverviewSection from './components/CompanyOverviewSection';
import FinancialComplianceSection from './components/FinancialComplianceSection';
import ExecutiveSummarySection from './components/ExecutiveSummarySection';
import GrowthRiskSection from './components/GrowthRiskSection';
import ResultPanelSection from './components/ResultPanelSection';

import proQrImage from './assets/QrCode.jpeg';

const SHEET_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbwFTcIOHwvyzpOVhKxjs5ut6kQWj0rF_bBlWuOxP5PuyXrVH_8HvIr9uPKIH49qva9aCQ/exec';

const PLAN_LIMITS = {
  free: {
    reports: 8,
    customQuestionsPerReport: 10,
  },
  pro: {
    reports: 20,
    customQuestionsPerReport: 20,
  },
};

const LOCAL_STORAGE_KEY = 'vista_app_state_v1';

function getUserKey(user) {
  if (!user || !user.mobile) return null;
  return `${LOCAL_STORAGE_KEY}::${user.mobile.trim()}`;
}

const featureRowStyle = {
  color: '#334155',
  fontSize: '0.98rem',
  fontWeight: 500,
  lineHeight: 1.6,
};

function App() {
  const uploadRef = useRef(null);

  const [user, setUser] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [authError, setAuthError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const [uploadedReport, setUploadedReport] = useState(null);
  const [plan, setPlan] = useState('free');
  const [reportsUsed, setReportsUsed] = useState(0);
  const [questionUsageByReport, setQuestionUsageByReport] = useState({});
  const [activeReportId, setActiveReportId] = useState(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [activeAnalysisMode, setActiveAnalysisMode] = useState(null);

  const [featureHistory, setFeatureHistory] = useState({
    mode1: [],
    F1: [],
    F2: [],
    F3: [],
    F4: [],
  });

  // --- helpers for history/usage ---

  function handleFeatureResult(featureKey, payload) {
    setFeatureHistory((prev) => {
      const safeKey = ['mode1', 'F1', 'F2', 'F3', 'F4'].includes(featureKey)
        ? featureKey
        : 'mode1';

      const nextArray = Array.isArray(prev[safeKey]) ? prev[safeKey] : [];

      return {
        ...prev,
        [safeKey]: [
          ...nextArray,
          {
            ...payload,
            timestamp: payload.timestamp || Date.now(),
          },
        ],
      };
    });
  }

  function resetUsageState() {
    setPlan('free');
    setReportsUsed(0);
    setQuestionUsageByReport({});
    setActiveReportId(null);
    setUploadedReport(null);
    setAnalysisProgress(0);
    setIsAnalysing(false);
    setActiveAnalysisMode(null);
    setFeatureHistory({
      mode1: [],
      F1: [],
      F2: [],
      F3: [],
      F4: [],
    });
  }

  function hydrateUserBucket(targetUser) {
    if (!targetUser) {
      resetUsageState();
      return;
    }

    try {
      const userKey = getUserKey(targetUser);
      const userBucketRaw = userKey
        ? window.localStorage.getItem(userKey)
        : null;
      const userBucket = userBucketRaw ? JSON.parse(userBucketRaw) : null;

      if (!userBucket) {
        resetUsageState();
        return;
      }

      if (userBucket.plan === 'free' || userBucket.plan === 'pro') {
        setPlan(userBucket.plan);
      } else {
        setPlan('free');
      }

      if (typeof userBucket.reportsUsed === 'number') {
        setReportsUsed(userBucket.reportsUsed);
      } else {
        setReportsUsed(0);
      }

      if (
        userBucket.questionUsageByReport &&
        typeof userBucket.questionUsageByReport === 'object'
      ) {
        setQuestionUsageByReport(userBucket.questionUsageByReport);
      } else {
        setQuestionUsageByReport({});
      }

      if (userBucket.activeReportId) {
        setActiveReportId(userBucket.activeReportId);
      } else {
        setActiveReportId(null);
      }

      if (userBucket.uploadedReport) {
        setUploadedReport(userBucket.uploadedReport);
      } else {
        setUploadedReport(null);
      }
    } catch (error) {
      console.error('Failed to hydrate user bucket:', error);
      resetUsageState();
    }
  }

  // --- hydration from localStorage ---

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        setHasHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed.registeredUsers)) {
        setRegisteredUsers(parsed.registeredUsers);
      }

      const storedUser =
        (parsed.lastUser && parsed.lastUser.mobile && parsed.lastUser) ||
        (parsed.user && parsed.user.mobile && parsed.user) ||
        null;

      if (storedUser) {
        setUser(storedUser);
        hydrateUserBucket(storedUser);
      }
    } catch (error) {
      console.error('Failed to restore saved Vista state:', error);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  // --- save global + per‑user buckets ---

  useEffect(() => {
    if (!hasHydrated) return;

    try {
      const globalPayload = {
        registeredUsers,
        lastUser: user,
      };

      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(globalPayload),
      );

      const userKey = getUserKey(user);
      if (userKey) {
        const userBucket = {
          plan,
          reportsUsed,
          questionUsageByReport,
          activeReportId,
          uploadedReport,
        };

        window.localStorage.setItem(userKey, JSON.stringify(userBucket));
      }
    } catch (error) {
      console.error('Failed to save Vista state:', error);
    }
  }, [
    hasHydrated,
    user,
    registeredUsers,
    plan,
    reportsUsed,
    questionUsageByReport,
    activeReportId,
    uploadedReport,
  ]);

  // --- toast lifecycle ---

  useEffect(() => {
    if (!toastMessage) return;

    const timer = setTimeout(() => {
      setToastMessage('');
    }, 2200);

    return () => clearTimeout(timer);
  }, [toastMessage]);

  // --- generic helpers ---

  function scrollToUpload() {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function requireAuth() {
    if (user) {
      return true;
    }

    setToastMessage('Please sign in to continue.');
    setAuthError('');
    setAuthMode('signin');
    setShowAuthModal(true);
    return false;
  }

  function getCurrentPlanLimits() {
    return PLAN_LIMITS[plan];
  }

  function resetPaymentFlow() {
    setPaymentError('');
    setIsPaymentLoading(false);
  }

  function openUpgradePrompt(reason) {
    setUpgradeReason(reason);
    resetPaymentFlow();
    setShowUpgradeModal(true);
  }

  function closeUpgradeModal() {
    setShowUpgradeModal(false);
    resetPaymentFlow();
  }

  function requireReportUploadAccess() {
    const limits = getCurrentPlanLimits();

    if (reportsUsed < limits.reports) {
      return true;
    }

    openUpgradePrompt(
      `You have reached your ${limits.reports}-report limit on the free plan. Upgrade to Pro for ₹49/month via UPI.`,
    );
    return false;
  }

  function requireQuestionAccess(reportId) {
    const limits = getCurrentPlanLimits();
    const usedQuestions = questionUsageByReport[reportId] || 0;

    if (usedQuestions < limits.customQuestionsPerReport) {
      return true;
    }

    openUpgradePrompt(
      `You have reached the ${limits.customQuestionsPerReport} custom-question limit for this report. Upgrade to Pro for ₹49/month via UPI.`,
    );
    return false;
  }

  // --- auth handlers ---

  function openSignIn() {
    setAuthError('');
    setAuthMode('signin');
    setShowAuthModal(true);
  }

  function openLogin() {
    setAuthError('');
    setAuthMode('login');
    setShowAuthModal(true);
  }

  function handleSignInClick() {
    openSignIn();
  }

  function handleLoginClick() {
    openLogin();
  }

  function handleLogoutClick() {
    resetUsageState();
    setUser(null);
    setToastMessage('You have been logged out.');
  }

  async function saveUserToGoogleSheets(formData) {
    if (!SHEET_WEB_APP_URL || SHEET_WEB_APP_URL.includes('PASTE_YOUR')) {
      return;
    }

    await fetch(SHEET_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email,
      }),
    });
  }

  async function handleSignIn(formData) {
    const alreadyExists = registeredUsers.some(
      (item) => item.mobile.trim() === formData.mobile.trim(),
    );

    if (alreadyExists) {
      setAuthError('This mobile number has already signed in. Please use Login.');
      return;
    }

    const newUser = {
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
    };

    setRegisteredUsers((prev) => [...prev, newUser]);
    setUser(newUser);

    resetUsageState();
    hydrateUserBucket(newUser);

    setAuthError('');
    setShowAuthModal(false);
    setToastMessage(`Thank you, ${formData.name}!`);

    try {
      await saveUserToGoogleSheets(formData);
    } catch (error) {
      console.error('Google Sheets save failed:', error);
    }
  }

  function handleLogin(formData) {
    const existingUser = registeredUsers.find(
      (item) => item.mobile.trim() === formData.mobile.trim(),
    );

    if (!existingUser) {
      setAuthError('You cannot log in before signing in. Please sign in first.');
      return;
    }

    setUser(existingUser);

    resetUsageState();
    hydrateUserBucket(existingUser);

    setAuthError('');
    setShowAuthModal(false);
    setToastMessage(`Thank you, ${existingUser.name || 'User'}!`);
  }

  // --- upload + usage handlers ---

  function handleUploadReport(result) {
    if (!requireAuth()) return false;

    const allowed = requireReportUploadAccess();
    if (!allowed) return false;

    const newReportId = result?.report_id || result?.saved_filename;

    // New report ⇒ fresh state for this report
    setUploadedReport(result);
    setReportsUsed((prev) => prev + 1);
    setActiveReportId(newReportId);

    // Always start this report at 0 questions
    setQuestionUsageByReport((prev) => ({
      ...prev,
      [newReportId]: 0,
    }));

    // Reset analysis progress and history for this report
    setAnalysisProgress(0);
    setIsAnalysing(false);
    setActiveAnalysisMode(null);
    setFeatureHistory({
      mode1: [],
      F1: [],
      F2: [],
      F3: [],
      F4: [],
    });

    setToastMessage('Report uploaded and processed successfully.');
    return true;
  }

  // called from AskVistaSection after backend returns answer
  function handleAskCustomQuestionUsage() {
    if (!activeReportId) {
      setToastMessage('Please upload a report first.');
      return false;
    }

    if (!requireAuth()) return false;

    const allowed = requireQuestionAccess(activeReportId);
    if (!allowed) return false;

    setQuestionUsageByReport((prev) => ({
      ...prev,
      [activeReportId]: (prev[activeReportId] || 0) + 1,
    }));

    return true;
  }

  async function handleVerifyExistingQrPayment() {
    if (!user) {
      setToastMessage('Please sign in before payment verification.');
      setShowAuthModal(true);
      return;
    }

    try {
      setPaymentError('');
      setIsPaymentLoading(true);

      const result = await verifyExistingQrPayment();

      if (result.success) {
        setPlan('pro');
        setShowUpgradeModal(false);
        setPaymentError('');
        setToastMessage('Payment verified. Vista Pro plan activated.');
      } else {
        setPaymentError(
          result.message || 'Payment not received yet. Please pay and try again.',
        );
      }
    } catch (error) {
      setPaymentError(error.message || 'Payment verification failed.');
    } finally {
      setIsPaymentLoading(false);
    }
  }

  // --- derived values ---

  const currentLimits = getCurrentPlanLimits();

  const activeReportQuestionCount = activeReportId
    ? questionUsageByReport[activeReportId] || 0
    : 0;

  const mode1QuestionLimit = currentLimits.customQuestionsPerReport;

  const hasReachedReportLimit = reportsUsed >= currentLimits.reports;

const hasReachedQuestionLimit =
  !!activeReportId &&
  activeReportQuestionCount >= currentLimits.customQuestionsPerReport;

const isUploadLocked = hasReachedReportLimit;

// Mode‑1 lock: by question limit OR report limit
const isMode1Locked = hasReachedQuestionLimit || hasReachedReportLimit;

// F‑1..F‑4 lock: tie to report limit (or any rule you want)
const isFeatureLocked = hasReachedReportLimit;

  

  function showUpgradeForUpload() {
    openUpgradePrompt(
      `You have reached your ${currentLimits.reports}-report limit on the free plan. Upgrade to Pro for ₹49/month via UPI.`,
    );
  }

  function showUpgradeForQuestions() {
    openUpgradePrompt(
      'You have reached the free plan limit for this report. Unlock Pro to continue asking questions and using report features.',
    );
  }

  function handleLockedUploadClick() {
    if (!requireAuth()) return;
    showUpgradeForUpload();
  }

  function handleLockedFeatureClick() {
    if (!requireAuth()) return;
    showUpgradeForQuestions();
  }

  // --- analysis progress for F1–F4 ---

  function handleAnalysisStart(mode) {
    if (!['F1', 'F2', 'F3', 'F4'].includes(mode)) {
      return false;
    }

    if (!requireAuth()) return false;

    if (isFeatureLocked) {
      showUpgradeForQuestions();
      return false;
    }

    setIsAnalysing(true);
    setActiveAnalysisMode(mode);

    setAnalysisProgress((prev) => {
      if (mode === 'F1') return prev < 40 ? 40 : prev;
      if (mode === 'F2') return prev < 60 ? 60 : prev;
      if (mode === 'F3') return prev < 80 ? 80 : prev;
      if (mode === 'F4') return prev < 95 ? 95 : prev;
      return prev;
    });

    return true;
  }

  function handleAnalysisComplete(mode) {
    if (!['F1', 'F2', 'F3', 'F4'].includes(mode)) {
      setIsAnalysing(false);
      setActiveAnalysisMode(null);
      return;
    }

    setIsAnalysing(false);
    setActiveAnalysisMode(null);

    setAnalysisProgress((prev) => {
      if (mode === 'F1') return 40;
      if (mode === 'F2') return 60;
      if (mode === 'F3') return 80;
      if (mode === 'F4') return 100;
      return prev;
    });
  }

  // --- JSX ---

  return (
    <div>
      <Header
        user={user}
        onSignInClick={handleSignInClick}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogoutClick}
      />

      <Hero onUploadClick={scrollToUpload} />

      <AboutSection />

      <AnalysisFlowSection />

      <UploadSection
        ref={uploadRef}
        user={user}
        plan={plan}
        reportsUsed={reportsUsed}
        reportsLimit={currentLimits.reports}
        activeReportId={activeReportId}
        activeReportQuestionCount={activeReportQuestionCount}
        activeReportQuestionLimit={currentLimits.customQuestionsPerReport}
        requireAuth={requireAuth}
        onSignInClick={handleSignInClick}
        onLoginClick={handleLoginClick}
        onUploadReport={handleUploadReport}
        isUploadLocked={isUploadLocked}
        onLockedClick={handleLockedUploadClick}
        analysisProgress={analysisProgress}
        isAnalysing={isAnalysing}
        activeAnalysisMode={activeAnalysisMode}
      />

      {uploadedReport && (
        <>
          <AskVistaSection
            activeReportId={activeReportId}
            activeReportQuestionCount={activeReportQuestionCount}
            mode1QuestionLimit={mode1QuestionLimit}
            isLockedByUsage={isMode1Locked}
            onLockedClick={handleLockedFeatureClick}
            onAnalysisStart={() => {
              setIsAnalysing(true);
            }}
            onAnalysisComplete={() => {
              setIsAnalysing(false);
            }}
            onAskCustomQuestion={(question, answer) => {
              if (isMode1Locked) {
                handleLockedFeatureClick();
                return;
              }

              const allowed = handleAskCustomQuestionUsage();
              if (!allowed) return;

              handleFeatureResult('mode1', {
                reportId: activeReportId,
                question,
                answer,
              });
            }}
          />

          <CompanyOverviewSection
            activeReportId={activeReportId}
            isLockedByUsage={isFeatureLocked}
            onLockedClick={handleLockedFeatureClick}
            onAnalysisStart={() => handleAnalysisStart('F1')}
            onAnalysisComplete={() => handleAnalysisComplete('F1')}
            onFeatureResult={(featureKey, payload) => {
              handleFeatureResult(featureKey, {
                reportId: activeReportId,
                ...payload,
              });
            }}
          />

          <GrowthRiskSection
            activeReportId={activeReportId}
            isLockedByUsage={isFeatureLocked}
            onLockedClick={handleLockedFeatureClick}
            onAnalysisStart={() => handleAnalysisStart('F2')}
            onAnalysisComplete={() => handleAnalysisComplete('F2')}
            onFeatureResult={(featureKey, payload) => {
              handleFeatureResult(featureKey, {
                reportId: activeReportId,
                ...payload,
              });
            }}
          />

          <FinancialComplianceSection
            activeReportId={activeReportId}
            isLockedByUsage={isFeatureLocked}
            onLockedClick={handleLockedFeatureClick}
            onAnalysisStart={() => handleAnalysisStart('F3')}
            onAnalysisComplete={() => handleAnalysisComplete('F3')}
            onFeatureResult={(featureKey, payload) => {
              handleFeatureResult(featureKey, {
                reportId: activeReportId,
                ...payload,
              });
            }}
          />

          <ExecutiveSummarySection
            activeReportId={activeReportId}
            isLockedByUsage={isFeatureLocked}
            onLockedClick={handleLockedFeatureClick}
            onAnalysisStart={() => handleAnalysisStart('F4')}
            onAnalysisComplete={() => handleAnalysisComplete('F4')}
            onFeatureResult={(featureKey, payload) => {
              handleFeatureResult(featureKey, {
                reportId: activeReportId,
                ...payload,
              });
            }}
          />

          <ResultPanelSection featureHistory={featureHistory} />
        </>
      )}

      <AuthModal
        show={showAuthModal}
        authMode={authMode}
        setAuthMode={setAuthMode}
        onClose={() => {
          setShowAuthModal(false);
          setAuthError('');
        }}
        onSignIn={handleSignIn}
        onLogin={handleLogin}
        authError={authError}
      />

      {showUpgradeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.52)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 28px 80px rgba(15, 23, 42, 0.22)',
              position: 'relative',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '999px',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 700,
                fontSize: '0.9rem',
                marginBottom: '18px',
              }}
            >
              Vista · Upgrade to Pro
            </div>

            <p
              style={{
                marginTop: 0,
                marginBottom: '10px',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: '#4b5563',
              }}
            >
              Upgrade if you want to ask more custom questions from this report,
              or if you want to analyse more reports than the free limit.
            </p>

            <h3
              style={{
                margin: 0,
                fontSize: '1.9rem',
                lineHeight: 1.2,
                color: '#0f172a',
                fontWeight: 800,
              }}
            >
              Continue your Vista analysis without limits
            </h3>

            <p
              style={{
                marginTop: '14px',
                marginBottom: '18px',
                fontSize: '1rem',
                lineHeight: 1.75,
                color: '#64748b',
              }}
            >
              {upgradeReason}
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #dbeafe',
                borderRadius: '18px',
                padding: '20px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.92rem',
                      color: '#64748b',
                      marginBottom: '4px',
                    }}
                  >
                    Pro Plan
                  </p>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '1.5rem',
                      color: '#0f172a',
                      fontWeight: 800,
                    }}
                  >
                    ₹49/month
                  </h4>
                </div>

                <div
                  style={{
                    background: '#dbeafe',
                    color: '#1d4ed8',
                    borderRadius: '999px',
                    padding: '8px 12px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                  }}
                >
                  UPI QR available
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: '8px',
                }}
              >
                <div style={featureRowStyle}>✓ Upload up to 20 reports</div>
                <div style={featureRowStyle}>
                  ✓ Ask up to 20 custom questions per report
                </div>
                <div style={featureRowStyle}>
                  ✓ Keep Vista analysis flowing without interruption
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid #dbeafe',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '16px',
              }}
            >
              <img
                src={proQrImage}
                alt="UPI QR code for Vista Pro payment"
                width={200}
                height={200}
                style={{
                  width: '100%',
                  maxWidth: '150px',
                  margin: '0 auto 12px',
                  borderRadius: '10px',
                }}
              />

              <p
                style={{
                  margin: '0 0 6px',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                Scan to pay ₹49
              </p>

              <p
                style={{
                  margin: 0,
                  color: '#64748b',
                  fontSize: '0.95rem',
                  lineHeight: 1.4,
                }}
              >
                Pay using this UPI QR, then click the button below to verify and
                activate Vista Pro.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={handleVerifyExistingQrPayment}
                disabled={isPaymentLoading}
                style={{
                  background: isPaymentLoading ? '#93c5fd' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: isPaymentLoading ? 'not-allowed' : 'pointer',
                  opacity: isPaymentLoading ? 0.85 : 1,
                }}
              >
                {isPaymentLoading ? 'Checking payment...' : 'I have paid'}
              </button>

              <button
                onClick={closeUpgradeModal}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '999px',
                  padding: '12px 20px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                Maybe later
              </button>
            </div>

            {paymentError && (
              <p
                style={{
                  marginTop: '12px',
                  marginBottom: 0,
                  fontSize: '0.92rem',
                  color: '#dc2626',
                  lineHeight: 1.6,
                }}
              >
                {paymentError}
              </p>
            )}

            <p
              style={{
                marginTop: paymentError ? '10px' : '14px',
                marginBottom: 0,
                fontSize: '0.9rem',
                color: '#94a3b8',
                lineHeight: 1.6,
              }}
            >
              Payment will be checked against your existing UPI QR before Vista
              Pro access is activated.
            </p>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#111827',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            zIndex: 1000,
            fontSize: '0.95rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;