
/* build.js
   Montagem de PC, compatibilidade, preços e benchmarks reais por par CPU + GPU.
   O gargalo sai de uma estimativa por índice (coluna desempenho_idx do catálogo),
   sempre rotulada como estimativa, e ganha o benchmark medido do par quando a
   tabela benchmarks_pares tem dados para aquela combinação.
*/

// ---------- 1) Categorias ----------
const CATEGORIAS = [
  { id: 'cpu', label: 'Processador' },
  { id: 'placa-mae', label: 'Placa-mãe' },
  { id: 'memoria', label: 'Memória', multiplo: true },
  { id: 'placa-video', label: 'Placa de vídeo' },
  { id: 'armazenamento', label: 'Armazenamento', multiplo: true },
  { id: 'fonte', label: 'Fonte' },
  { id: 'gabinete', label: 'Gabinete' }
];

const DICAS_CATEGORIA = {
  cpu: 'Pense no que você vai fazer com o PC. O socket dele define quais placas-mãe combinam.',
  'placa-mae': 'Precisa ter o mesmo socket do processador e suportar o tipo de memória escolhido.',
  memoria: 'Confira se o tipo (DDR4 ou DDR5) bate com o que a placa-mãe aceita.',
  'placa-video': 'Considere os jogos, a resolução e os benchmarks disponíveis para a combinação com seu processador.',
  armazenamento: 'SSD NVMe é rápido; HD pode compensar quando você precisa de bastante espaço.',
  fonte: 'Precisa dar conta da potência das peças, com folga.',
  gabinete: 'Confira se comporta o tamanho da placa de vídeo e o formato da placa-mãe.'
};

// ---------- 2) Peças de exemplo ----------
// Os dados de exemplo servem somente para a interface.
// Não são usados para calcular nem declarar gargalos.
const MOCK_PECAS = [
  { id: 'cpu-1', categoria: 'cpu', nome: 'Ryzen 5 7600', marca: 'AMD', preco: 1299, socket: 'AM5', potencia_w: 65, desempenho_idx: 64 },
  { id: 'cpu-2', categoria: 'cpu', nome: 'Core i5-13400F', marca: 'Intel', preco: 1099, socket: 'LGA1700', potencia_w: 65, desempenho_idx: 61 },
  { id: 'cpu-3', categoria: 'cpu', nome: 'Ryzen 7 7800X3D', marca: 'AMD', preco: 2599, socket: 'AM5', potencia_w: 120, desempenho_idx: 85.6 },
  { id: 'cpu-4', categoria: 'cpu', nome: 'Ryzen 5 5600', marca: 'AMD', preco: 699, socket: 'AM4', potencia_w: 65, desempenho_idx: 52 },

  { id: 'mb-1', categoria: 'placa-mae', nome: 'B650M', marca: 'Gigabyte', preco: 899, socket: 'AM5', tipo_memoria: 'DDR5' },
  { id: 'mb-2', categoria: 'placa-mae', nome: 'B760M', marca: 'ASUS', preco: 799, socket: 'LGA1700', tipo_memoria: 'DDR4' },
  { id: 'mb-3', categoria: 'placa-mae', nome: 'X670E', marca: 'MSI', preco: 1899, socket: 'AM5', tipo_memoria: 'DDR5' },
  { id: 'mb-4', categoria: 'placa-mae', nome: 'A520M', marca: 'ASRock', preco: 449, socket: 'AM4', tipo_memoria: 'DDR4' },

  { id: 'ram-1', categoria: 'memoria', nome: '16GB (2x8) 5600MHz', marca: 'Kingston', preco: 349, tipo_memoria: 'DDR5' },
  { id: 'ram-2', categoria: 'memoria', nome: '16GB (2x8) 3200MHz', marca: 'Corsair', preco: 279, tipo_memoria: 'DDR4' },
  { id: 'ram-3', categoria: 'memoria', nome: '32GB (2x16) 6000MHz', marca: 'Kingston', preco: 799, tipo_memoria: 'DDR5' },

  { id: 'gpu-1', categoria: 'placa-video', nome: 'RTX 4060', marca: 'NVIDIA', preco: 2199, potencia_w: 115, desempenho_idx: 35.1 },
  { id: 'gpu-2', categoria: 'placa-video', nome: 'RTX 4070', marca: 'NVIDIA', preco: 3699, potencia_w: 200, desempenho_idx: 54.7 },
  { id: 'gpu-3', categoria: 'placa-video', nome: 'RX 7600', marca: 'AMD', preco: 1899, potencia_w: 165, desempenho_idx: 34.3 },
  { id: 'gpu-4', categoria: 'placa-video', nome: 'RTX 5090', marca: 'NVIDIA', preco: 1899, potencia_w: 580, desempenho_idx: 100 },
  { id: 'gpu-5', categoria: 'placa-video', nome: 'RX 580', marca: 'AMD', preco: 1899, potencia_w: 135, desempenho_idx: 10 },
  { id: 'gpu-6', categoria: 'placa-video', nome: 'RTX 3050 TI', marca: 'NVIDIA', preco: 1899, potencia_w: 35, desempenho_idx: 13 },

  { id: 'ssd-1', categoria: 'armazenamento', nome: 'SSD NVMe 500GB', marca: 'Kingston', preco: 249, potencia_w: 6 },
  { id: 'ssd-2', categoria: 'armazenamento', nome: 'SSD NVMe 1TB', marca: 'WD', preco: 449, potencia_w: 6 },
  { id: 'hd-1', categoria: 'armazenamento', nome: 'HD 1TB 7200RPM', marca: 'Seagate', preco: 279, potencia_w: 8 },

  { id: 'psu-1', categoria: 'fonte', nome: '550W 80+ Bronze', marca: 'Corsair', preco: 399, potencia_w: 550 },
  { id: 'psu-2', categoria: 'fonte', nome: '650W 80+ Bronze', marca: 'EVGA', preco: 499, potencia_w: 650 },
  { id: 'psu-3', categoria: 'fonte', nome: '750W 80+ Gold', marca: 'Corsair', preco: 699, potencia_w: 750 },

  { id: 'case-1', categoria: 'gabinete', nome: 'NZXT H510', marca: 'NZXT', preco: 549 },
  { id: 'case-2', categoria: 'gabinete', nome: 'Lancer', marca: 'Gamdias', preco: 349 }
];

// ---------- 3) Estado ----------
const build = {};
let categoriaAtiva = CATEGORIAS[0].id;
let todasPecas = [];
let fonteDados = { origem: 'exemplo', motivo: '' };

// Busca e filtros da grade. São só de visualização: não mexem no build montado.
let buscaAtual = '';
let marcaAtiva = '';
let somenteImportadas = false;

// Benchmarks já consultados por par CPU|GPU (evita repetir a consulta a cada clique).
const cacheBenchmarks = new Map();

// ---------- 3b) Seleção (uma peça por categoria, ou várias quando a
// categoria é marcada com multiplo: true — hoje só armazenamento) ----------

// Sempre devolve lista, aceite o build guardando um objeto ou um array.
function listaPecas(categoriaId) {
  const valor = build[categoriaId];
  if (!valor) return [];
  return Array.isArray(valor) ? valor : [valor];
}

function categoriaAceitaVarias(categoriaId) {
  const categoria = CATEGORIAS.find(cat => cat.id === categoriaId);
  return Boolean(categoria && categoria.multiplo);
}

function pecaSelecionada(categoriaId, peca) {
  return listaPecas(categoriaId).some(item => item.id === peca.id);
}

function alternarPeca(categoriaId, peca) {
  const atuais = listaPecas(categoriaId);
  const jaTem = atuais.some(item => item.id === peca.id);

  if (jaTem) {
    const restantes = atuais.filter(item => item.id !== peca.id);

    if (!restantes.length) delete build[categoriaId];
    else if (restantes.length === 1) build[categoriaId] = restantes[0];
    else build[categoriaId] = restantes;

    delete quantidades[peca.id];
    return;
  }

  quantidades[peca.id] = 1;

  if (categoriaAceitaVarias(categoriaId)) {
    build[categoriaId] = [...atuais, peca];
  } else {
    build[categoriaId] = peca;
  }
}

// Quantas unidades de cada peça (2x o mesmo pente de 16GB, por exemplo).
const quantidades = {};
const QTD_MAXIMA = 9;

function qtdPeca(peca) {
  const qtd = Number(quantidades[peca.id]);
  return Number.isFinite(qtd) && qtd > 0 ? qtd : 1;
}

function aumentarQtd(categoriaId, peca) {
  if (!pecaSelecionada(categoriaId, peca)) {
    alternarPeca(categoriaId, peca);
    return;
  }

  quantidades[peca.id] = Math.min(QTD_MAXIMA, qtdPeca(peca) + 1);
  render();
}

function diminuirQtd(categoriaId, peca) {
  if (!pecaSelecionada(categoriaId, peca)) return;

  const nova = qtdPeca(peca) - 1;

  if (nova <= 0) {
    removerPeca(categoriaId, peca.id);
    return;
  }

  quantidades[peca.id] = nova;
  render();
}

let benchmarkConsultaAtual = 0;
let benchmarkParAtual = '';

const filtrosBenchmark = {
  jogo: '',
  resolucao: '',
  qualidade: ''
};

const formatoPreco = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0
});

function precoFmt(valor) {
  return formatoPreco.format(Number(valor) || 0).replace(' ', '\u00A0');
}

function escaparHTML(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caractere]);
}

// ---------- 4) Carregamento das peças ----------
// Preços atualizados localmente (arquivo precos.js) têm prioridade sobre a
// coluna preco do banco — assim dá para atualizar preço sem SQL e sem escrita.
function aplicarPrecosLocais(lista) {
  const novos = (typeof window !== 'undefined' && window.PRECOS) || null;
  if (!novos) return lista;

  return lista.map(peca => {
    const preco = Number(novos[peca.id]);
    return Number.isFinite(preco) && preco > 0 ? { ...peca, preco } : peca;
  });
}

async function carregarPecas() {
  const configurado =
    typeof SUPABASE_URL !== 'undefined' &&
    SUPABASE_URL !== 'COLE_AQUI_SUA_PROJECT_URL';

  if (configurado && typeof buscarPecas === 'function') {
    try {
      const dados = await buscarPecas();

      if (Array.isArray(dados) && dados.length) {
        fonteDados = { origem: 'banco', motivo: '' };
        return aplicarPrecosLocais(dados);
      }

      fonteDados.motivo =
        (typeof ultimoErroBanco !== 'undefined' && ultimoErroBanco)
          ? ultimoErroBanco
          : 'a tabela pecas está vazia';
    } catch (erro) {
      fonteDados.motivo = erro?.message || 'falha de conexão';
    }
  } else {
    fonteDados.motivo = 'Supabase não configurado ou supabase.js não carregado';
  }

  fonteDados.origem = 'exemplo';
  return aplicarPrecosLocais(MOCK_PECAS);
}

function renderAvisoBanco() {
  const caixa = document.getElementById('banco-aviso');
  if (!caixa) return;

  let texto = '';

  if (fonteDados.origem === 'exemplo') {
    texto = `Usando peças de exemplo — não consegui ler o banco (${fonteDados.motivo}).`;
  }

  caixa.textContent = texto;
  caixa.classList.toggle('hidden', !texto);
}

// ---------- 5) Compatibilidade ----------
function checarCompatibilidade() {
  const avisos = [];
  const cpu = build.cpu;
  const fonte = build.fonte;
  const placaMae = build['placa-mae'];

  if (cpu && placaMae && cpu.socket !== placaMae.socket) {
    avisos.push(
      `${cpu.nome} usa o socket ${cpu.socket}, mas a ${placaMae.nome} é ${placaMae.socket} — troque uma das duas.`
    );
  }

  // Memória aceita mais de um kit: confere TODOS, não só o primeiro.
  const memorias = listaPecas('memoria');

  if (placaMae && placaMae.tipo_memoria) {
    const incompativel = memorias.find(
      memoria => memoria.tipo_memoria !== placaMae.tipo_memoria
    );

    if (incompativel) {
      avisos.push(
        `A memória é ${incompativel.tipo_memoria || 'de tipo não informado'}, mas a placa-mãe aceita ${placaMae.tipo_memoria} — escolha uma memória compatível.`
      );
    }
  }

  // Placas X99/X79 de servidor aceitam só RDIMM (ECC REG); desktop usa UDIMM.
  if (placaMae && placaMae.tipo_modulo) {
    const modulo = memorias.find(
      memoria => memoria.tipo_modulo && memoria.tipo_modulo !== placaMae.tipo_modulo
    );

    if (modulo) {
      avisos.push(
        `A memória é ${modulo.tipo_modulo}, mas a ${placaMae.nome} só aceita ${placaMae.tipo_modulo} — pente de servidor (ECC/REG) e de desktop não são intercambiáveis.`
      );
    }
  }

  if (fonte) {
    // Soma todas as peças escolhidas, menos a própria fonte (ela é a
    // capacidade, não o consumo). Lista vazia soma zero.
    const consumoEstimado = CATEGORIAS
      .filter(cat => cat.id !== 'fonte')
      .flatMap(cat => listaPecas(cat.id))
      .reduce((soma, peca) => soma + potenciaEstimada(peca) * qtdPeca(peca), 0);

    // Vermelho só quando o consumo estimado passa do que a fonte entrega.
    // Pouca folga (85% a 100%) vira uma nota discreta no resumo (ver folgaFonteTexto).
    if (consumoEstimado > Number(fonte.potencia_w)) {
      avisos.push(
        `A fonte de ${fonte.potencia_w}W não dá conta do consumo estimado (${consumoEstimado}W) — escolha uma fonte mais potente.`
      );
    }
  }

  return avisos;
}

// Consumo estimado = soma da potência de todas as peças, menos a fonte.
function consumoEstimadoBuild() {
  return CATEGORIAS
    .filter(cat => cat.id !== 'fonte')
    .flatMap(cat => listaPecas(cat.id))
    .reduce((soma, peca) => soma + potenciaEstimada(peca) * qtdPeca(peca), 0);
}

// Nota (não é erro): fonte funciona, mas com pouca margem.
function folgaFonteTexto() {
  const fonte = listaPecas('fonte')[0];
  const capacidade = fonte ? Number(fonte.potencia_w) : 0;
  if (!capacidade) return '';

  const consumo = consumoEstimadoBuild();
  if (consumo <= capacidade * 0.85 || consumo > capacidade) return '';

  return `A fonte de ${capacidade}W atende o consumo estimado (${consumo}W), mas com pouca folga (${Math.round(consumo / capacidade * 100)}% de uso). Uma fonte maior deixa mais margem para picos e futuras trocas.`;
}

// ---------- 5b) Remover peça ----------
// Com pecaId remove só aquela peça (armazenamento pode ter várias); sem
// pecaId remove a categoria inteira.
function removerPeca(categoriaId, pecaId) {
  const atuais = listaPecas(categoriaId);
  const removidas = pecaId ? atuais.filter(peca => peca.id === pecaId) : atuais;
  const restantes = atuais.filter(peca => !pecaId || peca.id !== pecaId);

  removidas.forEach(peca => delete quantidades[peca.id]);

  if (!restantes.length) delete build[categoriaId];
  else if (restantes.length === 1) build[categoriaId] = restantes[0];
  else build[categoriaId] = restantes;

  render();
}

// ---------- 5c) Filtro de compatibilidade ----------
function filtrarCompativeis(pecas) {
  if (categoriaAtiva === 'placa-mae' && build.cpu) {
    return pecas.filter(p => p.socket === build.cpu.socket);
  }

  if (categoriaAtiva === 'cpu' && build['placa-mae']) {
    return pecas.filter(p => p.socket === build['placa-mae'].socket);
  }

  if (categoriaAtiva === 'memoria' && build['placa-mae']) {
    const placa = build['placa-mae'];

    return pecas.filter(
      p => p.tipo_memoria === placa.tipo_memoria &&
        (!placa.tipo_modulo || !p.tipo_modulo || p.tipo_modulo === placa.tipo_modulo)
    );
  }

  return pecas;
}

// ---------- 6) Renderização das categorias ----------
function renderCategorias() {
  const wrap = document.getElementById('categorias');
  if (!wrap) return;

  wrap.innerHTML = '';

  CATEGORIAS.forEach(cat => {
    const ativa = cat.id === categoriaAtiva;
    const escolhida = listaPecas(cat.id).length > 0;
    const btn = document.createElement('button');

    btn.dataset.active = String(ativa);
    btn.type = 'button';
    if (ativa) btn.setAttribute('aria-current', 'true');
    btn.className = `pin-tab flex items-center gap-2 transition-colors ${
      ativa
        ? 'text-copper-light dark:text-accent border-copper-light dark:border-accent'
        : 'text-muted-light dark:text-muted border-transparent hover:text-ink-light dark:hover:text-ink'
    }`;

    btn.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-sm shrink-0 ${
        escolhida
          ? 'bg-copper-light dark:bg-accent'
          : 'bg-line-light dark:bg-line'
      }" aria-hidden="true"></span>
      ${escaparHTML(cat.label)}
    `;

    btn.addEventListener('click', () => {
      categoriaAtiva = cat.id;
      // Cada categoria tem marcas diferentes: o filtro não faz sentido depois
      // da troca. A busca é mantida, porque pode valer para a nova categoria.
      marcaAtiva = '';
      somenteImportadas = false;
      render();
    });

    wrap.appendChild(btn);
  });
}

function renderDica() {
  const box = document.getElementById('dica-categoria');
  if (!box) return;

  const dica = DICAS_CATEGORIA[categoriaAtiva];
  const varias = categoriaAceitaVarias(categoriaAtiva)
    ? `<p class="mt-2 text-xs text-cyan-light dark:text-cyan">
         Você pode escolher mais de uma peça nesta categoria.
       </p>`
    : '';

  box.innerHTML = (dica
    ? `<p class="text-sm text-ink-light dark:text-ink pl-3 border-l-2 border-copper-light dark:border-accent">${escaparHTML(dica)}</p>`
    : '') + varias;
}

function renderFiltroInfo(totalNaCategoria, totalFiltrado) {
  const el = document.getElementById('filtro-info');
  if (!el) return;

  if (totalFiltrado < totalNaCategoria) {
    el.classList.remove('hidden');
    el.textContent =
      `Mostrando ${totalFiltrado} de ${totalNaCategoria}: só as compatíveis com o que você já escolheu.`;
  } else {
    el.classList.add('hidden');
    el.textContent = '';
  }
}

// ---------- 6b) Busca, filtro por marca e link da peça ----------

// Compara sem acento e sem diferença de caixa: "memoria" acha "Memória".
function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Foto da peça: usa a coluna imagem_url; se estiver vazia, cai no arquivo
// fotos.js (fotos coletadas das lojas e casadas por nome).
function fotoDaPeca(peca) {
  if (peca.imagem_url) return peca.imagem_url;

  const coletadas = typeof window !== 'undefined' ? window.FOTOS : null;
  const extra = coletadas && coletadas[normalizarTexto(peca.nome)];

  return extra ? extra.imagem : '';
}


// Lojas usadas quando a peça ainda não tem URL própria cadastrada.
const LOJAS = [
  { nome: 'KaBuM', link: termo => `https://www.kabum.com.br/busca/${termo}` },
  { nome: 'Pichau', link: termo => `https://www.pichau.com.br/search?q=${termo}` },
  { nome: 'Terabyte', link: termo => `https://www.terabyteshop.com.br/busca?str=${termo}` },
  { nome: 'Mercado Livre', link: termo => `https://lista.mercadolivre.com.br/${termo}` },
  { nome: 'Amazon', link: termo => `https://www.amazon.com.br/s?k=${termo}` }
];

// Lista de links de compra da peça. Se existir a coluna link_compra (ou link)
// com uma URL, ela entra primeiro; as demais lojas continuam na lista.
// Nome do anúncio pelo endereço: AliExpress, ou o site de onde o link veio.
function rotuloLoja(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (/(^|\.)aliexpress\.com$/.test(host)) return 'Produto no AliExpress';
    return 'Anúncio em ' + host;
  } catch {
    return 'Anúncio da loja';
  }
}

// AliExpress escolhe moeda e idioma pelo país detectado (pode abrir em euro).
// O parâmetro gatewayAdapt=glo2bra pede a versão do Brasil (reais, português).
// Links curtos (a.aliexpress.com/_xxx) não dá para alterar e ficam como estão.
function paraAliexpressBR(url) {
  try {
    const u = new URL(url);
    if (/(^|\.)aliexpress\.com$/.test(u.hostname) && u.hostname !== 'a.aliexpress.com') {
      u.searchParams.set('gatewayAdapt', 'glo2bra');
      return u.toString();
    }
  } catch { /* url inválida: devolve igual */ }
  return url;
}

function linksPeca(peca) {
  const termo = encodeURIComponent(
    normalizarTexto(`${peca.marca || ''} ${peca.nome || ''}`)
      .replace(/\s+/g, ' ')
      .trim()
  );

  const direto = String(peca.link_compra || peca.link || '').trim();
  const temDireto = /^https?:\/\//i.test(direto);

  // Peça importada só se compra no AliExpress: as lojas brasileiras não têm.
  if (ehImportada(peca)) {
    // Só o link direto do produto. Sem link cadastrado, avisa em vez de levar a uma busca.
    return temDireto
      ? [{ nome: rotuloLoja(direto), url: paraAliexpressBR(direto) }]
      : [{ nome: 'Link do anúncio ainda não cadastrado', url: '', semLink: true }];
  }

  const links = LOJAS.map(loja => ({ nome: loja.nome, url: loja.link(termo) }));

  if (temDireto) {
    links.unshift({ nome: 'Loja cadastrada', url: direto });
  }

  return links;
}

// Link principal, usado no resumo do build.
function linkPeca(peca) {
  return linksPeca(peca)[0].url || '';
}

// A grade é redesenhada a cada clique: devolve o foco do teclado para o botão
// da mesma peça (ou o primeiro botão dela, se aquele deixou de existir).
function refocarPeca(id, acao) {
  const card = document.querySelector(`[data-peca-id="${CSS.escape(String(id))}"]`);
  if (!card) return;

  const alvo = card.querySelector(`[data-acao="${acao}"]`) || card.querySelector('[data-acao]');
  if (alvo && typeof alvo.focus === 'function') alvo.focus();
}

// ---------- Peças importadas (AliExpress) ----------
function ehImportada(peca) {
  return Boolean(peca) && peca.origem === 'aliexpress';
}

// Peça importada soma o frete estimado (quando cadastrado). Imposto de
// importação não entra: depende do valor total da compra e do vendedor.
function custoPeca(peca) {
  const base = Number(peca.preco) || 0;
  return ehImportada(peca) ? base + (Number(peca.frete_estimado) || 0) : base;
}

function incluirImportadas() {
  const caixa = document.getElementById('incluir-importadas');
  return Boolean(caixa && caixa.checked);
}

// Preços do catálogo ainda marcados como "estimado" não vieram de uma loja.
function rotuloPreco(peca) {
  if (ehImportada(peca)) {
    return Number(peca.frete_estimado) > 0
      ? `+ ${precoFmt(peca.frete_estimado)} de frete estimado`
      : 'sem frete nem imposto';
  }

  const atualizado = typeof window !== 'undefined' && window.PRECOS && window.PRECOS[peca.id];
  return peca.preco_status && peca.preco_status !== 'verificado' && !atualizado
    ? 'preço estimado — confira na loja'
    : '';
}

function seloImportadaHTML(peca) {
  if (!ehImportada(peca)) return '';

  return `<span class="rounded-full border border-amber-800/60 dark:border-yellow-500/60 px-2 py-0.5 text-[11px] text-amber-900 dark:text-yellow-500">Importada</span>`;
}

function importadaHTML(peca) {
  if (!ehImportada(peca)) return '';

  const prazo = Number(peca.prazo_dias) > 0 ? ` Prazo médio: ${Number(peca.prazo_dias)} dias.` : '';

  return `
    <p class="mb-3 rounded-md border border-amber-800/40 dark:border-yellow-500/40 bg-amber-800/10 dark:bg-yellow-500/10 px-2.5 py-2 text-xs text-amber-900 dark:text-yellow-500">
      Importada do AliExpress.${prazo} Sem garantia no Brasil e pode ter imposto de importação. Confira o anúncio antes de comprar.
    </p>
  `;
}

// Cada palavra digitada precisa aparecer no nome, na marca ou nas specs.
function combinaComBusca(peca, termo) {
  if (!termo) return true;

  const alvo = normalizarTexto(
    `${peca.nome || ''} ${peca.marca || ''} ${peca.specs || ''}`
  );

  return termo
    .split(/\s+/)
    .filter(Boolean)
    .every(palavra => alvo.includes(palavra));
}

function renderFiltrosMarcas(pecasBase) {
  const wrap = document.getElementById('filtros-marca');
  if (!wrap) return;

  const importadas = pecasBase.filter(ehImportada);

  // Sem peça importada nesta categoria, o filtro de origem não faz sentido.
  if (somenteImportadas && !importadas.length) somenteImportadas = false;

  // Com o filtro AliExpress ligado, as marcas listadas são só as das importadas.
  const baseMarcas = somenteImportadas ? importadas : pecasBase;
  const contagem = {};

  baseMarcas.forEach(peca => {
    const marca = (peca.marca || '').trim() || 'Outras';
    contagem[marca] = (contagem[marca] || 0) + 1;
  });

  const marcas = Object.entries(contagem)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));

  // A marca ativa pode ter sumido (troca de categoria ou de peça compatível).
  if (marcaAtiva && !contagem[marcaAtiva]) marcaAtiva = '';

  // Categoria com uma marca só e sem importadas não precisa de filtro.
  if (marcas.length <= 1 && !importadas.length) {
    wrap.innerHTML = '';
    return;
  }

  const chip = (valor, rotulo, total) => {
    const ativo = valor === '' ? (!marcaAtiva && !somenteImportadas) : marcaAtiva === valor;

    return `
      <button type="button" data-marca="${escaparHTML(valor)}" aria-pressed="${ativo}"
        class="rounded-full border px-3 py-1.5 transition-colors ${
          ativo
            ? 'border-copper-light dark:border-accent bg-copper-light dark:bg-copper text-white'
            : 'border-line-light dark:border-line text-muted-light dark:text-muted hover:border-copper-light dark:hover:border-accent hover:text-ink-light dark:hover:text-ink'
        }">
        ${escaparHTML(rotulo)} <span class="opacity-60">${total}</span>
      </button>
    `;
  };

  const chipImportadas = importadas.length ? `
    <button type="button" data-origem="aliexpress" aria-pressed="${somenteImportadas}"
      class="rounded-full border px-3 py-1.5 font-medium transition-colors ${
        somenteImportadas
          ? 'border-amber-800 bg-amber-800 text-white dark:border-yellow-500 dark:bg-yellow-500 dark:text-bg'
          : 'border-amber-800/60 text-amber-900 hover:border-amber-800 dark:border-yellow-500/60 dark:text-yellow-500 dark:hover:border-yellow-500'
      }">
      AliExpress <span class="opacity-70">${importadas.length}</span>
    </button>
  ` : '';

  wrap.innerHTML =
    chip('', 'Todas', pecasBase.length) +
    chipImportadas +
    marcas.map(([marca, total]) => chip(marca, marca, total)).join('');

  // O filtro redesenha os botões: devolve o foco ao que o teclado acabou de ativar.
  const refocar = seletor => {
    const novo = wrap.querySelector(seletor);
    if (novo && typeof novo.focus === 'function') novo.focus();
  };

  wrap.querySelectorAll('button[data-marca]').forEach(botao => {
    botao.addEventListener('click', () => {
      marcaAtiva = botao.dataset.marca;
      if (!marcaAtiva) somenteImportadas = false;
      renderPecas();
      refocar(`button[data-marca="${CSS.escape(marcaAtiva)}"]`);
    });
  });

  const botaoImportadas = wrap.querySelector('button[data-origem]');
  if (botaoImportadas) {
    botaoImportadas.addEventListener('click', () => {
      somenteImportadas = !somenteImportadas;
      marcaAtiva = '';
      renderPecas();
      refocar('button[data-origem]');
    });
  }
}

function renderPecas() {
  const grid = document.getElementById('pecas-grid');
  if (!grid) return;

  const pecasDaCategoria = todasPecas.filter(
    p => p.categoria === categoriaAtiva
  );
  const compativeis = filtrarCompativeis(pecasDaCategoria);

  renderFiltroInfo(pecasDaCategoria.length, compativeis.length);
  renderFiltrosMarcas(compativeis);

  const termo = normalizarTexto(buscaAtual);
  const pecasFiltradas = compativeis
    .filter(peca => !somenteImportadas || ehImportada(peca))
    .filter(peca => !marcaAtiva || (peca.marca || '') === marcaAtiva)
    .filter(peca => combinaComBusca(peca, termo));

  const info = document.getElementById('resultado-info');
  if (info) {
    const filtrando = Boolean(termo || marcaAtiva || somenteImportadas);
    info.classList.toggle('hidden', !filtrando);
    info.textContent = filtrando
      ? `${pecasFiltradas.length} de ${compativeis.length} peças` +
        (somenteImportadas ? ' · AliExpress' : '') +
        (marcaAtiva ? ` · ${marcaAtiva}` : '') +
        (termo ? ` · “${buscaAtual.trim()}”` : '')
      : '';
  }

  grid.innerHTML = '';

  if (!pecasFiltradas.length) {
    const semCompat = compativeis.length === 0;

    grid.innerHTML = `
      <div class="col-span-full rounded-lg border border-line-light dark:border-line p-5">
        <p class="text-sm text-muted-light dark:text-muted">
          ${semCompat
            ? 'Nenhuma peça compatível encontrada — troque a peça escolhida numa categoria anterior.'
            : 'Nenhuma peça encontrada com essa busca e esse filtro.'}
        </p>
        ${semCompat ? '' : `
          <button type="button" id="limpar-filtros"
            class="mt-3 text-xs underline underline-offset-2 hover:text-copper-light dark:hover:text-accent transition-colors">
            Limpar busca e filtros
          </button>
        `}
      </div>
    `;

    const limparFiltros = document.getElementById('limpar-filtros');
    if (limparFiltros) {
      limparFiltros.addEventListener('click', () => {
        buscaAtual = '';
        marcaAtiva = '';
        somenteImportadas = false;

        const campo = document.getElementById('busca');
        if (campo) campo.value = '';

        const limpar = document.getElementById('limpar-busca');
        if (limpar) limpar.classList.add('hidden');

        renderPecas();
      });
    }

    return;
  }

  pecasFiltradas.forEach(peca => {
    const selecionada = pecaSelecionada(categoriaAtiva, peca);
    const varias = categoriaAceitaVarias(categoriaAtiva);
    const urlFoto = fotoDaPeca(peca);

    // <article> com botão próprio: o card tem links e botões dentro, o que não
    // cabe num elemento com role="button". O clique no card inteiro continua
    // funcionando para mouse e toque; o teclado usa o botão do card.
    const card = document.createElement('article');
    card.dataset.pecaId = String(peca.id);
    card.className = `group text-left border rounded-lg p-5 transition-colors relative cursor-pointer ${
      selecionada
        ? 'border-copper-light dark:border-accent bg-copper-light/5 dark:bg-accent/5'
        : 'border-line-light dark:border-line hover:border-copper-light dark:hover:border-accent'
    }`;

    card.innerHTML = `
      ${selecionada ? `
        <span class="absolute top-3 right-3 w-[18px] h-[18px] rounded flex items-center justify-center bg-copper-light dark:bg-copper text-white text-[11px] leading-none" aria-hidden="true">✓</span>
      ` : ''}
      ${urlFoto ? `
        <img src="${escaparHTML(urlFoto)}" alt=""
          loading="lazy" decoding="async" referrerpolicy="no-referrer"
          class="mb-3 h-32 w-full rounded-md bg-bg-light dark:bg-bg object-contain">
      ` : ''}
      <p class="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-light dark:text-muted mb-1">${escaparHTML(peca.marca)}${seloImportadaHTML(peca)}</p>
      <h4 class="font-display font-semibold mb-1 pr-6">${escaparHTML(peca.nome)}</h4>
      <p class="text-xs text-muted-light dark:text-muted mb-3 min-h-[1rem]">${escaparHTML(peca.specs || '')}</p>
      ${importadaHTML(peca)}

      <div class="flex items-end justify-between gap-3">
        <div>
          <p class="font-mono text-copper-light dark:text-accent font-semibold">${precoFmt(peca.preco)}</p>
          ${rotuloPreco(peca) ? `<p class="text-[11px] text-muted-light dark:text-muted">${escaparHTML(rotuloPreco(peca))}</p>` : ''}
        </div>
        ${varias ? (selecionada ? `
          <div class="flex shrink-0 items-center gap-1" role="group" aria-label="Quantidade de ${escaparHTML(peca.nome)}">
            <button type="button" data-acao="menos" aria-label="Remover uma unidade"
              class="h-7 w-7 rounded-md border border-line-light dark:border-line text-muted-light dark:text-muted transition-colors hover:border-copper-light dark:hover:border-accent hover:text-ink-light dark:hover:text-ink">−</button>
            <span class="w-6 text-center font-mono text-xs">${qtdPeca(peca)}</span>
            <button type="button" data-acao="mais" aria-label="Adicionar uma unidade"
              class="h-7 w-7 rounded-md border border-line-light dark:border-line text-muted-light dark:text-muted transition-colors hover:border-copper-light dark:hover:border-accent hover:text-ink-light dark:hover:text-ink">+</button>
          </div>
        ` : `
          <button type="button" data-acao="adicionar" aria-label="Adicionar ${escaparHTML(peca.nome)}"
            class="shrink-0 rounded-md border border-line-light dark:border-line px-2.5 py-1.5 text-xs text-muted-light dark:text-muted transition-colors hover:border-copper-light dark:hover:border-accent hover:text-ink-light dark:hover:text-ink">
            + Adicionar
          </button>
        `) : `
          <button type="button" data-acao="escolher"
            aria-label="${selecionada ? 'Remover' : 'Escolher'} ${escaparHTML(peca.nome)}"
            class="shrink-0 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
              selecionada
                ? 'border-copper-light dark:border-accent text-copper-light dark:text-accent'
                : 'border-field-light dark:border-field text-muted-light dark:text-muted hover:border-copper-light dark:hover:border-accent hover:text-ink-light dark:hover:text-ink'
            }">
            ${selecionada ? 'Remover' : 'Escolher'}
          </button>
        `}
      </div>

      <details class="mt-3 border-t border-line-light dark:border-line pt-2">
        <summary
          class="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-muted-light dark:text-muted underline underline-offset-2 transition-colors hover:text-copper-light dark:hover:text-accent">
          Onde comprar
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </summary>
        <ul class="mt-2 grid grid-cols-2 gap-1">
          ${linksPeca(peca).map(loja => loja.semLink ? `
            <li class="col-span-2 px-2 py-1 text-xs text-muted-light dark:text-muted">${escaparHTML(loja.nome)}</li>
            ` : `
            <li>
              <a href="${escaparHTML(loja.url)}" target="_blank" rel="noopener noreferrer"
                class="block rounded px-2 py-1 text-xs text-ink-light dark:text-ink transition-colors hover:bg-bg-light dark:hover:bg-bg">
                ${escaparHTML(loja.nome)}
              </a>
            </li>
            `).join('')}
        </ul>
      </details>
    `;

    // Foto que não carrega (link morto, hotlink bloqueado) some em silêncio.
    const foto = card.querySelector('img');
    if (foto) {
      foto.addEventListener('error', () => foto.classList.add('hidden'));
    }

    // Clique no card (mouse/toque). Botões, links e o menu de lojas têm ação própria.
    card.addEventListener('click', evento => {
      if (evento.target.closest('button, a, details, summary')) return;
      alternarPeca(categoriaAtiva, peca);
      render();
    });

    // Menu de lojas: abre e fecha sem selecionar a peça sem querer.
    const menuLojas = card.querySelector('details');
    if (menuLojas) {
      menuLojas.addEventListener('click', evento => evento.stopPropagation());
    }

    // Ações de quantidade (só existem nas categorias que aceitam várias peças).
    const acoes = {
      escolher: () => { alternarPeca(categoriaAtiva, peca); render(); },
      adicionar: () => { alternarPeca(categoriaAtiva, peca); render(); },
      mais: () => aumentarQtd(categoriaAtiva, peca),
      menos: () => diminuirQtd(categoriaAtiva, peca)
    };

    card.querySelectorAll('[data-acao]').forEach(botao => {
      botao.addEventListener('click', evento => {
        evento.stopPropagation();
        const acao = acoes[botao.dataset.acao];
        if (acao) {
          acao();
          refocarPeca(peca.id, botao.dataset.acao);
        }
      });
    });

    grid.appendChild(card);
  });
}

// ---------- 7) Resumo da montagem ----------
function renderResumo() {
  const lista = document.getElementById('resumo-lista');
  const totalEl = document.getElementById('total-preco');
  const progresso = document.getElementById('resumo-progresso');
  const contagem = document.getElementById('resumo-contagem');

  if (!lista || !totalEl) return;

  lista.innerHTML = '';

  const categoriasPreenchidas = CATEGORIAS.filter(
    cat => listaPecas(cat.id).length > 0
  );

  // Lista plana: uma linha por peça, mesmo quando a categoria tem várias.
  const escolhidas = CATEGORIAS.flatMap(cat =>
    listaPecas(cat.id).map(peca => ({ categoria: cat, peca }))
  );

  if (progresso) {
    progresso.innerHTML = CATEGORIAS.map(cat => {
      const preenchido = listaPecas(cat.id).length > 0;

      return `
        <button type="button" data-categoria="${escaparHTML(cat.id)}"
          title="${escaparHTML(cat.label)}"
          aria-label="Ir para ${escaparHTML(cat.label)}${preenchido ? ' (já tem peça escolhida)' : ''}"
          class="group flex-1 cursor-pointer rounded-sm py-2 transition-colors">
          <span class="block h-1.5 rounded-sm transition-colors ${
            preenchido
              ? 'bg-copper-light dark:bg-accent'
              : 'bg-line-light dark:bg-line group-hover:bg-copper-light/60 dark:group-hover:bg-accent/60'
          }"></span>
        </button>
      `;
    }).join('');

    // Clicar no segmento leva para a categoria daquela peça.
    progresso.querySelectorAll('button[data-categoria]').forEach(botao => {
      botao.addEventListener('click', () => {
        categoriaAtiva = botao.dataset.categoria;
        marcaAtiva = '';
        somenteImportadas = false;
        render();

        const grid = document.getElementById('pecas-grid');
        if (grid && typeof grid.scrollIntoView === 'function') {
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  if (contagem) {
    contagem.textContent = `${categoriasPreenchidas.length}/${CATEGORIAS.length}`;
  }

  if (!escolhidas.length) {
    lista.innerHTML = `
      <li class="text-muted-light dark:text-muted">
        Nenhuma peça escolhida ainda.
      </li>
    `;
  } else {
    escolhidas.forEach(({ categoria, peca }) => {
      const li = document.createElement('li');

      li.className = 'space-y-1';
      li.innerHTML = `
        <div class="flex items-center justify-between gap-3">
          <span class="text-muted-light dark:text-muted truncate min-w-0">${escaparHTML(peca.nome)}${qtdPeca(peca) > 1
            ? ` <span class="font-mono text-[11px] text-copper-light dark:text-accent">×${qtdPeca(peca)}</span>`
            : ''}</span>
          <span class="flex items-center gap-2 shrink-0">
            <span>${precoFmt(custoPeca(peca) * qtdPeca(peca))}</span>
            <button type="button"
              title="Remover"
              aria-label="Remover ${escaparHTML(peca.nome)}"
              class="remover-peca-btn text-muted-light dark:text-muted hover:text-red-700 dark:hover:text-red-400 transition-colors leading-none text-base">
              &times;
            </button>
          </span>
        </div>

        <details>
          <summary
            class="inline-flex cursor-pointer list-none items-center gap-1 text-[11px] text-muted-light dark:text-muted transition-colors hover:text-copper-light dark:hover:text-accent">
            onde comprar
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </summary>
          <ul class="mt-1.5 grid grid-cols-2 gap-1">
            ${linksPeca(peca).map(loja => loja.semLink ? `
              <li class="col-span-2 px-2 py-1 text-xs text-muted-light dark:text-muted">${escaparHTML(loja.nome)}</li>
              ` : `
              <li>
                <a href="${escaparHTML(loja.url)}" target="_blank" rel="noopener noreferrer"
                  class="block rounded px-2 py-1 text-[11px] text-ink-light dark:text-ink transition-colors hover:bg-bg-light dark:hover:bg-bg">
                  ${escaparHTML(loja.nome)}
                </a>
              </li>
              `).join('')}
          </ul>
        </details>
      `;

      li.querySelector('.remover-peca-btn').addEventListener(
        'click',
        () => removerPeca(categoria.id, peca.id)
      );

      lista.appendChild(li);
    });
  }

  const total = escolhidas.reduce(
    (soma, item) => soma + custoPeca(item.peca) * qtdPeca(item.peca),
    0
  );

  totalEl.textContent = precoFmt(total);

  // Barra do celular (só existe em buildpc.html)
  const barraContagem = document.getElementById('barra-contagem');
  const barraTotal = document.getElementById('barra-total');
  if (barraContagem) {
    barraContagem.textContent = `${categoriasPreenchidas.length} de ${CATEGORIAS.length} peças`;
    barraTotal.textContent = precoFmt(total);
  }

  const avisoImportada = document.getElementById('resumo-aviso');
  if (avisoImportada) {
    const temImportada = escolhidas.some(item => ehImportada(item.peca));
    const notas = [];
    if (temImportada) notas.push('Inclui peça importada: o total soma só o frete estimado cadastrado, sem imposto de importação e sem garantia no Brasil.');
    const folga = folgaFonteTexto();
    if (folga) notas.push(folga);
    avisoImportada.classList.toggle('hidden', !notas.length);
    avisoImportada.textContent = notas.join(' ');
  }
}

// ---------- 8) Avisos de compatibilidade ----------
function renderAvisos() {
  const box = document.getElementById('avisos');
  if (!box) return;

  const avisos = checarCompatibilidade();

  if (!avisos.length) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  box.classList.remove('hidden');
  box.innerHTML = avisos
    .map(aviso => `<p>${escaparHTML(aviso)}</p>`)
    .join('');
}

// ---------- 9) Gargalo: CPU mínima recomendada para cada faixa de placa ----------
//
// Comparar o índice da CPU com o da GPU não funciona: cada um é medido contra
// o topo da própria categoria, e dois "35" de escalas diferentes não se
// equilibram (Ryzen 3 4100 = 35 e RTX 5060 = 35 não formam um PC equilibrado).
// A conta parte de outro lugar: cada faixa de GPU tem uma CPU mínima para não
// limitar a placa em 1080p. O gargalo é o quanto a CPU escolhida fica abaixo
// dessa mínima — e não existe quando o limitante natural é a própria GPU.
// Continua sendo ESTIMATIVA: a medição real vem de benchmarks_pares.

const SEGMENTOS_MEDIDOR = 20;

const NIVEIS_GARGALO = [
  { ate: 8, rotulo: 'Equilibrado', detalhe: 'nenhuma peça segura a outra de forma perceptível' },
  { ate: 20, rotulo: 'Leve', detalhe: 'dificilmente se nota na prática' },
  { ate: 30, rotulo: 'Perceptível', detalhe: 'dá pra notar em jogos mais pesados' },
  { ate: Infinity, rotulo: 'Acentuado', detalhe: 'uma peça claramente segura a outra' }
];

function nivelGargalo(percentual) {
  return NIVEIS_GARGALO.find(nivel => percentual <= nivel.ate);
}

// CPU mínima (no índice do catálogo) para cada faixa de GPU, em 1080p.
// Calibrada para a escala atual: 4060 ≈ 23 pede um Ryzen 5 5600 (55);
// 4070 ≈ 38 pede 7600 (64); 5080 ≈ 77 pede 7800X3D (86); 5090 = 100 pede 9800X3D (98).
function cpuMinimaParaGpu(idxGpu) {
  const indice = Number(idxGpu) || 0;
  return Math.round(Math.min(99, Math.max(45, 45 + 0.53 * indice)));
}

// Aceita as duas grafias da coluna: desempenho_idx (atual) e desempenho
// (bancos criados antes da renomeação).
function indiceDesempenho(peca) {
  if (!peca) return null;
  const bruto = peca.desempenho_idx ?? peca.desempenho;
  const numero = Number(bruto);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

// null = falta uma das duas peças; { faltando: [...] } = falta índice;
// senão devolve os números do cálculo.
function calcularGargalo() {
  const cpu = build.cpu;
  const gpu = build['placa-video'];
  if (!cpu || !gpu) return null;

  const idxCpu = indiceDesempenho(cpu);
  const idxGpu = indiceDesempenho(gpu);
  const faltando = [];

  if (!idxCpu) faltando.push(cpu.nome);
  if (!idxGpu) faltando.push(gpu.nome);
  if (faltando.length) return { faltando };

  const cpuMinima = cpuMinimaParaGpu(idxGpu);
  const percentual = idxCpu >= cpuMinima
    ? 0
    : ((cpuMinima - idxCpu) / cpuMinima) * 100;

  return {
    cpu,
    gpu,
    idxCpu,
    idxGpu,
    cpuMinima,
    percentual,
    // Só existe gargalo quando a CPU fica devendo para a placa.
    limitante: percentual > 0 ? 'cpu' : null,
    nivel: nivelGargalo(percentual)
  };
}

function indiceFmt(valor) {
  return Number(valor).toFixed(1).replace('.', ',');
}

function medidorHTML(rotulo, indice, classeCor) {
  const cheios = Math.max(0, Math.min(
    SEGMENTOS_MEDIDOR,
    Math.round((indice / 100) * SEGMENTOS_MEDIDOR)
  ));
  const segmentos = [];

  for (let i = 0; i < SEGMENTOS_MEDIDOR; i += 1) {
    segmentos.push(
      `<span class="${i < cheios ? classeCor : 'bg-line-light/60 dark:bg-line/60'}"></span>`
    );
  }

  return `
    <div>
      <div class="flex justify-between gap-3 text-sm mb-2">
        <span class="truncate">${escaparHTML(rotulo)}</span>
        <span class="font-mono text-muted-light dark:text-muted shrink-0">${indiceFmt(indice)}</span>
      </div>
      <div class="meter-segmented h-2" role="img"
        aria-label="Índice de desempenho de ${escaparHTML(rotulo)}: ${indiceFmt(indice)} de 100">
        ${segmentos.join('')}
      </div>
    </div>
  `;
}

function textoNivel(dados) {
  return `Nível <strong class="text-ink-light dark:text-ink">${escaparHTML(dados.nivel.rotulo.toLowerCase())}</strong> — ${escaparHTML(dados.nivel.detalhe)}.`;
}

function percentualFmt(valor) {
  return Number(valor).toFixed(1).replace('.', ',') + '%';
}

// Sugestão de troca: CPU que resolve o déficit (mesmo socket, a mais barata)
// ou, quando está tudo bem, até qual placa a CPU escolhida aguenta.
function sugestaoHTML(dados) {
  const cpu = dados.cpu;
  const gpu = dados.gpu;

  if (dados.percentual > 8) {
    const placaMae = build['placa-mae'];
    const socketAlvo = (placaMae && placaMae.socket) || cpu.socket;

    const opcao = todasPecas
      .filter(peca => peca.categoria === 'cpu' && peca.id !== cpu.id)
      .filter(peca => !socketAlvo || peca.socket === socketAlvo)
      .filter(peca => (indiceDesempenho(peca) || 0) >= dados.cpuMinima)
      .sort((a, b) => (Number(a.preco) || 0) - (Number(b.preco) || 0))[0];

    if (!opcao) {
      return `
        <p class="mt-3 border-t border-line-light pt-3 text-xs text-muted-light dark:border-line dark:text-muted">
          Nenhum processador do catálogo com esse socket resolve —
          seria preciso trocar também a placa-mãe.
        </p>
      `;
    }

    return `
      <button type="button" data-sugerir="cpu" data-id="${escaparHTML(opcao.id)}"
        class="mt-3 block w-full rounded-md border border-line-light px-3 py-2 text-left transition-colors hover:border-copper-light dark:border-line dark:hover:border-accent">
        <span class="block text-xs text-muted-light dark:text-muted">Troca que resolve</span>
        <span class="font-semibold">${escaparHTML(opcao.nome)}</span>
        <span class="font-mono text-xs text-muted-light dark:text-muted">(${indiceFmt(indiceDesempenho(opcao))})</span>
        <span class="font-mono text-xs">· ${precoFmt(opcao.preco)}</span>
      </button>
    `;
  }

  if (dados.percentual === 0) {
    const caso = build.gabinete;
    const idxAtual = indiceDesempenho(gpu) || 0;

    const melhor = todasPecas
      .filter(peca => peca.categoria === 'placa-video' && peca.id !== gpu.id)
      .filter(peca => {
        const indice = indiceDesempenho(peca);
        if (!indice || indice <= idxAtual) return false;
        if (dados.idxCpu < cpuMinimaParaGpu(indice)) return false;

        // Se já há gabinete escolhido, respeita o comprimento máximo.
        if (caso && caso.gpu_max_mm && peca.comprimento_mm) {
          if (Number(peca.comprimento_mm) > Number(caso.gpu_max_mm)) return false;
        }

        return true;
      })
      .sort((a, b) => indiceDesempenho(b) - indiceDesempenho(a))[0];

    if (!melhor) return '';

    return `
      <button type="button" data-sugerir="placa-video" data-id="${escaparHTML(melhor.id)}"
        class="mt-3 block w-full rounded-md border border-line-light px-3 py-2 text-left transition-colors hover:border-copper-light dark:border-line dark:hover:border-accent">
        <span class="block text-xs text-muted-light dark:text-muted">Sua CPU leva até</span>
        <span class="font-semibold">${escaparHTML(melhor.nome)}</span>
        <span class="font-mono text-xs text-muted-light dark:text-muted">(${indiceFmt(indiceDesempenho(melhor))})</span>
        <span class="font-mono text-xs">· ${precoFmt(melhor.preco)}</span>
      </button>
    `;
  }

  return '';
}

async function renderGargalo() {
  const box = document.getElementById('gargalo-info');
  if (!box) return;

  const cpu = build.cpu;
  const gpu = build['placa-video'];
  const token = ++benchmarkConsultaAtual;

  if (!cpu || !gpu) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  const parAtual = `${cpu.id}|${gpu.id}`;

  if (parAtual !== benchmarkParAtual) {
    benchmarkParAtual = parAtual;
    filtrosBenchmark.jogo = '';
    filtrosBenchmark.resolucao = '';
    filtrosBenchmark.qualidade = '';
  }

  const dados = calcularGargalo();
  let conteudo = '';

  if (!dados) {
    conteudo = `
      <p class="text-sm text-muted-light dark:text-muted">
        Escolha um processador e uma placa de vídeo para ver o gargalo.
      </p>
    `;
  } else if (dados.faltando) {
    conteudo = `
      <p class="text-sm text-muted-light dark:text-muted leading-relaxed">
        Não dá para estimar: falta o índice de desempenho
        (<span class="font-mono">desempenho_idx</span>) de
        ${dados.faltando.map(escaparHTML).join(' e ')} no catálogo.
      </p>
    `;
  } else {
    conteudo = `
      <p class="text-sm text-muted-light dark:text-muted mb-4">
        ${escaparHTML(cpu.nome)} + ${escaparHTML(gpu.nome)}
      </p>

      <div class="space-y-4 mb-4">
        ${medidorHTML('Seu processador', dados.idxCpu, 'bg-copper-light dark:bg-accent')}
        ${medidorHTML('Sua placa de vídeo pede', dados.cpuMinima, 'bg-cyan-light dark:bg-cyan')}
      </div>

      ${dados.percentual === 0
        ? `<p class="text-sm mb-2">
            Suficiente para essa placa
            <strong class="font-mono">(${indiceFmt(dados.idxCpu)} ≥ ${indiceFmt(dados.cpuMinima)})</strong>
          </p>`
        : dados.percentual <= 8
          ? `<p class="text-sm mb-2">
              Quase no mínimo — equilíbrio aceitável
              <strong class="font-mono">(${indiceFmt(dados.idxCpu)} de ${indiceFmt(dados.cpuMinima)})</strong>
            </p>`
          : `<p class="text-sm mb-2">
              Déficit de <strong class="font-mono">${percentualFmt(dados.percentual)}</strong>
              — abaixo do mínimo
            </p>`}

      ${dados.percentual > 8
        ? `<p class="text-sm text-muted-light dark:text-muted leading-relaxed">
            ${textoNivel(dados)}
          </p>`
        : ''}

      ${sugestaoHTML(dados)}

      <p class="text-xs text-muted-light dark:text-muted leading-relaxed mt-4 pt-4 border-t border-line-light dark:border-line">
        Estimativa em 1080p. Muda por jogo e resolução.
      </p>
    `;
  }

  box.classList.remove('hidden');
  box.innerHTML = `
    <h3 class="font-display font-semibold text-base mb-3">Gargalo estimado</h3>
    ${conteudo}
    <div id="benchmark-painel" class="mt-5 pt-5 border-t border-line-light dark:border-line"></div>
  `;

  // Clicar na sugestão aplica a peça no build.
  box.querySelectorAll('[data-sugerir]').forEach(botao => {
    botao.addEventListener('click', () => {
      const categoria = botao.dataset.sugerir;
      const peca = todasPecas.find(item => item.id === botao.dataset.id);
      if (!peca) return;

      build[categoria] = peca;
      quantidades[peca.id] = 1;
      render();
    });
  });

  const alvo = box.querySelector('#benchmark-painel');
  if (alvo) await renderBenchmarks(alvo, cpu, gpu, token);
}

// Benchmarks medidos do par (tabela benchmarks_pares). É opcional: sem dados,
// a estimativa acima continua sendo o que a tela mostra.
async function renderBenchmarks(alvo, cpu, gpu, token) {
  const titulo = `
    <h4 class="font-display font-semibold text-sm mb-2">Benchmark medido do par</h4>
  `;

  const semBenchmark = `
    ${titulo}
    <p class="text-xs text-muted-light dark:text-muted leading-relaxed">
      Sem benchmark cadastrado para esta combinação exata de CPU + GPU.
      A estimativa acima continua valendo.
    </p>
  `;

  if (
    fonteDados.origem !== 'banco' ||
    typeof buscarBenchmarksDoPar !== 'function' ||
    !cpu.id ||
    !gpu.id
  ) {
    alvo.innerHTML = semBenchmark;
    return;
  }

  const chaveCache = `${cpu.id}|${gpu.id}`;
  let benchmarks = cacheBenchmarks.get(chaveCache);

  if (!benchmarks) {
    alvo.innerHTML = `
      ${titulo}
      <p class="text-sm text-muted-light dark:text-muted">Consultando benchmarks...</p>
    `;
  }

  try {
    if (!benchmarks) {
      benchmarks = await buscarBenchmarksDoPar(cpu.id, gpu.id);
      cacheBenchmarks.set(chaveCache, benchmarks);
    }

    // Ignora resposta antiga se o usuário trocou as peças.
    if (token !== benchmarkConsultaAtual) return;

    if (!Array.isArray(benchmarks) || benchmarks.length === 0) {
      alvo.innerHTML = semBenchmark;
      return;
    }

    const opcoes = (lista, campo) =>
      [...new Set(
        lista.map(item => item[campo]).filter(
          valor => valor !== null && valor !== undefined && valor !== ''
        )
      )].sort((a, b) =>
        String(a).localeCompare(String(b), 'pt-BR')
      );

    const jogos = opcoes(benchmarks, 'jogo');

    if (!jogos.includes(filtrosBenchmark.jogo)) {
      filtrosBenchmark.jogo = '';
    }

    const porJogo = benchmarks.filter(item =>
      !filtrosBenchmark.jogo ||
      item.jogo === filtrosBenchmark.jogo
    );

    const resolucoes = opcoes(porJogo, 'resolucao');

    if (!resolucoes.includes(filtrosBenchmark.resolucao)) {
      filtrosBenchmark.resolucao = '';
    }

    const porResolucao = porJogo.filter(item =>
      !filtrosBenchmark.resolucao ||
      item.resolucao === filtrosBenchmark.resolucao
    );

    const qualidades = opcoes(porResolucao, 'qualidade');

    if (!qualidades.includes(filtrosBenchmark.qualidade)) {
      filtrosBenchmark.qualidade = '';
    }

    const resultados = porResolucao.filter(item =>
      !filtrosBenchmark.qualidade ||
      item.qualidade === filtrosBenchmark.qualidade
    );

    function criarFiltro(id, tituloFiltro, valores, selecionado) {
      return `
        <label class="block text-xs">
          <span class="block mb-1 text-muted-light dark:text-muted">${tituloFiltro}</span>
          <select
            id="${id}"
            class="w-full border border-field-light dark:border-field rounded-md p-2 bg-panel-light dark:bg-panel text-xs"
          >
            <option value="">Todas</option>
            ${valores.map(valor => `
              <option value="${escaparHTML(valor)}"
                ${valor === selecionado ? 'selected' : ''}>
                ${escaparHTML(valor)}
              </option>
            `).join('')}
          </select>
        </label>
      `;
    }

    alvo.innerHTML = `
      ${titulo}

      <div class="space-y-3 mb-5">
        ${criarFiltro('benchmark-jogo', 'Jogo', jogos, filtrosBenchmark.jogo)}
        ${criarFiltro('benchmark-resolucao', 'Resolução', resolucoes, filtrosBenchmark.resolucao)}
        ${criarFiltro('benchmark-qualidade', 'Qualidade', qualidades, filtrosBenchmark.qualidade)}
      </div>

      <div class="space-y-4">
        ${resultados.length ? resultados.map(item => {
          const fpsMedio = Number(item.fps_medio);
          const fpsLow = item.fps_1_low == null
            ? null
            : Number(item.fps_1_low);

          const fpsValido = Number.isFinite(fpsMedio) && fpsMedio > 0;
          const lowValido = fpsLow !== null &&
            Number.isFinite(fpsLow) &&
            fpsLow > 0;

          const limitante =
            item.limitante_medido === 'cpu' ? 'CPU' :
            item.limitante_medido === 'gpu' ? 'GPU' :
            'Não informado pela fonte';

          const dataTeste = item.data_teste
            ? String(item.data_teste).split('-').reverse().join('/')
            : 'Não informada';

          const fonte = item.fonte_url
            ? `<a class="underline" href="${escaparHTML(item.fonte_url)}" target="_blank" rel="noopener noreferrer">${escaparHTML(item.fonte)}</a>`
            : escaparHTML(item.fonte);

          return `
            <article class="border border-line-light dark:border-line rounded-lg p-4">
              <h5 class="font-semibold mb-2">
                ${escaparHTML(item.jogo)}
              </h5>

              <p class="text-xs text-muted-light dark:text-muted mb-2">
                ${escaparHTML(item.resolucao)} · ${escaparHTML(item.qualidade)}
              </p>

              <p class="text-sm mb-1">
                FPS médio:
                <strong class="font-mono">
                  ${fpsValido ? fpsMedio.toFixed(1) : 'Dado inválido'}
                </strong>
              </p>

              ${lowValido ? `
                <p class="text-sm mb-2">
                  1% low:
                  <strong class="font-mono">${fpsLow.toFixed(1)}</strong>
                </p>
              ` : ''}

              <p class="text-sm mb-2">
                Limitante medido:
                <strong>${limitante}</strong>
              </p>

              <p class="text-xs mb-1">
                Fonte: ${fonte}
              </p>

              <p class="text-xs mb-1">
                Teste: ${escaparHTML(dataTeste)}
              </p>

              <p class="text-xs text-muted-light dark:text-muted">
                ${escaparHTML(item.metodologia)}
              </p>
            </article>
          `;
        }).join('') : `
          <p class="text-xs text-muted-light dark:text-muted">
            Sem benchmark para os filtros selecionados.
          </p>
        `}
      </div>
    `;

    const filtroJogo = document.getElementById('benchmark-jogo');
    const filtroResolucao = document.getElementById('benchmark-resolucao');
    const filtroQualidade = document.getElementById('benchmark-qualidade');

    if (filtroJogo) {
      filtroJogo.addEventListener('change', event => {
        filtrosBenchmark.jogo = event.target.value;
        filtrosBenchmark.resolucao = '';
        filtrosBenchmark.qualidade = '';
        renderGargalo();
      });
    }

    if (filtroResolucao) {
      filtroResolucao.addEventListener('change', event => {
        filtrosBenchmark.resolucao = event.target.value;
        filtrosBenchmark.qualidade = '';
        renderGargalo();
      });
    }

    if (filtroQualidade) {
      filtroQualidade.addEventListener('change', event => {
        filtrosBenchmark.qualidade = event.target.value;
        renderGargalo();
      });
    }

  } catch (erro) {
    if (token !== benchmarkConsultaAtual) return;

    console.error('Erro ao carregar benchmarks:', erro);

    alvo.innerHTML = `
      ${titulo}
      <p class="text-xs text-muted-light dark:text-muted leading-relaxed">
        Não foi possível consultar o banco de benchmarks agora
        (${escaparHTML(erro?.message || 'falha de conexão')}).
        A estimativa acima continua valendo.
      </p>
    `;
  }
}

// ---------- 10) Renderização geral ----------
function render() {
  renderCategorias();
  renderDica();
  renderPecas();
  renderResumo();
  renderAvisos();

  // Estimativa de gargalo do par + benchmark medido (quando existir).
  renderGargalo();
}

// ---------- 10b) Busca: campo de texto ligado à grade ----------
// Só registra os eventos. Ao digitar, redesenha apenas a grade — assim o
// cursor não sai do campo e a página não pisca.
(function ligarBusca() {
  const campo = document.getElementById('busca');
  const limpar = document.getElementById('limpar-busca');

  if (campo) {
    campo.addEventListener('input', () => {
      buscaAtual = campo.value;
      if (limpar) limpar.classList.toggle('hidden', !campo.value);
      renderPecas();
    });
  }

  if (limpar) {
    limpar.addEventListener('click', () => {
      if (campo) {
        campo.value = '';
        campo.focus();
      }
      buscaAtual = '';
      limpar.classList.add('hidden');
      renderPecas();
    });
  }
})();

// ---------- 10c) Modelos, orçamento, salvar e compartilhar ----------

// Orçamentos usados nos modelos prontos.
const MODELOS = [
  { nome: '1080p entrada', valor: 4000 },
  { nome: '1080p high', valor: 6000 },
  { nome: '1440p', valor: 9000 },
  { nome: '4K', valor: 16000 },
  { nome: 'Top', valor: 25000 },
  { nome: 'Sem limite', valor: 40000 }
];

const CHAVE_BUILDS = 'pcbuild:builds';

function maisBarato(lista, filtro) {
  let escolhido = null;

  lista.forEach(item => {
    if (filtro && !filtro(item)) return;
    if (!escolhido || Number(item.preco) < Number(escolhido.preco)) escolhido = item;
  });

  return escolhido;
}

function cabeNoGabinete(gabinete, gpu, placaMae) {  if (gabinete.gpu_max_mm && gpu.comprimento_mm) {
    if (Number(gpu.comprimento_mm) > Number(gabinete.gpu_max_mm)) return false;
  }

  if (placaMae && placaMae.formato) {
    const formatos = String(gabinete.formatos_compativeis || gabinete.formato || '').toLowerCase();
    if (formatos && !formatos.includes(String(placaMae.formato).toLowerCase())) return false;
  }

  return true;
}

// Capacidade em GB lida do nome ("16GB (2x8)" -> 16, "1TB" -> 1024).
function capacidadeGB(peca) {
  const achado = String(peca.nome || '').match(/(\d+)\s*(GB|TB)/i);
  if (!achado) return 0;

  const valor = Number(achado[1]);
  return /TB/i.test(achado[2]) ? valor * 1024 : valor;
}

// Potência em watts. Quando a coluna está vazia no catálogo, estima pelo
// índice — hoje 26 das 45 placas não têm potencia_w preenchida.
function potenciaEstimada(peca) {
  const informada = Number(peca.potencia_w);
  if (Number.isFinite(informada) && informada > 0) return informada;

  const idx = indiceDesempenho(peca) || 0;

  if (peca.categoria === 'placa-video') {
    if (idx >= 95) return 575;
    if (idx >= 85) return 400;
    if (idx >= 75) return 320;
    if (idx >= 60) return 250;
    if (idx >= 45) return 200;
    if (idx >= 30) return 160;
    if (idx >= 20) return 120;
    return 100;
  }

  if (idx >= 85) return 170;
  if (idx >= 70) return 125;
  if (idx >= 45) return 90;
  return 65;
}

// Procura o conjunto que entrega a melhor placa de vídeo dentro do orçamento,
// respeitando socket, tipo de memória, tamanho do gabinete e folga da fonte.
// Tem piso de qualidade: 16GB de RAM, 480GB de SSD e fonte com folga real.
function montarComOrcamento(orcamento) {
  const porCategoria = categoria => todasPecas.filter(
    peca => peca.categoria === categoria && Number(peca.preco) > 0 &&
      (incluirImportadas() || !ehImportada(peca))
  );

  const cpus = porCategoria('cpu');
  const placas = porCategoria('placa-mae');
  const memorias = porCategoria('memoria').filter(m => capacidadeGB(m) >= 16);
  const gpus = porCategoria('placa-video');
  const ssds = porCategoria('armazenamento').filter(s => capacidadeGB(s) >= 480);
  const fontes = porCategoria('fonte');
  const gabinetes = porCategoria('gabinete');

  let melhor = null;

  gpus.forEach(gpu => {
    const idxGpu = indiceDesempenho(gpu);
    if (!idxGpu) return;

    // O teto do orçamento já limita a placa; aqui só evitamos que ela
    // consuma tudo e sobre pouco para o resto (com pisos de qualidade abaixo).
    if (Number(gpu.preco) > orcamento * 0.85) return;

    cpus.forEach(cpu => {
      const idxCpu = indiceDesempenho(cpu);
      const exigida = Math.min(99, cpuMinimaParaGpu(idxGpu) + 3);
      if (!idxCpu || idxCpu < exigida) return;

      const placaMae = maisBarato(placas, p => p.socket === cpu.socket && p.tipo_memoria);
      if (!placaMae) return;

      const memoria = maisBarato(memorias, m => m.tipo_memoria === placaMae.tipo_memoria);
      if (!memoria) return;

      const gabinete = maisBarato(gabinetes, g => cabeNoGabinete(g, gpu, placaMae));
      if (!gabinete) return;

      const consumo = potenciaEstimada(cpu) + potenciaEstimada(gpu);
      const fonte = maisBarato(fontes, f => Number(f.potencia_w) >= consumo * 1.2 + 100);
      if (!fonte) return;

      const ssd = maisBarato(ssds);
      if (!ssd) return;

      const pecas = {
        cpu,
        'placa-mae': placaMae,
        memoria,
        'placa-video': gpu,
        armazenamento: ssd,
        gabinete,
        fonte
      };

      const total = Object.values(pecas).reduce((soma, p) => soma + custoPeca(p), 0);
      if (total > orcamento) return;

      if (!melhor || idxGpu > melhor.idxGpu || (idxGpu === melhor.idxGpu && total < melhor.total)) {
        melhor = { idxGpu, total, pecas };
      }
    });
  });

  return melhor;
}

function avisarOrcamento(texto) {
  const el = document.getElementById('orcamento-msg');
  if (el) el.textContent = texto;
}

function aplicarBuild(pecas) {
  Object.keys(build).forEach(chave => delete build[chave]);
  Object.keys(quantidades).forEach(chave => delete quantidades[chave]);

  Object.entries(pecas).forEach(([categoria, peca]) => {
    build[categoria] = peca;
    quantidades[peca.id] = 1;
  });

  categoriaAtiva = 'cpu';
  marcaAtiva = '';
  somenteImportadas = false;
  render();
}

function montarPara(valor) {
  const resultado = montarComOrcamento(valor);

  if (!resultado) {
    avisarOrcamento(`Não achei combinação compatível até ${precoFmt(valor)}.`);
    return;
  }

  aplicarBuild(resultado.pecas);
  avisarOrcamento(`Montado por ${precoFmt(resultado.total)}.`);
}

// ---------- Painel do build no celular ----------
(function ligarPainelCelular() {
  const painel = document.getElementById('painel-build');
  const abrir = document.getElementById('abrir-painel');
  const fechar = document.getElementById('fechar-painel');
  if (!painel || !abrir || !fechar) return;

  function definir(aberto) {
    painel.classList.toggle('aberto', aberto);
    document.body.classList.toggle('painel-aberto', aberto);
    abrir.setAttribute('aria-expanded', String(aberto));
    (aberto ? fechar : abrir).focus();
  }

  abrir.addEventListener('click', () => definir(true));
  fechar.addEventListener('click', () => definir(false));
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && painel.classList.contains('aberto')) definir(false);
  });
  // Ao ampliar a janela (ou girar o celular) o painel volta ao layout normal.
  window.matchMedia('(min-width: 1024px)').addEventListener('change', evento => {
    if (evento.matches) {
      painel.classList.remove('aberto');
      document.body.classList.remove('painel-aberto');
      abrir.setAttribute('aria-expanded', 'false');
    }
  });
})();

// ---------- salvar / compartilhar ----------

function serializarBuild() {
  const dados = {};

  CATEGORIAS.forEach(cat => {
    const pecas = listaPecas(cat.id);
    if (!pecas.length) return;
    dados[cat.id] = pecas.map(peca => ({ id: peca.id, qtd: qtdPeca(peca) }));
  });

  return dados;
}

function aplicarDados(dados) {
  Object.keys(build).forEach(chave => delete build[chave]);
  Object.keys(quantidades).forEach(chave => delete quantidades[chave]);

  CATEGORIAS.forEach(cat => {
    const itens = dados[cat.id] || [];
    const pecas = itens
      .map(item => todasPecas.find(p => p.id === item.id))
      .filter(Boolean);

    if (!pecas.length) return;

    build[cat.id] = pecas.length === 1 ? pecas[0] : pecas;

    pecas.forEach(peca => {
      const item = itens.find(i => i.id === peca.id);
      quantidades[peca.id] = Math.max(1, Number(item && item.qtd) || 1);
    });
  });

  render();
}

function buildsSalvos() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_BUILDS)) || [];
  } catch {
    return [];
  }
}

// Link compacto: #c=cpu:ID:1;memoria:ID:2,ID:1 (sem base64; ids são uuid, sem ':' ';' ',')
function codigoCompartilhar(dados) {
  return Object.keys(dados)
    .map(cat => cat + ':' + dados[cat].map(i => `${i.id}:${i.qtd}`).join(','))
    .join(';');
}

function urlCompartilhar(dados) {
  return `${location.href.split('#')[0]}#c=${codigoCompartilhar(dados)}`;
}

function lerCodigoCompacto(texto) {
  const dados = {};
  texto.split(';').forEach(trecho => {
    const corte = trecho.indexOf(':');
    const cat = trecho.slice(0, corte);
    if (corte < 1 || !CATEGORIAS.some(c => c.id === cat)) return;
    dados[cat] = trecho.slice(corte + 1).split(',').map(par => {
      const [id, qtd] = par.split(':');
      return { id, qtd: Number(qtd) || 1 };
    }).filter(i => i.id);
  });
  return dados;
}

function abrirDialogo(dialogo) {
  if (typeof dialogo.showModal === 'function') dialogo.showModal();
  else dialogo.setAttribute('open', '');
}

function fecharDialogo(dialogo) {
  if (typeof dialogo.close === 'function') dialogo.close();
  else dialogo.removeAttribute('open');
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

function salvarBuild() {
  const dados = serializarBuild();

  if (!Object.keys(dados).length) {
    avisarOrcamento('Monte alguma peça antes de salvar.');
    return;
  }

  const dialogo = document.getElementById('dlg-build');
  if (!dialogo) return;

  const formNome = document.getElementById('dlg-form-nome');
  const linkWrap = document.getElementById('dlg-link-wrap');
  const campoNome = document.getElementById('dlg-nome');
  const campoLink = document.getElementById('dlg-link');
  const copiado = document.getElementById('dlg-copiado');

  formNome.classList.remove('hidden');
  linkWrap.classList.add('hidden');
  copiado.textContent = '';
  campoNome.value = `Build ${new Date().toLocaleDateString('pt-BR')}`;
  abrirDialogo(dialogo);
  campoNome.focus();
  campoNome.select();

  formNome.onsubmit = (evento) => {
    evento.preventDefault();
    const nome = campoNome.value.trim();
    if (!nome) { campoNome.focus(); return; }

    const lista = buildsSalvos();
    lista.unshift({ nome, data: new Date().toISOString(), dados });
    try {
      localStorage.setItem(CHAVE_BUILDS, JSON.stringify(lista.slice(0, 20)));
    } catch {
      avisarOrcamento('Não deu pra salvar neste navegador (armazenamento bloqueado).');
      fecharDialogo(dialogo);
      return;
    }
    renderBuildsSalvos();
    avisarOrcamento('Build salvo neste navegador.');

    campoLink.value = urlCompartilhar(dados);
    formNome.classList.add('hidden');
    linkWrap.classList.remove('hidden');
    campoLink.focus();
    campoLink.select();
  };

  document.getElementById('dlg-cancelar').onclick = () => fecharDialogo(dialogo);
  document.getElementById('dlg-fechar').onclick = () => fecharDialogo(dialogo);
  document.getElementById('dlg-copiar').onclick = async () => {
    campoLink.select();
    copiado.textContent = (await copiarTexto(campoLink.value))
      ? 'Link copiado.'
      : 'Não deu pra copiar sozinho: o link já está selecionado, use Ctrl+C.';
  };
}

function renderBuildsSalvos() {
  const select = document.getElementById('builds-salvos');
  if (!select) return;

  const lista = buildsSalvos();

  select.innerHTML = '<option value="">Builds salvos…</option>' +
    lista.map((item, indice) => `<option value="${indice}">${escaparHTML(item.nome)}</option>`).join('');
}

async function compartilharBuild() {
  const dados = serializarBuild();

  if (!Object.keys(dados).length) {
    avisarOrcamento('Monte alguma peça antes de compartilhar.');
    return;
  }

  const url = urlCompartilhar(dados);

  if (await copiarTexto(url)) {
    avisarOrcamento('Link copiado. Quem abrir vê este mesmo build.');
  } else {
    prompt('Copie o link:', url);
  }
}

// Link compartilhado: o build inteiro viaja na URL (sem banco).
// #c=... é o formato atual; #b=... (base64) segue funcionando para links antigos.
function lerLinkCompartilhado() {
  const compacto = location.hash.match(/^#c=(.+)$/);
  const antigo = location.hash.match(/^#b=(.+)$/);
  if (!compacto && !antigo) return false;

  try {
    const dados = compacto
      ? lerCodigoCompacto(decodeURIComponent(compacto[1]))
      : JSON.parse(decodeURIComponent(atob(antigo[1])));
    if (!Object.keys(dados).length) throw new Error('vazio');
    aplicarDados(dados);
    avisarOrcamento('Build aberto a partir de um link compartilhado.');
    return true;
  } catch (erro) {
    console.warn('Link de build inválido.', erro);
    avisarOrcamento('Esse link de build não é válido.');
    return false;
  }
}

function renderModelos() {
  const wrap = document.getElementById('modelos');
  if (!wrap) return;

  wrap.innerHTML = MODELOS.map(modelo => `
    <button type="button" data-valor="${modelo.valor}"
      class="rounded-full border border-line-light dark:border-line px-3 py-1.5 text-muted-light dark:text-muted transition-colors hover:border-copper-light dark:hover:border-accent hover:text-ink-light dark:hover:text-ink">
      ${modelo.nome} · ${precoFmt(modelo.valor)}
    </button>
  `).join('');

  wrap.querySelectorAll('button').forEach(botao => {
    botao.addEventListener('click', () => montarPara(Number(botao.dataset.valor)));
  });
}

(function ligarFerramentas() {
  const btnOrcamento = document.getElementById('btn-orcamento');
  const campo = document.getElementById('orcamento');

  if (btnOrcamento) {
    btnOrcamento.addEventListener('click', () => {
      const valor = Number(campo && campo.value);
      if (!valor || valor < 500) {
        avisarOrcamento('Digite um orçamento válido.');
        return;
      }
      montarPara(valor);
    });
  }

  const btnSalvar = document.getElementById('btn-salvar');
  if (btnSalvar) btnSalvar.addEventListener('click', salvarBuild);

  const btnCompartilhar = document.getElementById('btn-compartilhar');
  if (btnCompartilhar) btnCompartilhar.addEventListener('click', compartilharBuild);

  const select = document.getElementById('builds-salvos');
  if (select) {
    select.addEventListener('change', () => {
      if (select.value === '') return;

      const item = buildsSalvos()[Number(select.value)];
      if (item) aplicarDados(item.dados);
    });
  }
})();

// ---------- 11) Inicialização ----------
(async function init() {
  todasPecas = await carregarPecas();
  renderAvisoBanco();
  render();
  renderModelos();
  renderBuildsSalvos();
  lerLinkCompartilhado();
})();
