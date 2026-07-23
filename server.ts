import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client on the server
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route for Gemini financial tips
  app.post("/api/gemini/tips", async (req, res) => {
    try {
      const { financeData } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "API Key is not configured. Please add GEMINI_API_KEY to your secrets." 
        });
      }

      if (!financeData) {
        return res.status(400).json({ error: "No financial data provided." });
      }

      // Generate prompt for the model
      const prompt = `
        Actúa como un asesor financiero experto e inteligente. El usuario está usando "El Arquitecto", una herramienta para estructurar sus finanzas, pagar deudas y construir riqueza.
        Proporciona un consejo financiero personalizado, corto (máximo 4 líneas o 120 palabras), accionable y alentador en base a sus datos financieros actuales.

        Datos financieros del usuario:
        - Ingreso Mensual: $${financeData.income}
        - Gastos Innegociables: $${financeData.fixedCosts}
        - Cuota Mínima de Deudas: $${financeData.totalMinPayment}
        - Excedente Real (Sobrante): $${financeData.surplus}
        - Estrategia de Deudas Activa: ${financeData.strategy || "Bola de Nieve"}
        - Distribución del Excedente:
          * Pago Ocasional (Extra) de Deudas: ${financeData.debtPct}% ($${financeData.monthlyExtraDebtPayoff}/mes)
          * Reserva de Ahorro: ${financeData.savingsPct}% ($${financeData.monthlySavingsBuild}/mes)
          * Gastos Personales: ${financeData.personalPct}% ($${financeData.monthlyPersonalSpend}/mes)

        Detalle de Deudas:
        ${JSON.stringify(financeData.debts)}

        Directrices:
        1. Sé directo, empático y profesional.
        2. Analiza si tiene deudas y si su distribución de excedente es óptima. Por ejemplo:
           - Si tiene deudas y su "Reserva de Ahorro" o "Gastos Personales" es muy alta y "Pago Ocasional de Deudas" es bajo, sugiérele priorizar liquidar deudas primero para ahorrar intereses.
           - Si no tiene deudas, felicítalo y sugiérele cómo optimizar su "Reserva de Ahorro" (p. ej., fondos de alta rentabilidad o CDTs) o disfrutar responsablemente de sus "Gastos Personales".
           - Si el Excedente es negativo o cero, aconséjale sobre cómo recortar Gastos Innegociables o buscar ingresos extra.
        3. Mantén el tono amigable, motivador y directo. Usa formato Markdown simple (negritas, viñetas cortas si es necesario).
        4. Idioma: Español.
      `;

      // Try multiple models in order of recommended stability
      const candidateModels = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.5-flash"];
      let responseText = "";
      let lastError: any = null;

      for (const modelName of candidateModels) {
        let attempts = 3;
        let delayMs = 1000;

        while (attempts > 0) {
          try {
            console.log(`Attempting generation with model ${modelName} (${attempts} attempts remaining)...`);
            const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
            });

            if (response && response.text) {
              responseText = response.text;
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`Error using model ${modelName}:`, err.message || err);
            
            // If it's a 503 / 429 or other retriable code, wait and retry
            const isRetriable = err.status === 503 || err.status === 429 || String(err).includes("503") || String(err).includes("limit") || String(err).includes("demand");
            if (isRetriable && attempts > 1) {
              attempts--;
              console.log(`Waiting ${delayMs}ms before retrying ${modelName}...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
              delayMs *= 2; // exponential backoff
            } else {
              break; // go to next model
            }
          }
        }

        if (responseText) {
          break; // successfully generated, stop trying other models
        }
      }

      if (!responseText) {
        throw lastError || new Error("No se pudo obtener una respuesta de los modelos de IA.");
      }

      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Error final generating financial tips:", error);
      res.status(500).json({ error: error.message || "Error al generar consejos financieros." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
