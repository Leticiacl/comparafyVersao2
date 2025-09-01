// src/utils/price.ts
export function formatBRL(n: number | string | null | undefined): string {
    const v = Number(n ?? 0);
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  
  /**
   * Preço unitário "visível" no app.
   * - Para itens por peso/volume (kg, g, l, ml), o app mostra o TOTAL da linha (preço "final" do item).
   * - Para itens por unidade (un, bd, dz), mostra o preço unitário (total / quantidade).
   */
  export function unitPrice(item: {
    preco?: number;       // preço unitário (para itens "un") OU total (para itens por peso)
    total?: number;       // total da linha (se existir)
    quantidade?: number;  // quantidade (para "un")
    unidade?: string;     // un|kg|g|l|ml|bd|dz
  }): number {
    const unidade = (item.unidade || "").toLowerCase();
    const isPeso = /^(kg|g|l|ml)$/.test(unidade);
    if (isPeso) {
      // para peso/volume, já exibimos o total da linha como "preço" (comportamento atual do app)
      return Number(item.total ?? item.preco ?? 0);
    }
    const qtd = Number(item.quantidade || 1);
    if (qtd <= 0) return Number(item.total ?? item.preco ?? 0);
    const total = Number(item.total ?? (item.preco ?? 0) * qtd);
    return +(total / qtd).toFixed(2);
  }
  
  /** Soma o total da compra (considera total da linha quando disponível). */
  export function computePurchaseTotal(purchase: {
    itens?: Array<{ preco?: number; total?: number; quantidade?: number; unidade?: string }>;
  }): number {
    const itens = purchase.itens ?? [];
    const sum = itens.reduce((acc, it) => {
      const unidade = (it.unidade || "").toLowerCase();
      const isPeso = /^(kg|g|l|ml)$/.test(unidade);
      if (isPeso) {
        return acc + Number(it.total ?? it.preco ?? 0);
      }
      const qtd = Number(it.quantidade || 1);
      const total = Number(it.total ?? (Number(it.preco || 0) * qtd));
      return acc + total;
    }, 0);
    return +sum.toFixed(2);
  }
  