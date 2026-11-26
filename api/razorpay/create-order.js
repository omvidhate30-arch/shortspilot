export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, plan, email } = req.body;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({
        error: 'Razorpay API keys missing on server'
      });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100),
        currency: 'INR',
        receipt: `sp_${Date.now()}`,
        notes: { plan, email }
      })
    });

    const order = await response.json();

    if (!response.ok) {
      return res.status(400).json({
        error: order?.error?.description || 'Order creation failed'
      });
    }

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Server error'
    });
  }
}
