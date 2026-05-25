import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const EXISTING_QR_CODE_ID = process.env.RAZORPAY_QR_CODE_ID;

app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post('/api/payments/verify-qr', async (req, res) => {
  try {
    if (!EXISTING_QR_CODE_ID) {
      return res.status(500).json({
        success: false,
        message: 'QR code ID is missing in server configuration.',
      });
    }

    const paymentsResponse = await razorpay.qrCode.fetchPayments(EXISTING_QR_CODE_ID);
    const payments = paymentsResponse?.items || paymentsResponse || [];

    const paidPayment = payments.find((payment) => {
      const amountMatches = Number(payment.amount) === 4900;
      const statusMatches =
        payment.status === 'captured' || payment.status === 'authorized';
      return amountMatches && statusMatches;
    });

    if (!paidPayment) {
      return res.status(200).json({
        success: false,
        message: 'Payment not received yet for this QR.',
      });
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully.',
      paymentId: paidPayment.id,
      amount: paidPayment.amount,
      status: paidPayment.status,
    });
  } catch (error) {
    console.error('Verify existing QR payment error:', error?.error || error);
    return res.status(500).json({
      success: false,
      message: 'QR payment verification failed.',
    });
  }
});

app.get('/api/payments/qr-details', async (req, res) => {
  try {
    if (!EXISTING_QR_CODE_ID) {
      return res.status(500).json({
        success: false,
        message: 'QR code ID is missing in server configuration.',
      });
    }

    const qrCode = await razorpay.qrCode.fetch(EXISTING_QR_CODE_ID);

    return res.json({
      success: true,
      qrCodeId: qrCode.id,
      imageUrl: qrCode.image_url || '',
      status: qrCode.status,
      paymentAmount: qrCode.payment_amount,
      usage: qrCode.usage,
    });
  } catch (error) {
    console.error('Fetch QR details error:', error?.error || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch QR details.',
    });
  }
});

app.get('/', (req, res) => {
  res.send('Existing QR payment backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});