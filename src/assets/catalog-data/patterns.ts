// padrões que cobrem variações “coladas” e abreviações comuns
export const PATTERN_RULES: { p: RegExp | string; c: string }[] = [
    // hortifruti colado
    { p: /alface\s*crespa|alfacecrespa/i, c: "frutas/verduras" },
    { p: /cenoura\s*vermelha|cenouravermelha/i, c: "frutas/verduras" },
    { p: /manga\s*tommy|mangatommy/i, c: "frutas/verduras" },
    { p: /limao\s*tahiti|limaotahiti/i, c: "frutas/verduras" },
    { p: /brocolis\s*ninja|brocolisninja/i, c: "frutas/verduras" },
  
    // mercearia
    { p: /achoc/i, c: "matinais" },          // “achoc(olatado)”
    { p: /chiclet/i, c: "doces/salgados" },  // “chiclete topline”, etc.
    { p: /biscoit/i, c: "biscoitos" },       // “biscoit…” (prefixo)
    { p: /ketchup/i, c: "condimentos/alhos" },
    { p: /canjic/i, c: "matinais" },
    { p: /amendoim/i, c: "matinais" },
  
    // limpeza
    { p: /detergent/i, c: "mat limpeza" },
    { p: /amac/i, c: "mat limpeza" },
  ];
  