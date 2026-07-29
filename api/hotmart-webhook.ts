import { createClient } from '@supabase/supabase-js';

/**
 * Hotmart → Supabase purchase webhook.
 *
 * Configure this URL in Hotmart: Herramientas → Webhook (Postback) →
 * + Registrar Webhook → Evento: "Compra aprobada" (PURCHASE_APPROVED) →
 * URL: https://<tu-dominio-vercel>/api/hotmart-webhook
 *
 * Required environment variables (set in Vercel → Settings → Environment Variables):
 *   SUPABASE_URL                  - same as VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY     - Settings → API → service_role key (SECRET, never expose to the client)
 *   HOTMART_HOTTOK                - Webhook → pestaña "Autenticación" → Hottok de verificación
 *   HOTMART_PRODUCT_ID_ELITE      - ID numérico del producto Pack Elite en Hotmart
 *   HOTMART_PRODUCT_ID_VIP        - ID numérico del producto Pack Completo VIP en Hotmart
 */

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify the request really comes from Hotmart.
  const receivedHottok = req.headers['x-hotmart-hottok'];
  if (!process.env.HOTMART_HOTTOK || receivedHottok !== process.env.HOTMART_HOTTOK) {
    console.warn('Hotmart webhook: Hottok inválido o ausente.');
    return res.status(401).json({ error: 'Invalid hottok' });
  }

  const body = req.body;
  const event = body?.event;

  // We only care about approved purchases. Ignore everything else (refunds,
  // chargebacks, etc. are not handled here — access is granted, not revoked,
  // by this endpoint. See note at the bottom of this file.)
  if (event !== 'PURCHASE_APPROVED') {
    return res.status(200).json({ ignored: true, event });
  }

  const productId = String(body?.data?.product?.id ?? '');
  const buyerEmail = body?.data?.buyer?.email as string | undefined;
  const transactionId = body?.data?.purchase?.transaction as string | undefined;

  if (!buyerEmail) {
    return res.status(400).json({ error: 'Missing buyer email in payload' });
  }

  let productTier: 'elite' | 'vip' | null = null;
  if (productId === process.env.HOTMART_PRODUCT_ID_ELITE) productTier = 'elite';
  if (productId === process.env.HOTMART_PRODUCT_ID_VIP) productTier = 'vip';

  if (!productTier) {
    // Purchase of a different product (e.g. Pack PRO) — not an app-access product, ignore.
    return res.status(200).json({ ignored: true, reason: 'product not app-access tier', productId });
  }

  const { error } = await supabaseAdmin
    .from('allowed_buyers')
    .upsert(
      {
        email: buyerEmail.toLowerCase().trim(),
        product_tier: productTier,
        hotmart_transaction_id: transactionId ?? null,
        purchased_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

  if (error) {
    console.error('Error guardando comprador autorizado en Supabase:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  return res.status(200).json({ ok: true, email: buyerEmail, tier: productTier });
}

// NOTE — reembolsos/chargebacks: si quieres que el acceso se revoque
// automáticamente cuando Hotmart notifica un reembolso o chargeback,
// registra un segundo Webhook en Hotmart para esos eventos y agrega aquí
// una rama que elimine (o marque como inactiva) la fila correspondiente
// en `allowed_buyers`. Se dejó fuera de esta primera versión para no
// atrasar el lanzamiento.
