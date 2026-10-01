import { useEffect, useRef, useState, type ChangeEvent, type ComponentType } from 'react';
import {
  Sparkles,
  Send,
  Paperclip,
  Loader2,
  AlertTriangle,
  Utensils,
  ShoppingCart,
  Car,
  PartyPopper,
  HeartPulse,
  Home as HomeIcon,
  Wrench,
  CircleDollarSign,
  Undo2,
  Eraser,
} from 'lucide-react';
import { Debt, FixedCost } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { computeBudgetSnapshot, formatCurrencyNumber, BudgetSnapshot } from '../utils';

interface ChatTabProps {
  isDarkMode: boolean;
  currency: string;
  currencyCode: string;
  income: number;
  fixedCosts: FixedCost[];
  debts: Debt[];
  personalPct: number;
  savingsPct: number;
}

interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  kind: 'text' | 'expense_card' | 'warning';
  text?: string;
  imageDataUrl?: string;
  card?: { category: string; amount: string; note: string };
}

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Comida: Utensils,
  Mercado: ShoppingCart,
  Transporte: Car,
  Entretenimiento: PartyPopper,
  Salud: HeartPulse,
  Hogar: HomeIcon,
  Reparaciones: Wrench,
  Otros: CircleDollarSign,
};

function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category] || CircleDollarSign;
  return <Icon className={className} />;
}

/** Redimensiona y comprime una imagen en el navegador antes de enviarla al
 * chat, para no mandar fotos de 4-5MB directas de la cámara del celular. */
function resizeImageFile(file: File, maxDim = 1280, quality = 0.82): Promise<{ dataUrl: string; base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height / width) * maxDim);
            width = maxDim;
          } else {
            width = Math.round((width / height) * maxDim);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1] || '';
        resolve({ dataUrl, base64, mimeType: 'image/jpeg' });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ChatTab({
  isDarkMode,
  currency,
  currencyCode,
  income,
  fixedCosts,
  debts,
  personalPct,
  savingsPct,
}: ChatTabProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<BudgetSnapshot | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carga el historial de la conversación y el gasto acumulado de este mes.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setHistoryLoading(true);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [historyRes, expensesRes] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('id, role, content, kind, meta, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(100),
        supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString()),
      ]);

      if (cancelled) return;

      if (historyRes.error) {
        console.error('Error cargando historial del chat:', historyRes.error);
      } else if (historyRes.data) {
        setMessages(
          historyRes.data.map((row) => ({
            id: row.id,
            role: row.role as 'user' | 'assistant',
            kind: (row.kind as ChatMessageUI['kind']) || 'text',
            text: row.content,
            card: (row.meta as any)?.card,
          }))
        );
      }

      const spentThisMonth = expensesRes.error
        ? 0
        : (expensesRes.data || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      if (expensesRes.error) {
        console.error('Error calculando gastos del mes:', expensesRes.error);
      }

      setSnapshot(
        computeBudgetSnapshot({
          income,
          fixedCosts,
          debts,
          personalPct,
          savingsPct,
          personalSpentThisMonth: spentThisMonth,
        })
      );

      setHistoryLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // Recalcular el snapshot inicial si cambian los datos de la Válvula,
    // pero el historial de mensajes solo se recarga una vez por usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function sendToServer(payload: { message: string; imageBase64?: string; imageMimeType?: string }) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('Sesión no disponible');

    const res = await fetch('/api/chat-financiero', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || `Error del servidor (${res.status})`);
    }

    return res.json();
  }

  async function handleSend(text: string, imagePayload?: { base64: string; mimeType: string; previewDataUrl: string }) {
    if (sending) return;
    if (!text.trim() && !imagePayload) return;

    setErrorMsg(null);

    const userMsg: ChatMessageUI = {
      id: `local-${Date.now()}`,
      role: 'user',
      kind: 'text',
      text: text.trim() || undefined,
      imageDataUrl: imagePayload?.previewDataUrl,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const data = await sendToServer({
        message: text.trim(),
        imageBase64: imagePayload?.base64,
        imageMimeType: imagePayload?.mimeType,
      });

      const assistantMsg: ChatMessageUI = {
        id: `local-${Date.now()}-ai`,
        role: 'assistant',
        kind: data.kind || 'text',
        text: data.reply,
        card: data.card,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (data.snapshot) setSnapshot(data.snapshot);
    } catch (err: any) {
      console.error('Error hablando con el Consejero Financiero:', err);
      setErrorMsg('No pude procesar tu mensaje. Intenta de nuevo en unos segundos.');
    } finally {
      setSending(false);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const { dataUrl, base64, mimeType } = await resizeImageFile(file);
      await handleSend('', { base64, mimeType, previewDataUrl: dataUrl });
    } catch (err) {
      console.error('Error procesando la foto del recibo:', err);
      setErrorMsg('No pude leer esa imagen. Intenta con otra foto.');
    }
  }

  /** "Limpia" la vista del chat SOLO en la pantalla actual: no borra nada
   * en Supabase (ni los gastos ni los mensajes guardados). Si recargas la
   * página, el historial completo vuelve a aparecer, porque esta función
   * nunca toca la base de datos — solo vacía el estado local de React. */
  function handleClearChat() {
    if (sending || undoing) return;
    const confirmado = window.confirm(
      'Esto solo limpia lo que ves en la pantalla. Tus gastos y tu historial real no se borran, y volverán a aparecer si recargas la página. ¿Quieres limpiar la vista ahora?'
    );
    if (!confirmado) return;
    setErrorMsg(null);
    setMessages([]);
  }

  /** Borra el gasto más reciente de este mes (por si te equivocaste al
   * contárselo al Consejero). No reinicia el mes completo — eso ya pasa
   * solo cuando cambia el calendario. */
  async function handleUndoLastExpense() {
    if (undoing || sending) return;
    setErrorMsg(null);
    setUndoing(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Sesión no disponible');

      const res = await fetch('/api/undo-last-expense', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(body?.error || 'No pude deshacer el último gasto.');
        return;
      }

      if (body.snapshot) setSnapshot(body.snapshot);
      if (body.note) {
        setMessages((prev) => [
          ...prev,
          { id: `local-${Date.now()}-undo`, role: 'assistant', kind: 'text', text: body.note },
        ]);
      }
    } catch (err: any) {
      console.error('Error deshaciendo el último gasto:', err);
      setErrorMsg('No pude deshacer el último gasto. Intenta de nuevo.');
    } finally {
      setUndoing(false);
    }
  }

  const personalPct100 = snapshot && snapshot.personalTotal > 0
    ? Math.max(0, Math.min(100, Math.round((snapshot.personalRemaining / snapshot.personalTotal) * 100)))
    : 100;
  const savingsPct100 = snapshot && snapshot.savingsTotal > 0
    ? Math.max(0, Math.min(100, Math.round((snapshot.savingsReal / snapshot.savingsTotal) * 100)))
    : 100;

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-4" id="chat-tab-root">

      {/* Header */}
      <div className="flex flex-col gap-1.5" id="chat-tab-header-text">
        <h2 className={`text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 ${
          isDarkMode ? 'text-[#dee4de]' : 'text-[#171d19]'
        }`}>
          <Sparkles className={`w-5 h-5 ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
          Consejero Financiero
        </h2>
        <p className={`text-sm md:text-base ${isDarkMode ? 'text-[#bccac0]' : 'text-[#3d4a42]'}`}>
          Cuéntale lo que gastas o manda la foto de un recibo. Te avisa si te estás pasando del plan.{' '}
          <span className={isDarkMode ? 'text-[#87948b]' : 'text-gray-400'}>
            (Los gastos adicionales y los Gastos Personales disponibles se reinician automáticamente cada mes)
          </span>
        </p>
      </div>

      {/* Resumen real (disponible / ahorro real) */}
      <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
        isDarkMode ? 'bg-[#0f1511] border-[#3d4a42]/30' : 'bg-emerald-50/40 border-emerald-100'
      }`}>
        <div className="flex justify-end -mb-1">
          <button
            type="button"
            onClick={handleUndoLastExpense}
            disabled={undoing || sending || historyLoading}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-40 ${
              isDarkMode ? 'text-[#87948b] hover:text-[#dee4de] hover:bg-[#1b211d]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
            id="undo-last-expense-btn"
          >
            {undoing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
            Deshacer último gasto
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <span className={`text-xs font-semibold ${isDarkMode ? 'text-[#87948b]' : 'text-[#556] '}`}>Gastos Personales disponibles</span>
            <span className="text-sm font-extrabold font-display text-sky-500">
              {currency}{formatCurrencyNumber(snapshot?.personalRemaining ?? 0, currencyCode)}
              <span className={`font-semibold ${isDarkMode ? 'text-[#566158]' : 'text-gray-400'}`}> / {currency}{formatCurrencyNumber(snapshot?.personalTotal ?? 0, currencyCode)}</span>
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#1b211d]' : 'bg-sky-100'}`}>
            <div className="h-full rounded-full bg-sky-500 transition-all duration-500" style={{ width: `${personalPct100}%` }} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <span className={`text-xs font-semibold ${isDarkMode ? 'text-[#87948b]' : 'text-[#556]'}`}>Reserva de Ahorros (real)</span>
            <span className="text-sm font-extrabold font-display text-indigo-500">
              {currency}{formatCurrencyNumber(snapshot?.savingsReal ?? 0, currencyCode)}
              <span className={`font-semibold ${isDarkMode ? 'text-[#566158]' : 'text-gray-400'}`}> / {currency}{formatCurrencyNumber(snapshot?.savingsTotal ?? 0, currencyCode)}</span>
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#1b211d]' : 'bg-indigo-100'}`}>
            <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${savingsPct100}%` }} />
          </div>
        </div>
      </div>

      {/* Botón para limpiar la vista del chat (no borra nada guardado) */}
      <div className="flex justify-end -mb-2">
        <button
          type="button"
          onClick={handleClearChat}
          disabled={sending || undoing || historyLoading}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-40 ${
            isDarkMode ? 'text-[#87948b] hover:text-[#dee4de] hover:bg-[#1b211d]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
          id="clear-chat-view-btn"
        >
          <Eraser className="w-3.5 h-3.5" />
          Limpiar chat
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className={`rounded-2xl border ambient-shadow flex flex-col gap-3 p-4 md:p-5 max-h-[55vh] overflow-y-auto ${
          isDarkMode ? 'bg-[#0a0f0c] border-[#3d4a42]/30' : 'bg-white border-gray-100'
        }`}
      >
        {historyLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className={`w-6 h-6 animate-spin ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex gap-2 items-start">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#111a14] border border-[#3d4a42]/40' : 'bg-emerald-50 border border-emerald-100'}`}>
                  <Sparkles className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
                </div>
                <div className={`rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%] text-sm ${
                  isDarkMode ? 'bg-[#111a14] border border-[#1f2620] text-[#dee4de]' : 'bg-gray-50 border border-gray-100 text-[#171d19]'
                }`}>
                  Hola. Este mes tienes {currency}{formatCurrencyNumber(snapshot?.personalTotal ?? 0, currencyCode)} disponibles en Gastos Personales
                  {' '}y {currency}{formatCurrencyNumber(snapshot?.savingsTotal ?? 0, currencyCode)} en tu Reserva de Ahorros. Cuéntame qué gastaste, o pregúntame antes de una compra.
                </div>
              </div>
            )}

            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    {msg.imageDataUrl ? (
                      <div className={`rounded-2xl rounded-tr-sm p-2 max-w-[75%] ${isDarkMode ? 'bg-[#1b211d] border border-dashed border-[#3d4a42]' : 'bg-gray-100 border border-dashed border-gray-300'}`}>
                        <img src={msg.imageDataUrl} alt="Recibo enviado" className="rounded-xl max-h-56 object-cover" />
                        {msg.text && <p className={`text-xs mt-1.5 px-1 ${isDarkMode ? 'text-[#bccac0]' : 'text-[#3d4a42]'}`}>{msg.text}</p>}
                      </div>
                    ) : (
                      <div className={`rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%] text-sm font-medium ${
                        isDarkMode ? 'bg-[#25a475] text-[#00311f]' : 'bg-[#006948] text-white'
                      }`}>
                        {msg.text}
                      </div>
                    )}
                  </div>
                );
              }

              if (msg.kind === 'expense_card' && msg.card) {
                return (
                  <div key={msg.id} className="flex gap-2 items-start">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#111a14] border border-[#3d4a42]/40' : 'bg-emerald-50 border border-emerald-100'}`}>
                      <Sparkles className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
                    </div>
                    <div className={`rounded-2xl rounded-tl-sm p-3.5 max-w-[80%] flex flex-col gap-2 ${
                      isDarkMode ? 'bg-[#0f1511] border border-[#23392e]' : 'bg-sky-50/60 border border-sky-100'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-sky-500/10' : 'bg-sky-100'}`}>
                          <CategoryIcon category={msg.card.category} className="w-4 h-4 text-sky-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${isDarkMode ? 'text-[#dee4de]' : 'text-[#171d19]'}`}>{msg.card.category}</span>
                          <span className="text-base font-extrabold font-display text-sky-500">{msg.card.amount}</span>
                        </div>
                      </div>
                      <p className={`text-xs pt-2 border-t ${isDarkMode ? 'text-[#87948b] border-[#1f2620]' : 'text-gray-500 border-gray-100'}`}>{msg.card.note}</p>
                    </div>
                  </div>
                );
              }

              if (msg.kind === 'warning') {
                return (
                  <div key={msg.id} className="flex gap-2 items-start">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-500/10 border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className={`rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%] text-sm ${
                      isDarkMode ? 'bg-[#14120c] border border-[#3d321b] text-[#e8dcc4]' : 'bg-amber-50 border border-amber-200 text-amber-900'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex gap-2 items-start">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#111a14] border border-[#3d4a42]/40' : 'bg-emerald-50 border border-emerald-100'}`}>
                    <Sparkles className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
                  </div>
                  <div className={`rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%] text-sm ${
                    isDarkMode ? 'bg-[#111a14] border border-[#1f2620] text-[#dee4de]' : 'bg-gray-50 border border-gray-100 text-[#171d19]'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex gap-2 items-start">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#111a14] border border-[#3d4a42]/40' : 'bg-emerald-50 border border-emerald-100'}`}>
                  <Sparkles className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
                </div>
                <div className={`rounded-2xl rounded-tl-sm px-4 py-2.5 ${isDarkMode ? 'bg-[#111a14] border border-[#1f2620]' : 'bg-gray-50 border border-gray-100'}`}>
                  <Loader2 className={`w-4 h-4 animate-spin ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500 font-medium -mt-2">{errorMsg}</p>
      )}

      {/* Input bar */}
      <div className={`flex items-center gap-2 p-2 rounded-2xl border ${
        isDarkMode ? 'bg-[#0a0f0c] border-[#3d4a42]/30' : 'bg-white border-gray-100'
      }`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(input);
            }
          }}
          disabled={sending || historyLoading}
          placeholder="Escribe o adjunta una foto del recibo..."
          className={`flex-grow bg-transparent outline-none text-sm px-3 py-2.5 ${
            isDarkMode ? 'text-[#dee4de] placeholder:text-[#566158]' : 'text-[#171d19] placeholder:text-gray-400'
          }`}
        />
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || historyLoading}
          aria-label="Adjuntar foto del recibo"
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            isDarkMode ? 'bg-[#111a14] border border-[#1f2620] text-[#87948b] hover:text-[#dee4de]' : 'bg-gray-50 border border-gray-100 text-gray-400 hover:text-gray-700'
          }`}
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleSend(input)}
          disabled={sending || historyLoading || !input.trim()}
          aria-label="Enviar"
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 ${
            isDarkMode ? 'bg-[#25a475] text-[#00311f]' : 'bg-[#006948] text-white'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
