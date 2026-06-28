// src/services/askService.js

const API_BASE_URL = 'https://ai-business-report-analyzer.onrender.com';

// question: string
// options: { reportId?: string } – we can pass the active report
export async function askQuestion(question, options = {}) {
  const payload = {
    question,
  };

  // If backend expects report_id, include it
  if (options.reportId) {
    payload.report_id = options.reportId;
  }

  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Ask endpoint failed on server.");
  }

  const data = await response.json();

  const answer =
    data.answer ||
    data.result ||
    data.response ||
    "The server did not return an answer text.";

  return {
    question,
    answer,
    timestamp: new Date().toISOString(),
    raw: data,
  };
}
