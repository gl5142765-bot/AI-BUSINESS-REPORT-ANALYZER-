// src/services/paymentService.js

// TEMP implementation so the frontend can compile.
// Replace this with your real Razorpay / payment logic later.

export async function verifyExistingOrPayment({ onSuccess, onError } = {}) {
  try {
    // Simulate a network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = {
      status: "ok",
      message:
        "Temporary payment check: assuming user is paid / allowed. Replace paymentService.js with real implementation.",
    };

    if (typeof onSuccess === "function") {
      onSuccess(result);
    }

    return result;
  } catch (err) {
    if (typeof onError === "function") {
      onError(err);
    }
    throw err;
  }
}