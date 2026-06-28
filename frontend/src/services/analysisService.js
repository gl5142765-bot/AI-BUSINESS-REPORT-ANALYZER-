// src/services/analysisService.js

// Base URL for the backend API
const API_BASE_URL = const API_BASE = 'https://ai-business-report-analyzer.onrender.com';
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Helper to POST JSON and handle errors
async function postJson(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Try to get a helpful error message
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request to ${path} failed.`);
  }

  return res.json();
}

/**
 * F‑1: Company overview
 * Expects backend endpoint: POST /company-overview
 * Body: { report_id }
 */
export async function getCompanyOverview(reportId) {
  if (!reportId) {
    throw new Error('No active report. Please upload a report first.');
  }

  const data = await postJson('/analyze/company-overview', {
    report_id: reportId,
  });

  return data;
}

/**
 * F‑2: Growth & risk
 * Expects backend endpoint: POST /analyze/growth-risk
 * Body: { report_id }
 */
export async function getGrowthRisk(reportId) {
  if (!reportId) {
    throw new Error('No active report. Please upload a report first.');
  }

  const data = await postJson('/analyze/growth-risk', {
    report_id: reportId,
  });

  // Return raw data, just like F‑1
  return data;
}

/** 
  * F‑3: Financial compliance check
  * Expects backend endpoint: POST /analyze/financial-compliance
  * Body: { report_id }
  */
 export async function getFinancialCompliance(reportId) {
  if (!reportId) {
    throw new Error('No active report. Please upload a report first.');
  }

  const data = await postJson('/analyze/financial-compliance', {
    report_id: reportId,
  });

  return data;  // same style as F‑1 and fixed F‑2
}
/** 
  * F‑4: Executive summary
  * Expects backend endpoint: POST /analyze/executive-summary
  * Body: { report_id }
  */
export async function getExecutiveSummary(reportId) {
  if (!reportId) {
    throw new Error('No active report. Please upload a report first.');
  }

  const data = await postJson('/analyze/executive-summary', {
    report_id: reportId,
  });

  return data;
}
