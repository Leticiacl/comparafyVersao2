import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import fetch from "cross-fetch";
import * as cheerio from "cheerio";

/**
 * GET/POST /parseNfce?url=<URL_DA_NFCE>
 * Região mais próxima de MG: southamerica-east1 (SP)
 */
export const parseNfce = onRequest(
  { region: "southamerica-east1", cors: true, timeoutSeconds: 60, memory: "256MiB" },
  async (req, res) => {
    try {
      const nfceUrl = String(req.query.url ?? req.body?.url ?? "").trim();
      if (!nfceUrl) {
        res.status(400).json({ ok: false, error: "missing-url" });
        return;
      }

      const resp = await fetch(nfceUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
        }
      });
      const html = await resp.text();

      const $ = cheerio.load(html);
      const items: Array<{ nome: string; quantidade: number; unidade: string; preco: number }> = [];

      $("table, div").each((_, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes("descrição") || text.includes("produto")) {
          $(el).find("tr, .item, .prod, li").each((__, row) => {
            const rowText = $(row).text().trim().replace(/\s+/g, " ");
            const money = rowText.match(/(\d{1,3}(\.\d{3})*,\d{2}|\d+,\d{2})/g);
            if (!money?.length) return;
            const last = money[money.length - 1];
            const price = parseFloat(last.replace(/\./g, "").replace(",", "."));
            const name = rowText.split(last)[0].trim();
            if (!name) return;
            items.push({ nome: name, quantidade: 1, unidade: "", preco: price });
          });
        }
      });

      const dedup: typeof items = [];
      const seen = new Set<string>();
      for (const it of items) {
        const k = `${it.nome}::${it.preco}`;
        if (!seen.has(k)) {
          seen.add(k);
          dedup.push(it);
        }
      }

      logger.info("NFC-e parsed", { count: dedup.length });
      res.json({ ok: true, items: dedup, sourceUrl: nfceUrl });
    } catch (e) {
      logger.error("parseNfce failed", e as any);
      res.status(500).json({ ok: false, error: "parse-failed" });
    }
  }
);
