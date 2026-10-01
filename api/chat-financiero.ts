import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';

/**
 * Consejero Financiero — endpoint de chat con IA.
 *
 * Recibe un mensaje (texto y/o foto de un recibo) del usuario autenticado,
 * decide si es un gasto a registrar, un consejo a dar, u otra cosa, y
 * responde en español manteniendo la Válvula (Gastos Personales / Reserva
 * de Ahorros) siempre sincronizada con lo que el usuario realmente gastó.
 *
 * Variables de entorno requeridas (Vercel → Settings → Environment Variables):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (ya deberían existir por hotmart-webhook.ts)
 *   GEMINI_API_KEY
 *
 * NOTA: este archivo es intencionalmente autocontenido (no importa nada de
 * ../src/) porque Vercel despliega cada función de /api/ por separado bajo
 * ESM estricto, y una importación relativa a una carpeta fuera de /api/
 * falla en producción con ERR_MODULE_NOT_FOUND aunque funcione localmente.
 * EXPENSE_CATEGORIES y computeBudgetSnapshot están duplicados aquí a
 * propósito — son copia exacta de src/utils.ts. Si cambias la fórmula de la
 * Válvula ahí, cámbiala también aquí.
 */

const EXPENSE_CATEGORIES = [
  'Comida',
  'Mercado',
  'Transporte',
  'Entretenimiento',
  'Salud',
  'Hogar',
  'Reparaciones',
  'Otros',
] as const;

type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

interface BudgetSnapshotInput {
  income: number;
  fixedCosts: { value: number }[];
  debts: { minPayment: number }[];
  personalPct: number;
  savingsPct: number;
  personalSpentThisMonth: number;
}

interface BudgetSnapshot {
  surplus: number;
  personalTotal: number;
  savingsTotal: number;
  personalSpent: number;
  personalRemaining: number;
  overspend: number;
  savingsReal: number;
}

function computeBudgetSnapshot(input: BudgetSnapshotInput): BudgetSnapshot {
  const totalFixedCosts = input.fixedCosts.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
  const totalDebtPayments = input.debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
  const surplus = Math.max(0, input.income - totalFixedCosts - totalDebtPayments);

  const personalTotal = surplus * (input.personalPct / 100);
  const savingsTotal = surplus * (input.savingsPct / 100);
  const personalSpent = Math.max(0, input.personalSpentThisMonth);

  const overspend = Math.max(0, personalSpent - personalTotal);
  const personalRemaining = Math.max(0, personalTotal - personalSpent);
  const savingsReal = Math.max(0, savingsTotal - overspend);

  return { surplus, personalTotal, savingsTotal, personalSpent, personalRemaining, overspend, savingsReal };
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-3.5-flash'];

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: ['log_expense', 'advice', 'other'],
      description: 'log_expense si el usuario está contando un gasto real (texto o foto de recibo) que se debe registrar; advice si pregunta si debería comprar algo o pide consejo; other para saludos u otra cosa.',
    },
    amount: {
      type: Type.NUMBER,
      description: 'Monto del gasto detectado (en la moneda local del usuario, solo el número). 0 si no aplica.',
    },
    category: {
      type: Type.STRING,
      enum: [...EXPENSE_CATEGORIES],
      description: 'Categoría del gasto. Otros si no aplica o no es claro.',
    },
    description: {
      type: Type.STRING,
      description: 'Descripción corta del gasto (ej. "Almuerzo", "Mercado de la semana"). Vacío si no aplica.',
    },
    reply: {
      type: Type.STRING,
      description: 'La respuesta conversacional para el usuario, en español, cálida pero directa. Máximo 3-4 líneas para gastos del día a día; hasta 5-6 líneas si es una decisión grande de deuda/crédito que requiere explicar números.',
    },
  },
  required: ['intent', 'reply'],
};

interface AiResult {
  intent: 'log_expense' | 'advice' | 'other';
  amount?: number;
  category?: string;
  description?: string;
  reply: string;
}

function buildSystemInstruction(params: {
  currency: string;
  personalTotal: number;
  personalRemaining: number;
  savingsTotal: number;
  savingsReal: number;
  overspend: number;
  income: number;
  totalFixedCosts: number;
  totalDebtPayments: number;
  surplus: number;
  debtPct: number;
  strategy: string;
  monthlyExtraDebtPayoff: number;
  debtsList: string;
  isFirstMessage: boolean;
}): string {
  const {
    currency, personalTotal, personalRemaining, savingsTotal, savingsReal, overspend,
    income, totalFixedCosts, totalDebtPayments, surplus, debtPct, strategy, monthlyExtraDebtPayoff, debtsList,
    isFirstMessage,
  } = params;

  return `
Actúa como "El Consejero Financiero", un asesor financiero 24/7 dentro de la app "El Arquitecto Financiero". Hablas en español, de forma cercana, breve y directa. No eres un asesor financiero profesional certificado: tus consejos se basan únicamente en los números y metas que el propio usuario ya configuró en la app, y así debes darlos a entender cuando aconsejes algo importante (especialmente decisiones grandes de deuda).

IMPORTANTE sobre el tono — esto es una CONVERSACIÓN EN CURSO, no mensajes aislados. Tienes el historial completo abajo.
${isFirstMessage ? '- Este es el PRIMER mensaje del usuario en la conversación: puedes saludar normalmente ("¡Hola!").' : '- Esta conversación YA EMPEZÓ. NO saludes con "¡Hola!" ni repitas una introducción — responde directo, como si fueras la misma persona que lleva hablando con él todo el rato. Haz referencia natural a lo que ya se dijo cuando aplique, en vez de repetir desde cero todos los números cada vez.'}
- Varía tu forma de empezar las frases, no repitas siempre la misma estructura.

Estado real del usuario ESTE MES (ya calculado, es la fuente de verdad — no la recalcules, solo úsala para tu respuesta):

Panorama completo (La Base / El Escáner / La Válvula):
- Ingreso mensual neto: ${currency}${income.toFixed(0)}
- Gastos innegociables (sin deudas): ${currency}${totalFixedCosts.toFixed(0)}
- Pago mínimo total de deudas actuales: ${currency}${totalDebtPayments.toFixed(0)}
- Excedente mensual real (lo que sobra después de gastos innegociables y mínimos de deuda): ${currency}${surplus.toFixed(0)}
- Estrategia de pago de deuda activa: ${strategy === 'snowball' ? 'Bola de Nieve (paga primero el saldo más pequeño)' : strategy === 'balanced' ? 'Balanceada' : 'Avalancha (paga primero la tasa de interés más alta)'}
- Del excedente, ${debtPct}% (${currency}${monthlyExtraDebtPayoff.toFixed(0)}/mes) se destina a pago EXTRA de deudas (acelerador)
- Deudas actuales registradas en El Escáner:
${debtsList || '  (el usuario no tiene deudas registradas actualmente)'}

Específico de este mes (Válvula):
- Presupuesto de Gastos Personales del mes: ${currency}${personalTotal.toFixed(0)}
- Ya disponible (sin gastar) de Gastos Personales: ${currency}${personalRemaining.toFixed(0)}
- Reserva de Ahorros planeada del mes: ${currency}${savingsTotal.toFixed(0)}
- Reserva de Ahorros real (después de cualquier sobregasto ya ocurrido): ${currency}${savingsReal.toFixed(0)}
- Sobregasto acumulado ya ocurrido este mes: ${currency}${overspend.toFixed(0)}

Reglas:
1. Si el usuario está contando o mostrando un gasto real ya hecho (texto o foto) — algo del día a día tipo comida, transporte, compras — intent = "log_expense", extrae "amount" (solo número, sin símbolos), "category" (elige la más parecida de la lista permitida) y "description" corta. Esto es SOLO para gastos personales del día a día, nunca para una deuda o crédito nuevo (esos no se registran automáticamente, solo se aconsejan).
2. Si el gasto que está contando, sumado a lo que ya gastó, SUPERA lo disponible de Gastos Personales, tu "reply" debe advertirle claramente que se excedió y que el exceso se está descontando de su Reserva de Ahorros — pero sin ser alarmista, en tono de aliado.
3. Si el usuario pregunta si debería hacer una compra puntual (aún no la hizo) con su dinero del día a día, intent = "advice": dile con los números reales si le alcanza o no de su Gastos Personales, y qué pasaría con su Reserva de Ahorros si la hace.
4. Si el usuario pregunta por una decisión financiera grande — un crédito, préstamo, deuda nueva (carro, casa, tarjeta, etc.) — intent = "advice" también, pero en este caso usa el PANORAMA COMPLETO (ingreso, excedente, deudas actuales y su interés, estrategia de pago) para darle un consejo calculado: explícale cómo esa nueva cuota afectaría su excedente mensual, si le conviene más pagar primero sus deudas actuales (sobre todo si tienen interés más alto que la nueva), y qué le quedaría disponible después. Puedes usar hasta 5-6 líneas para este tipo de respuesta si hace falta explicarlo bien. No registres nada en El Escáner ni en gastos — solo da el consejo en texto.
5. Si es un saludo, duda general, o algo no financiero, intent = "other" y responde brevemente y con calidez, recordándole en qué le puedes ayudar.
6. Nunca inventes montos: si no hay un monto claro en el texto o la imagen para un gasto del día a día, no pongas intent "log_expense".
7. Si el mensaje trae una FOTO de un recibo/factura, léela y extrae el monto TOTAL pagado y la categoría del gasto.
`.trim();
}

async function callGemini(
  systemInstruction: string,
  history: { role: 'user' | 'model'; parts: any[] }[],
  currentMessage: string,
  image?: { base64: string; mimeType: string }
): Promise<AiResult> {
  const currentParts: any[] = [{ text: currentMessage || '(sin texto, solo la foto adjunta)' }];
  if (image) {
    currentParts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });
  }

  const contents = [...history, { role: 'user' as const, parts: currentParts }];

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    let attempts = 3;
    let delayMs = 1000;

    while (attempts > 0) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA as any,
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          return {
            intent: parsed.intent === 'log_expense' || parsed.intent === 'advice' ? parsed.intent : 'other',
            amount: Number(parsed.amount) || 0,
            category: parsed.category,
            description: parsed.description,
            reply: parsed.reply || 'Listo, ¿en qué más te ayudo?',
          };
        }
      } catch (err: any) {
        lastError = err;
        const isRetriable =
          err?.status === 503 || err?.status === 429 || String(err).includes('503') || String(err).includes('limit') || String(err).includes('demand');
        if (isRetriable && attempts > 1) {
          attempts--;
          await new Promise((r) => setTimeout(r, delayMs));
          delayMs *= 2;
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('No se pudo obtener respuesta de los modelos de IA.');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no está configurada en el servidor.' });
  }

  // 1. Autenticar al usuario a partir del token de sesión de Supabase.
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : null;
  if (!token) {
    return res.status(401).json({ error: 'Falta el token de sesión.' });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
  const userId = userData.user.id;

  const body = req.body || {};
  const message: string = typeof body.message === 'string' ? body.message : '';
  const imageBase64: string | undefined = typeof body.imageBase64 === 'string' ? body.imageBase64 : undefined;
  const imageMimeType: string | undefined = typeof body.imageMimeType === 'string' ? body.imageMimeType : undefined;

  if (!message.trim() && !imageBase64) {
    return res.status(400).json({ error: 'Mensaje vacío.' });
  }

  try {
    // 2. Cargar el presupuesto real del usuario y lo que ya gastó este mes.
    const { data: budgetRow, error: budgetError } = await supabaseAdmin
      .from('user_budgets')
      .select('income, fixed_costs, debts, personal_pct, savings_pct, debt_pct, strategy')
      .eq('user_id', userId)
      .maybeSingle();

    if (budgetError) {
      console.error('Error leyendo user_budgets:', budgetError);
      return res.status(500).json({ error: 'Error leyendo tu presupuesto.' });
    }
    if (!budgetRow) {
      return res.status(400).json({ error: 'Primero completa La Base, El Escáner y La Válvula antes de usar el Consejero.' });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthExpenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (expensesError) {
      console.error('Error leyendo expenses:', expensesError);
      return res.status(500).json({ error: 'Error leyendo tus gastos de este mes.' });
    }

    const spentBefore = (monthExpenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 2b. Cargar las últimas vueltas de la conversación para que la IA tenga
    // memoria real y no repita saludos/contexto en cada respuesta.
    const { data: recentHistory, error: historyError } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12);

    if (historyError) {
      console.error('Error leyendo historial del chat:', historyError);
    }

    const history = ((recentHistory || []) as { role: string; content: string }[])
      .reverse()
      .map((m) => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        parts: [{ text: m.content || '' }],
      }));

    const income = Number(budgetRow.income) || 0;
    const fixedCosts = (budgetRow.fixed_costs as { name?: string; value: number }[]) || [];
    const debts = (budgetRow.debts as { name?: string; balance: number; interestRate: number; minPayment: number }[]) || [];
    const debtPct = budgetRow.debt_pct ?? 40;
    const strategy = (budgetRow.strategy as string) || 'avalanche';

    const snapshotBefore = computeBudgetSnapshot({
      income,
      fixedCosts,
      debts,
      personalPct: budgetRow.personal_pct ?? 30,
      savingsPct: budgetRow.savings_pct ?? 30,
      personalSpentThisMonth: spentBefore,
    });

    const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
    const totalDebtPayments = debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
    const monthlyExtraDebtPayoff = snapshotBefore.surplus * (debtPct / 100);
    const debtsList = debts
      .map((d) => `  - ${d.name || 'Deuda'}: saldo $${(Number(d.balance) || 0).toFixed(0)}, interés anual ${Number(d.interestRate) || 0}%, pago mínimo $${(Number(d.minPayment) || 0).toFixed(0)}/mes`)
      .join('\n');

    // 3. Preguntarle a Gemini qué es esto: ¿un gasto a registrar, un consejo, u otra cosa?
    const systemInstruction = buildSystemInstruction({
      currency: '',
      personalTotal: snapshotBefore.personalTotal,
      personalRemaining: snapshotBefore.personalRemaining,
      savingsTotal: snapshotBefore.savingsTotal,
      savingsReal: snapshotBefore.savingsReal,
      overspend: snapshotBefore.overspend,
      income,
      totalFixedCosts,
      totalDebtPayments,
      surplus: snapshotBefore.surplus,
      debtPct,
      strategy,
      monthlyExtraDebtPayoff,
      debtsList,
      isFirstMessage: history.length === 0,
    });

    const ai_result = await callGemini(
      systemInstruction,
      history,
      message,
      imageBase64 && imageMimeType ? { base64: imageBase64, mimeType: imageMimeType } : undefined
    );

    // 4. Si es un gasto real con monto válido, registrarlo y recalcular la Válvula.
    let kind: 'text' | 'expense_card' | 'warning' = 'text';
    let card: { category: string; amount: string; note: string } | undefined;
    let snapshotAfter = snapshotBefore;
    let expenseId: string | null = null;

    const isConfidentExpense = ai_result.intent === 'log_expense' && (ai_result.amount || 0) > 0;

    if (isConfidentExpense) {
      const category: ExpenseCategory = (EXPENSE_CATEGORIES as readonly string[]).includes(ai_result.category || '')
        ? (ai_result.category as ExpenseCategory)
        : 'Otros';

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('expenses')
        .insert({
          user_id: userId,
          amount: ai_result.amount,
          currency: null,
          category,
          description: ai_result.description || null,
          source: 'chat',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error guardando el gasto:', insertError);
      } else {
        expenseId = inserted?.id ?? null;
      }

      snapshotAfter = computeBudgetSnapshot({
        income,
        fixedCosts,
        debts,
        personalPct: budgetRow.personal_pct ?? 30,
        savingsPct: budgetRow.savings_pct ?? 30,
        personalSpentThisMonth: spentBefore + (ai_result.amount || 0),
      });

      kind = snapshotAfter.overspend > 0 ? 'warning' : 'expense_card';
      card = {
        category,
        amount: String(ai_result.amount),
        note: ai_result.description || category,
      };
    } else if (snapshotBefore.overspend > 0 && ai_result.intent === 'advice') {
      // Ya venía con sobregasto y está pidiendo consejo: mantener el tono de alerta.
      kind = 'warning';
    }

    // 5. Persistir ambos turnos del chat (para que el historial sobreviva recargas/dispositivos).
    const nowIso = new Date().toISOString();
    await supabaseAdmin.from('chat_messages').insert([
      {
        user_id: userId,
        role: 'user',
        content: message || (imageBase64 ? '[Foto de recibo]' : ''),
        kind: 'text',
        meta: null,
        expense_id: null,
        created_at: nowIso,
      },
      {
        user_id: userId,
        role: 'assistant',
        content: ai_result.reply,
        kind,
        meta: card ? { card } : null,
        expense_id: expenseId,
        created_at: nowIso,
      },
    ]);

    return res.status(200).json({
      reply: ai_result.reply,
      kind,
      card,
      snapshot: snapshotAfter,
    });
  } catch (err: any) {
    console.error('Error en el Consejero Financiero:', err);
    return res.status(500).json({ error: 'No se pudo procesar tu mensaje. Intenta de nuevo en unos segundos.' });
  }
}
