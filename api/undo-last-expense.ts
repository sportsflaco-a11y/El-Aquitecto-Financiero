import { createClient } from '@supabase/supabase-js';

/**
 * Deshacer último gasto — endpoint del Consejero Financiero.
 *
 * Borra el gasto más reciente de ESTE MES que el usuario autenticado
 * registró por el chat (o manualmente), y deja una nota en el historial del
 * chat explicando qué se deshizo. Pensado como corrección puntual ("me
 * equivoqué al contarle un gasto") — no reinicia el mes completo, porque eso
 * ya pasa solo (La Válvula filtra gastos desde el día 1 del mes actual).
 *
 * Variables de entorno requeridas (las mismas que chat-financiero.ts):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * NOTA: igual que chat-financiero.ts, este archivo es autocontenido (no
 * importa nada de ../src/) porque una importación relativa fuera de /api/
 * falla en producción con ERR_MODULE_NOT_FOUND bajo el ESM estricto de
 * Vercel, aunque funcione localmente. computeBudgetSnapshot está duplicado
 * aquí a propósito — es copia exacta de src/utils.ts.
 */

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 2. Buscar el gasto más reciente de ESTE MES para este usuario.
    const { data: lastExpense, error: findError } = await supabaseAdmin
      .from('expenses')
      .select('id, amount, category, description')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Error buscando el último gasto:', findError);
      return res.status(500).json({ error: 'No pude revisar tus gastos recientes.' });
    }
    if (!lastExpense) {
      return res.status(404).json({ error: 'No hay gastos registrados este mes para deshacer.' });
    }

    // 3. Borrarlo.
    const { error: deleteError } = await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('id', lastExpense.id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error borrando el último gasto:', deleteError);
      return res.status(500).json({ error: 'No pude deshacer ese gasto.' });
    }

    // 4. Recalcular el presupuesto real del usuario sin ese gasto.
    const { data: budgetRow, error: budgetError } = await supabaseAdmin
      .from('user_budgets')
      .select('income, fixed_costs, debts, personal_pct, savings_pct')
      .eq('user_id', userId)
      .maybeSingle();

    if (budgetError || !budgetRow) {
      console.error('Error leyendo user_budgets tras deshacer:', budgetError);
      return res.status(500).json({ error: 'El gasto se borró, pero no pude recalcular tu Válvula.' });
    }

    const { data: monthExpenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (expensesError) {
      console.error('Error recalculando gastos del mes tras deshacer:', expensesError);
      return res.status(500).json({ error: 'El gasto se borró, pero no pude recalcular tu Válvula.' });
    }

    const spentNow = (monthExpenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const snapshot = computeBudgetSnapshot({
      income: Number(budgetRow.income) || 0,
      fixedCosts: (budgetRow.fixed_costs as { value: number }[]) || [],
      debts: (budgetRow.debts as { minPayment: number }[]) || [],
      personalPct: budgetRow.personal_pct ?? 30,
      savingsPct: budgetRow.savings_pct ?? 30,
      personalSpentThisMonth: spentNow,
    });

    // 5. Dejar una nota en el historial del chat explicando qué se deshizo.
    const amount = Number(lastExpense.amount) || 0;
    const label = lastExpense.description || lastExpense.category || 'ese gasto';
    const noteText = `↩ Deshiciste el último gasto: $${amount.toFixed(0)} en ${lastExpense.category} (${label}). Ya no cuenta en tu Válvula de este mes.`;

    await supabaseAdmin.from('chat_messages').insert({
      user_id: userId,
      role: 'assistant',
      content: noteText,
      kind: 'text',
      meta: null,
      expense_id: null,
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({
      ok: true,
      undone: { category: lastExpense.category, amount, description: lastExpense.description },
      note: noteText,
      snapshot,
    });
  } catch (err: any) {
    console.error('Error en undo-last-expense:', err);
    return res.status(500).json({ error: 'No pude deshacer el último gasto. Intenta de nuevo.' });
  }
}
