import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import { FixedCost, Debt, StrategyType } from '../types';

interface UseUserBudgetDefaults {
  fixedCosts: FixedCost[];
  debts: Debt[];
}

/**
 * Reemplaza useLocalStorageState para los datos financieros reales del
 * usuario (ingreso, costos fijos, deudas, porcentajes de la Válvula,
 * estrategia). Antes vivían solo en localStorage del navegador; ahora se
 * guardan en la tabla `user_budgets` de Supabase, amarrados a la cuenta.
 *
 * Preferencias de UI (modo oscuro, pestaña activa, moneda mostrada) se
 * quedan en localStorage a propósito — no son datos financieros que valga
 * la pena sincronizar entre dispositivos.
 *
 * El guardado hacia Supabase está debounced (600ms) para no disparar una
 * escritura por cada tick de un slider o cada tecla escrita.
 */
export function useUserBudget(defaults: UseUserBudgetDefaults) {
  const { user } = useAuth();

  const [income, setIncome] = useState(0);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(defaults.fixedCosts);
  const [debts, setDebts] = useState<Debt[]>(defaults.debts);
  const [debtPct, setDebtPct] = useState(40);
  const [savingsPct, setSavingsPct] = useState(30);
  const [personalPct, setPersonalPct] = useState(30);
  const [strategy, setStrategy] = useState<StrategyType>('avalanche');

  const [loading, setLoading] = useState(true);
  const loadedForUserRef = useRef<string | null>(null);

  // Carga inicial: trae la fila del usuario (si existe) desde Supabase.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from('user_budgets')
        .select('income, fixed_costs, debts, debt_pct, savings_pct, personal_pct, strategy')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Error cargando el presupuesto desde Supabase:', error);
      } else if (data) {
        setIncome(Number(data.income) || 0);
        setFixedCosts((data.fixed_costs as FixedCost[] | null) ?? defaults.fixedCosts);
        setDebts((data.debts as Debt[] | null) ?? defaults.debts);
        setDebtPct(data.debt_pct ?? 40);
        setSavingsPct(data.savings_pct ?? 30);
        setPersonalPct(data.personal_pct ?? 30);
        setStrategy((data.strategy as StrategyType) ?? 'avalanche');
      }
      // Si no hay fila (`data === null`), es un usuario nuevo: se queda en
      // los valores por defecto y la primera escritura debounced la crea.

      loadedForUserRef.current = user.id;
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Guardado debounced hacia Supabase cada vez que algo cambia, pero solo
  // después de que la carga inicial de ESTE usuario ya terminó — así nunca
  // sobreescribimos datos reales con los valores por defecto de arranque.
  useEffect(() => {
    if (!user || loadedForUserRef.current !== user.id) return;

    const handle = setTimeout(() => {
      supabase
        .from('user_budgets')
        .upsert(
          {
            user_id: user.id,
            income,
            fixed_costs: fixedCosts,
            debts,
            debt_pct: debtPct,
            savings_pct: savingsPct,
            personal_pct: personalPct,
            strategy,
          },
          { onConflict: 'user_id' }
        )
        .then(({ error }) => {
          if (error) console.error('Error guardando el presupuesto en Supabase:', error);
        });
    }, 600);

    return () => clearTimeout(handle);
  }, [user, income, fixedCosts, debts, debtPct, savingsPct, personalPct, strategy]);

  return {
    loading,
    income,
    setIncome,
    fixedCosts,
    setFixedCosts,
    debts,
    setDebts,
    debtPct,
    setDebtPct,
    savingsPct,
    setSavingsPct,
    personalPct,
    setPersonalPct,
    strategy,
    setStrategy,
  };
}
