// src/utils/category.dataset.ts
// ✅ DICIONÁRIO GRANDE DE NORMALIZAÇÃO (pt-BR, supermercado)
// ➜ As chaves são nomes de categoria exibíveis
// ➜ As listas contém frases/tokens (com ou sem espaço). Tudo minúsculo, sem acento.

export const CATEGORY_PHRASES: Record<string, string[]> = {
    /* ---------------- Hortifruti ---------------- */
    "Hortifruti · Frutas": [
      "banana", "prata", "nanica", "maça", "maca", "maçã", "gala", "fuji",
      "pera", "uva", "laranja", "tangerina", "mexerica", "bergamota",
      "limão", "limao", "limao taiti", "limão taiti", "limão siciliano",
      "abacaxi", "melancia", "melão", "melao", "mamão", "mamao",
      "morango", "kiwi", "abacate", "goiaba", "maracujá", "maracuja",
      "pêssego", "pessego", "ameixa", "caqui", "pitaya", "pitaia",
      "figo", "jabuticaba", "acerola", "coco verde", "coco seco"
    ],
    "Hortifruti · Legumes": [
      "batata", "batata inglesa", "batata doce", "cebola", "alho",
      "tomate", "cenoura", "beterraba", "abobrinha", "abóbora",
      "abobora cabotia", "abobora moranga", "pepino", "chuchu",
      "inhame", "mandioca", "aipim", "macaxeira", "pimentão",
      "pimentao", "berinjela", "quiabo", "milho verde", "vagem"
    ],
    "Hortifruti · Verduras e Ervas": [
      "alface", "alface crespa", "alface americana", "rúcula", "rucula",
      "couve", "espinafre", "coentro", "salsinha", "cebolinha", "agrião",
      "agriao", "repolho", "brócolis", "brocolis", "couve flor",
      "acelga", "almeirão", "almeirao", "chicória", "chicoria",
      "hortelã", "hortela", "manjericão", "manjericao", "louro"
    ],
  
    /* ---------------- Padaria / Confeitaria ---------------- */
    "Padaria": [
      "pão", "pao", "pão francês", "pao frances", "pão de forma", "pao de forma",
      "pão integral", "pao integral", "bisnaga", "baguete", "pão doce", "pao doce",
      "pão de queijo", "pao de queijo", "croissant", "bolo", "torta", "rosca",
      "pão hamburguer", "pao hamburguer", "pão hot dog", "pao hot dog"
    ],
  
    /* ---------------- Mercearia seca ---------------- */
    "Mercearia · Arroz e Feijão": [
      "arroz", "feijão", "feijao", "feijao carioca", "feijão carioca",
      "feijao preto", "feijão preto"
    ],
    "Mercearia · Massas e Molhos": [
      "macarrão", "macarrao", "espaguete", "parafuso", "penne", "talharim",
      "molho de tomate", "extrato de tomate", "passata", "pomarola"
    ],
    "Mercearia · Óleos e Azeites": [
      "óleo de soja", "oleo de soja", "oleo de girassol", "óleo de girassol",
      "oleo de milho", "azeite", "azeite de oliva"
    ],
    "Mercearia · Farinhas e Cereais": [
      "farinha de trigo", "farinha de milho", "farinha de mandioca",
      "fubá", "fuba", "polvilho", "milharina", "aveia", "granola", "cereal matinal"
    ],
    "Mercearia · Açúcares e Adoçantes": [
      "açúcar", "acucar", "açúcar refinado", "açúcar cristal", "acucar cristal",
      "açúcar mascavo", "adoçante", "adocante", "mel"
    ],
    "Mercearia · Temperos e Condimentos": [
      "sal", "sal grosso", "pimenta do reino", "cominho", "colorau",
      "orégano", "oregano", "sazón", "sazon", "knorr", "caldo de carne",
      "caldo de galinha", "vinagre", "vinagre de maçã", "vinagre de maca",
      "shoyu", "molho barbecue", "barbecue", "mostarda", "ketchup", "maionese",
      "molho de pimenta", "páprica", "paprica", "chimichurri"
    ],
    "Mercearia · Enlatados e Conservas": [
      "atum", "sardinha", "milho em conserva", "ervilha em conserva",
      "seleta de legumes", "palmito", "pepino em conserva", "azeitona"
    ],
  
    /* ---------------- Matinais / Bebidas quentes ---------------- */
    "Matinais · Café, Chá e Cacau": [
      "café", "cafe", "cafe em pó", "capsula de cafe", "3 corações", "pilão",
      "melitta", "chá", "cha", "mate leão", "mate leao",
      "achocolatado", "toddy", "nescau", "cacau em pó", "leite em pó", "leite em po"
    ],
  
    /* ---------------- Doces / Snacks ---------------- */
    "Doces · Chocolates e Barras": [
      "chocolate", "barra de chocolate", "bombom", "lacta", "nestlé", "nestle",
      "garoto", "bis", "serenata", "kitkat"
    ],
    "Doces · Balas e Chicletes": [
      "bala", "balas", "jujuba", "bala de goma", "butter toffees", "fini",
      "mentos", "halls", "freegells", "pirulito", "chiclete", "chicletes",
      "trident", "chiclets", "bubbaloo", "ping pong", "big big"
    ],
    "Snacks · Biscoitos e Salgadinhos": [
      "biscoito", "bolacha", "maizena", "cream cracker", "água e sal", "agua e sal",
      "recheado", "oreo", "trakinas", "club social",
      "salgadinho", "ruffles", "doritos", "cheetos", "fandangos",
      "pipoca microondas", "pipoca de micro-ondas", "amendoim", "torresmo"
    ],
  
    /* ---------------- Laticínios, Frios e Ovos ---------------- */
    "Laticínios": [
      "leite uht", "leite integral", "leite desnatado", "leite semidesnatado",
      "creme de leite", "leite condensado", "requeijão", "requeijao",
      "manteiga", "margarina", "iogurte", "yakult", "bebida láctea", "bebida lactea",
      "queijo mussarela", "queijo muçarela", "queijo prato", "queijo minas",
      "queijo coalho", "ricota", "parmesão", "parmesao"
    ],
    "Frios e Embutidos": [
      "presunto", "peito de peru", "mortadela", "salame", "blanquet",
      "salsicha", "linguiça calabresa", "linguica calabresa", "linguiça toscana"
    ],
    "Ovos": ["ovos", "cartela de ovos", "dúzia de ovos", "duzia de ovos"],
  
    /* ---------------- Carnes e congelados ---------------- */
    "Carnes · Bovinos": [
      "patinho", "acem", "acém", "coxão mole", "coração da alcatra",
      "picanha", "maminha", "fraldinha", "contrafilé", "contra file",
      "carne moída", "carne moida", "carne", "lombo"
    ],
    "Carnes · Suínos": ["pernil", "lombo suíno", "lombo suino", "bisteca suína", "bisteca suina"],
    "Carnes · Aves": ["frango", "peito de frango", "coxa sobrecoxa", "sassami"],
    "Peixes e Frutos do Mar": [
      "tilápia", "tilapia", "salmão", "salmao", "bacalhau", "camarão", "camarao", "sardinha fresca"
    ],
    "Congelados e Sorvetes": [
      "lasanha congelada", "pizza congelada", "nuggets", "hambúrguer congelado", "hamburguer congelado",
      "batata palito", "legumes congelados", "sorvete", "açaí", "acai"
    ],
  
    /* ---------------- Bebidas frias ---------------- */
    "Bebidas · Refrigerantes": [
      "refrigerante", "coca cola", "coca-cola", "coca", "guaraná", "guarana", "antarctica", "antartica",
      "pepsi", "fanta", "sprite", "sukita", "tubaína", "tubaina",
      "lata 350", "2l", "2 litros", "1,5l", "600ml", "pet"
    ],
    "Bebidas · Sucos e Néctares": [
      "suco", "néctar", "nectar", "refresco", "suco em pó", "suco em po", "sache suco", "tang",
      "del valle", "maguary", "ades", "suco integral", "suco de uva"
    ],
    "Bebidas · Águas": [
      "água mineral", "agua mineral", "sem gas", "sem gás", "com gas", "com gás",
      "bonafont", "minalba", "crystal", "cristal"
    ],
    "Bebidas · Água de coco e isotônicos": [
      "água de coco", "agua de coco", "kero coco", "sococo",
      "isotônico", "isotonico", "gatorade", "powerade"
    ],
    "Bebidas · Energéticos": ["red bull", "monster", "fusion", "energético", "energetico"],
    "Bebidas · Cervejas": [
      "cerveja", "skol", "brahma", "antarctica", "heineken", "budweiser", "stella artois",
      "lata de cerveja", "long neck"
    ],
    "Bebidas · Vinhos e Destilados": [
      "vinho", "vinho tinto", "vinho branco", "espumante",
      "vodka", "cachaça", "cachaca", "whisky", "gin"
    ],
  
    /* ---------------- Limpeza ---------------- */
    "Limpeza · Roupas": [
      "sabão em pó", "sabao em po", "sabão líquido", "sabao liquido",
      "amaciante", "alvejante", "água sanitária", "agua sanitaria", "tira manchas"
    ],
    "Limpeza · Casa": [
      "detergente", "desinfetante", "multiuso", "veja", "limpa piso", "limpa vidros",
      "desengordurante", "sapólio", "sapolio", "cloro", "cloro gel", "alcool 70", "álcool 70",
      "esponja", "bucha", "lã de aço", "la de aço", "bombril", "saco de lixo",
      "vassoura", "rodo", "pano de chão", "pano de chao", "balde", "luva"
    ],
  
    /* ---------------- Higiene e beleza ---------------- */
    "Higiene Pessoal": [
      "sabonete", "shampoo", "condicionador", "creme dental", "pasta de dente",
      "escova de dente", "fio dental", "enxaguante bucal", "antisséptico bucal",
      "desodorante", "lâmina de barbear", "lamina de barbear", "aparelho de barbear",
      "cotonete", "algodão", "algodao", "hidratante", "protetor solar"
    ],
    "Infantil e Bebê": [
      "fralda", "lenço umedecido", "lenco umedecido", "shampoo baby", "pomada", "sabonete infantil"
    ],
  
    /* ---------------- Papelaria/descartáveis ---------------- */
    "Papelaria e Descartáveis": [
      "papel higiênico", "papel higienico", "papel toalha", "guardanapo",
      "copo descartável", "prato descartável", "talher descartável",
      "filme pvc", "plástico filme", "papel alumínio", "papel aluminio"
    ],
  
    /* ---------------- Pets ---------------- */
    "Pets": [
      "ração", "racao", "ração para cães", "ração para gatos", "racao para caes", "racao para gatos",
      "whiskas", "golden", "premier", "pedigree", "areia higiênica", "areia higienica", "sachê pet", "sache pet"
    ],
  
    /* ---------------- Outros ---------------- */
    "Churrasco e Afins": [
      "carvão", "carvao", "acendedor de churrasco", "sal grosso para churrasco", "linguiça para churrasco"
    ],
  };
  