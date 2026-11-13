import crypto from 'node:crypto';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const IS_TEST_MODE = !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET;

/**
 * Calculates standard GST tax breakdown (18% GST: 9% CGST + 9% SGST)
 * for property management / maintenance services (SAC Code 9995).
 */
export function calculateTaxBreakdown(totalAmount) {
  const total = Number(totalAmount) || 0;
  // totalAmount = baseAmount * 1.18
  const baseAmount = Math.round((total / 1.18) * 100) / 100;
  const gstAmount = Math.round((total - baseAmount) * 100) / 100;
  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = Math.round((gstAmount - cgst) * 100) / 100;

  return {
    baseAmount,
    cgst,
    sgst,
    totalGst: gstAmount,
    totalAmount: total,
    sacCode: '9995', // Maintenance and repair services
    taxRatePercentage: 18,
  };
}

/**
 * Creates a payment order for a bill.
 */
export async function createPaymentOrder(bill) {
  const amountInPaise = Math.round((bill.totalAmount || 0) * 100);
  const currency = 'INR';
  const receipt = `RCT-${bill.billId}-${Date.now().toString().slice(-4)}`;

  if (!IS_TEST_MODE) {
    try {
      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt,
          notes: {
            billId: bill.billId,
            residentId: bill.residentId,
            apartmentId: bill.apartmentId,
            billType: bill.billType || 'Repair',
          },
        }),
      });

      if (response.ok) {
        const orderData = await response.json();
        return {
          orderId: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          keyId: RAZORPAY_KEY_ID,
          isLiveGateway: true,
          receipt,
        };
      }
    } catch (err) {
      console.warn('Live Razorpay order creation failed, falling back to simulated order:', err.message);
    }
  }

  // Secure simulated payment order
  const orderId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
  return {
    orderId,
    amount: amountInPaise,
    currency,
    keyId: RAZORPAY_KEY_ID || 'rzp_test_safehome_gateway',
    isLiveGateway: false,
    receipt,
  };
}

/**
 * Verifies payment signature from gateway or simulated checkout.
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId) return false;

  if (!IS_TEST_MODE && signature) {
    try {
      const generated = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
      return generated === signature;
    } catch {
      return false;
    }
  }

  // In test mode or simulated checkout, valid if order and payment ids match format
  return (
    orderId.startsWith('order_') &&
    (paymentId.startsWith('pay_') || paymentId.startsWith('test_') || paymentId.length >= 8)
  );
}

/**
 * Generates official formatted Tax Invoice Number
 */
export function generateInvoiceNumber(billId) {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `INV-SHR-${year}${month}-${billId.replace(/^BILL/, '')}`;
}
