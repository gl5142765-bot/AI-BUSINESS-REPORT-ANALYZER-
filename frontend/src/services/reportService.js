// src/services/reportService.js

const API_BASE_URL = 'https://ai-business-report-analyzer.onrender.com';

// file: File (PDF)
// onProgress: optional (percent) => void
export async function uploadReport(file, onProgress) {
  if (!file) {
    throw new Error("No file selected.");
  }

  // Let the UI know upload started
  if (typeof onProgress === "function") {
    onProgress(5);
  }

  const formData = new FormData();
  // IMPORTANT: this field name must match your FastAPI endpoint:
  // async def upload_file(file: UploadFile = File(...))
  formData.append("file", file);

  // FastAPI path is /upload, not /reports/upload
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Upload failed on server.");
  }

  // Backend should return JSON
  const data = await response.json();

  // Drive progress to 100% after successful response
  if (typeof onProgress === "function") {
    onProgress(100);
  }

  // Normalize shape so App.jsx + UploadSection work as‑is
  return {
    // Use backend values if present, otherwise fall back
    report_id: data.report_id || data.id || null,
    saved_filename: data.saved_filename || data.stored_filename || file.name,
    original_filename: data.original_filename || file.name,
    pages_loaded: data.pages_loaded ?? data.page_count ?? 0,
    chunks_created: data.chunks_created ?? data.chunk_count ?? 0,
    pipeline_status: data.pipeline_status || data.status || "completed",
    message:
      data.message || "PDF uploaded, processed, and activated successfully",
  };
}
