// Arquivo: /api/criar-pix.js
// Na Vercel, tudo dentro da pasta /api vira automaticamente uma rota tipo /api/criar-pix

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  // ⚠️ Configure essa variável no painel da Vercel:
  // Project > Settings > Environment Variables > MERCADOPAGO_ACCESS_TOKEN = seu Access Token de produção
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ success: false, error: 'MERCADOPAGO_ACCESS_TOKEN não configurado na Vercel.' });
  }

  const { nome, email, telefone, cpf } = req.body || {};

  if (!nome || !email || !cpf) {
    return res.status(400).json({ success: false, error: 'Nome, e-mail e CPF são obrigatórios.' });
  }

  const cpfLimpo = String(cpf).replace(/\D/g, '');
  const [primeiroNome, ...resto] = nome.trim().split(' ');
  const sobrenome = resto.join(' ') || primeiroNome;

  const payload = {
    transaction_amount: 19.90,
    description: 'Protocolo Recomeço',
    payment_method_id: 'pix',
    payer: {
      email,
      first_name: primeiroNome,
      last_name: sobrenome,
      identification: { type: 'CPF', number: cpfLimpo }
    }
  };

  try {
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': `pix_${Date.now()}_${Math.random().toString(36).slice(2)}`
      },
      body: JSON.stringify(payload)
    });

    const data = await mpResponse.json();

    if (mpResponse.status === 201 || mpResponse.status === 200) {
      const txData = data.point_of_interaction?.transaction_data || {};
      return res.status(200).json({
        success: true,
        payment_id: data.id,
        status: data.status,
        qr_code: txData.qr_code || null,
        qr_code_base64: txData.qr_code_base64 || null
      });
    }

    return res.status(mpResponse.status).json({
      success: false,
      error: data.message || 'Erro ao gerar PIX',
      details: data
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro de conexão com o Mercado Pago.' });
  }
}
