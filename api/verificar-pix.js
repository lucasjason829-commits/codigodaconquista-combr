// Arquivo: /api/verificar-pix.js
// Rota final na Vercel: /api/verificar-pix?payment_id=XXXX

export default async function handler(req, res) {
  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ status: 'error', message: 'MP_ACCESS_TOKEN não configurado na Vercel.' });
  }

  const { payment_id } = req.query;

  if (!payment_id) {
    return res.status(400).json({ status: 'error', message: 'payment_id não informado' });
  }

  try {
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await mpResponse.json();
    return res.status(200).json({ status: data.status || 'unknown' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Erro de conexão com o Mercado Pago.' });
  }
}
