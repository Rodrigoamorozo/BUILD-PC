// build.js
// Tela de montagem: mostra as peças por categoria, guarda o que foi
// escolhido, calcula o total e avisa sobre incompatibilidades.

// ---------- 1) Categorias que existem no site ----------
const CATEGORIAS = [
  { id: 'cpu',           label: 'Processador' },
  { id: 'placa-mae',     label: 'Placa-mãe' },
  { id: 'memoria',       label: 'Memória' },
  { id: 'placa-video',   label: 'Placa de vídeo' },
  { id: 'armazenamento', label: 'Armazenamento' },
  { id: 'fonte',         label: 'Fonte' },
  { id: 'gabinete',      label: 'Gabinete' },
];

// ---------- 1b) Dica por categoria ----------
// Texto curto mostrado abaixo das abas, pra guiar quem ainda não sabe
// o que olhar em cada peça.
const DICAS_CATEGORIA = {
  'cpu':           'Pense no que você vai fazer com o PC. O socket dele define quais placas-mãe combinam.',
  'placa-mae':     'Precisa ter o mesmo socket do processador e suportar o tipo de memória escolhido.',
  'memoria':       'Confira se o tipo (DDR4 ou DDR5) bate com o que a placa-mãe aceita.',
  'placa-video':   'Escolha equilibrada com o processador — uma muito mais forte que a outra desperdiça desempenho.',
  'armazenamento': 'SSD NVMe é bem mais rápido que HD; HD ainda compensa se você só precisa de espaço barato.',
  'fonte':         'Precisa dar conta da potência somada de todas as peças, com folga.',
  'gabinete':      'Confira se comporta o tamanho da sua placa de vídeo e o formato da placa-mãe.',
};

// ---------- 2) Peças de exemplo ----------
// Isso é só um mock pra tela funcionar antes de você cadastrar peças
// reais no Supabase. Cada peça tem os campos que a tabela "pecas" vai ter.
// Quando o Supabase estiver configurado (URL + chave em supabase.js),
// troque MOCK_PECAS por uma chamada real (veja carregarPecas() abaixo).
//
// "desempenho_idx" (só em CPU e placa de vídeo) é o índice de desempenho
// em jogos a 1080p, numa escala de 0 a 100 onde a peça mais rápida do
// momento fica em 100 — mesma metodologia da hierarquia de CPU e de GPU
// da Tom's Hardware (jun/2026). Peças marcadas "sourced" abaixo usam o
// número publicado; peças marcadas "estimado" não apareciam na tabela
// (SKU não testado ou placa antiga fora do levantamento) e tiveram o
// índice interpolado a partir de peças vizinhas — não é uma medição.
// Ao cadastrar peças reais, atualize com uma hierarquia de benchmark atual.
const MOCK_PECAS = [
  { id: 'cpu-1', categoria: 'cpu', nome: 'Ryzen 5 7600', marca: 'AMD', preco: 1299, socket: 'AM5', potencia_w: 65, desempenho_idx: 64 }, // estimado a partir do Ryzen 5 7600X (67.3 sourced)
  { id: 'cpu-2', categoria: 'cpu', nome: 'Core i5-13400F', marca: 'Intel', preco: 1099, socket: 'LGA1700', potencia_w: 65, desempenho_idx: 61 }, // estimado — i5 13ª ger. não-K sem linha própria na tabela; interpolado entre i5-12600K (60.8) e i5-13600K (70.9)
  { id: 'cpu-3', categoria: 'cpu', nome: 'Ryzen 7 7800X3D', marca: 'AMD', preco: 2599, socket: 'AM5', potencia_w: 120, desempenho_idx: 85.6 }, // sourced — hierarquia de CPU, jun/2026
  { id: 'cpu-4', categoria: 'cpu', nome: 'Ryzen 5 5600', marca: 'AMD', preco: 699, socket: 'AM4', potencia_w: 65, desempenho_idx: 52 }, // estimado — Zen 3, fora da tabela atual (só cobre AM5/Intel recentes); múltiplas fontes apontam o 7600X ~16–36% mais rápido que o 5600X em jogos, aplicado sobre o 7600X sourced (67.3)

  { id: 'mb-1', categoria: 'placa-mae', nome: 'B650M', marca: 'Gigabyte', preco: 899,  socket: 'AM5',    tipo_memoria: 'DDR5' },
  { id: 'mb-2', categoria: 'placa-mae', nome: 'B760M', marca: 'ASUS',     preco: 799,  socket: 'LGA1700', tipo_memoria: 'DDR4' },
  { id: 'mb-3', categoria: 'placa-mae', nome: 'X670E',  marca: 'MSI',     preco: 1899, socket: 'AM5',    tipo_memoria: 'DDR5' },
  { id: 'mb-4', categoria: 'placa-mae', nome: 'A520M',  marca: 'ASRock',  preco: 449,  socket: 'AM4',    tipo_memoria: 'DDR4' },

  { id: 'ram-1', categoria: 'memoria', nome: '16GB (2x8) 5600MHz', marca: 'Kingston', preco: 349, tipo_memoria: 'DDR5' },
  { id: 'ram-2', categoria: 'memoria', nome: '16GB (2x8) 3200MHz', marca: 'Corsair',  preco: 279, tipo_memoria: 'DDR4' },
  { id: 'ram-3', categoria: 'memoria', nome: '32GB (2x16) 6000MHz', marca: 'Kingston', preco: 799, tipo_memoria: 'DDR5' },

  { id: 'gpu-1', categoria: 'placa-video', nome: 'RTX 4060', marca: 'NVIDIA', preco: 2199, potencia_w: 115, desempenho_idx: 35.1 }, // sourced — hierarquia de GPU, 1080p, jun/2026
  { id: 'gpu-2', categoria: 'placa-video', nome: 'RTX 4070', marca: 'NVIDIA', preco: 3699, potencia_w: 200, desempenho_idx: 54.7 }, // sourced
  { id: 'gpu-3', categoria: 'placa-video', nome: 'RX 7600',  marca: 'AMD',    preco: 1899, potencia_w: 165, desempenho_idx: 34.3 }, // sourced
  { id: 'gpu-4', categoria: 'placa-video', nome: 'RTX 5090',  marca: 'NVIDIA', preco: 1899, potencia_w: 580, desempenho_idx: 100 }, // sourced — referência (100) da hierarquia
  { id: 'gpu-5', categoria: 'placa-video', nome: 'RX 580',  marca: 'AMD', preco: 1899, potencia_w: 135, desempenho_idx: 10 }, // estimado — placa de 2017, fora da tabela atual
  { id: 'gpu-6', categoria: 'placa-video', nome: 'RTX 3050 TI',  marca: 'NVIDIA', preco: 1899, potencia_w: 35, desempenho_idx: 13 }, // estimado — chip de notebook, sem linha desktop na tabela

  { id: 'ssd-1', categoria: 'armazenamento', nome: 'SSD NVMe 500GB', marca: 'Kingston', preco: 249, potencia_w: 6 },
  { id: 'ssd-2', categoria: 'armazenamento', nome: 'SSD NVMe 1TB',   marca: 'WD',       preco: 449, potencia_w: 6 },
  { id: 'hd-1',  categoria: 'armazenamento', nome: 'HD 1TB 7200RPM', marca: 'Seagate',  preco: 279, potencia_w: 8 },

  { id: 'psu-1', categoria: 'fonte', nome: '550W 80+ Bronze', marca: 'Corsair', preco: 399, potencia_w: 550 },
  { id: 'psu-2', categoria: 'fonte', nome: '650W 80+ Bronze', marca: 'EVGA',    preco: 499, potencia_w: 650 },
  { id: 'psu-3', categoria: 'fonte', nome: '750W 80+ Gold',   marca: 'Corsair', preco: 699, potencia_w: 750 },

  { id: 'case-1', categoria: 'gabinete', nome: 'NZXT H510', marca: 'NZXT', preco: 549 },
  { id: 'case-2', categoria: 'gabinete', nome: 'Lancer',    marca: 'Gamdias', preco: 349 },
];

// ---------- 3) Estado da montagem (o que foi escolhido) ----------
const build = {}; // ex: { cpu: {...peca}, memoria: {...peca} }
let categoriaAtiva = CATEGORIAS[0].id;
let todasPecas = [];

// Formata preço em reais, usando o Intl.NumberFormat do navegador
// (evita depender de formatação manual pra moeda/casas decimais).
const formatoPreco = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
function precoFmt(valor) {
  return formatoPreco.format(valor).replace(' ', '\u00A0'); // espaço sem quebra entre "R$" e o valor
}

// ---------- 4) Carregar peças (Supabase se configurado, senão mock) ----------
async function carregarPecas() {
  const configurado =
    typeof SUPABASE_URL !== 'undefined' &&
    SUPABASE_URL !== 'COLE_AQUI_SUA_PROJECT_URL';

  if (configurado && typeof buscarPecas === 'function') {
    const dados = await buscarPecas();
    if (dados && dados.length) return dados;
  }
  return MOCK_PECAS; // fallback pra tela nunca ficar vazia
}

// ---------- 5) Regras de compatibilidade ----------
function checarCompatibilidade() {
  const avisos = [];
  const { cpu, ['placa-mae']: placaMae, memoria, fonte } = build;

  if (cpu && placaMae && cpu.socket !== placaMae.socket) {
    avisos.push(`${cpu.nome} usa o socket ${cpu.socket}, mas a ${placaMae.nome} é ${placaMae.socket} — troque uma das duas.`);
  }
  if (placaMae && memoria && placaMae.tipo_memoria !== memoria.tipo_memoria) {
    avisos.push(`A memória é ${memoria.tipo_memoria}, mas a placa-mãe só aceita ${placaMae.tipo_memoria} — escolha uma memória ${placaMae.tipo_memoria}.`);
  }
  if (fonte) {
    const consumoEstimado = Object.values(build).reduce((soma, p) => soma + (p.potencia_w || 0), 0) - (fonte.potencia_w || 0);
    if (consumoEstimado > fonte.potencia_w * 0.8) {
      avisos.push(`A fonte de ${fonte.potencia_w}W pode ser justa para o consumo estimado (${consumoEstimado}W) — considere uma fonte mais potente.`);
    }
  }
  return avisos;
}

// ---------- 5b) Estimativa de gargalo (CPU x placa de vídeo) ----------
// Compara o índice de desempenho das duas peças escolhidas. Não devolve
// um "gargalo de X%" como se fosse medição exata — devolve a diferença
// entre os índices e uma faixa de gravidade, do mesmo jeito que
// calculadoras de gargalo sérias fazem (a diferença muda por jogo,
// resolução e configuração gráfica; isso aqui é só uma estimativa).
function calcularGargalo(cpu, gpu) {
  if (!cpu || !gpu || typeof cpu.desempenho_idx !== 'number' || typeof gpu.desempenho_idx !== 'number') {
    return null;
  }
  const maior = Math.max(cpu.desempenho_idx, gpu.desempenho_idx);
  const menor = Math.min(cpu.desempenho_idx, gpu.desempenho_idx);
  // Diferença relativa (não em pontos soltos): quanto do desempenho da
  // peça mais forte fica "desperdiçado" esperando a mais fraca.
  const diferenca = Math.round(((maior - menor) / maior) * 100);
  const limitante = cpu.desempenho_idx < gpu.desempenho_idx ? 'processador' : 'placa de vídeo';
  let faixa;
  if (diferenca < 8) faixa = { rotulo: 'Equilibrado', cor: 'cyan' };
  else if (diferenca < 20) faixa = { rotulo: 'Leve', cor: 'cyan' };
  else if (diferenca < 30) faixa = { rotulo: 'Perceptível', cor: 'copper' };
  else faixa = { rotulo: 'Acentuado', cor: 'copper' };
  return { diferenca, limitante, ...faixa };
}

// Acima de que diferença o site avisa ativamente (caixa vermelha de
// avisos), em vez de só mostrar o painel informativo do gargalo.
const LIMIAR_AVISO_GARGALO = 15;

// ---------- 5c) Remover peça escolhida ----------
function removerPeca(categoriaId) {
  delete build[categoriaId];
  render();
}

// ---------- 5d) Filtro de compatibilidade ----------
// Restringe a lista da categoria ativa ao que já combina com o que foi
// escolhido antes (CPU <-> placa-mãe pelo socket, placa-mãe <-> memória
// pelo tipo). Ajuda a não montar algo incompatível por engano.
function filtrarCompativeis(pecas) {
  if (categoriaAtiva === 'placa-mae' && build.cpu) {
    return pecas.filter(p => p.socket === build.cpu.socket);
  }
  if (categoriaAtiva === 'cpu' && build['placa-mae']) {
    return pecas.filter(p => p.socket === build['placa-mae'].socket);
  }
  if (categoriaAtiva === 'memoria' && build['placa-mae']) {
    return pecas.filter(p => p.tipo_memoria === build['placa-mae'].tipo_memoria);
  }
  return pecas;
}

// ---------- 6) Renderização ----------
function renderCategorias() {
  const wrap = document.getElementById('categorias');
  wrap.innerHTML = '';
  CATEGORIAS.forEach(cat => {
    const ativa = cat.id === categoriaAtiva;
    const escolhida = Boolean(build[cat.id]);
    const btn = document.createElement('button');
    btn.dataset.active = String(ativa);
    btn.className = `pin-tab flex items-center gap-2 transition-colors ${
      ativa
        ? 'text-copper-light dark:text-copper border-copper-light dark:border-copper'
        : 'text-muted-light dark:text-muted border-transparent hover:text-ink-light dark:hover:text-ink'
    }`;
    btn.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-sm shrink-0 ${escolhida ? 'bg-copper-light dark:bg-copper' : 'bg-line-light dark:bg-line'}" aria-hidden="true"></span>
      ${cat.label}
    `;
    btn.addEventListener('click', () => {
      categoriaAtiva = cat.id;
      render();
    });
    wrap.appendChild(btn);
  });
}

function renderDica() {
  const box = document.getElementById('dica-categoria');
  if (!box) return;
  const dica = DICAS_CATEGORIA[categoriaAtiva];
  box.innerHTML = dica
    ? `<p class="text-sm text-ink-light dark:text-ink pl-3 border-l-2 border-copper-light dark:border-copper">${dica}</p>`
    : '';
}

function renderFiltroInfo(totalNaCategoria, totalFiltrado) {
  const el = document.getElementById('filtro-info');
  if (!el) return;
  if (totalFiltrado < totalNaCategoria) {
    el.classList.remove('hidden');
    el.textContent = `Mostrando ${totalFiltrado} de ${totalNaCategoria}: só as compatíveis com o que você já escolheu.`;
  } else {
    el.classList.add('hidden');
    el.textContent = '';
  }
}

function renderPecas() {
  const grid = document.getElementById('pecas-grid');
  grid.innerHTML = '';
  const pecasDaCategoria = todasPecas.filter(p => p.categoria === categoriaAtiva);
  const pecasFiltradas = filtrarCompativeis(pecasDaCategoria);
  renderFiltroInfo(pecasDaCategoria.length, pecasFiltradas.length);

  if (!pecasFiltradas.length) {
    grid.innerHTML = `<p class="text-sm text-muted-light dark:text-muted col-span-full">Nenhuma peça compatível encontrada — troque a peça escolhida numa categoria anterior.</p>`;
    return;
  }

  pecasFiltradas.forEach(peca => {
    const selecionada = build[categoriaAtiva]?.id === peca.id;
    const card = document.createElement('button');
    card.title = selecionada ? 'Toque para remover' : '';
    card.className = `text-left border rounded-lg p-5 transition-colors relative ${
      selecionada
        ? 'border-copper-light dark:border-copper bg-copper-light/5 dark:bg-copper/5'
        : 'border-line-light dark:border-line hover:border-copper-light dark:hover:border-copper'
    }`;
    card.innerHTML = `
      ${selecionada ? `<span class="absolute top-3 right-3 w-[18px] h-[18px] rounded flex items-center justify-center bg-copper-light dark:bg-copper text-white text-[11px] leading-none" aria-hidden="true">✓</span>` : ''}
      <p class="font-mono text-[11px] text-muted-light dark:text-muted mb-1">${peca.marca}</p>
      <h4 class="font-display font-semibold mb-2 pr-6">${peca.nome}</h4>
      <p class="font-mono text-copper-light dark:text-copper font-semibold">${precoFmt(peca.preco)}</p>
    `;
    card.addEventListener('click', () => {
      // Clicar numa peça já selecionada remove ela; clicar em outra troca.
      if (selecionada) {
        removerPeca(categoriaAtiva);
      } else {
        build[categoriaAtiva] = peca;
        render();
      }
    });
    grid.appendChild(card);
  });
}

function renderResumo() {
  const lista = document.getElementById('resumo-lista');
  const totalEl = document.getElementById('total-preco');
  const progresso = document.getElementById('resumo-progresso');
  const contagem = document.getElementById('resumo-contagem');
  lista.innerHTML = '';

  const escolhidas = CATEGORIAS.filter(cat => build[cat.id]);

  if (progresso) {
    progresso.innerHTML = CATEGORIAS.map(cat => {
      const preenchido = Boolean(build[cat.id]);
      return `<span title="${cat.label}" class="h-1.5 flex-1 rounded-sm ${preenchido ? 'bg-copper-light dark:bg-copper' : 'bg-line-light dark:bg-line'}"></span>`;
    }).join('');
  }
  if (contagem) contagem.textContent = `${escolhidas.length}/${CATEGORIAS.length}`;

  if (!escolhidas.length) {
    lista.innerHTML = `<li class="text-muted-light dark:text-muted">Nenhuma peça escolhida ainda.</li>`;
  } else {
    escolhidas.forEach(cat => {
      const peca = build[cat.id];
      const li = document.createElement('li');
      li.className = 'flex justify-between items-center gap-3';
      li.innerHTML = `
        <span class="text-muted-light dark:text-muted truncate min-w-0">${peca.nome}</span>
        <span class="flex items-center gap-2 shrink-0">
          <span>${precoFmt(peca.preco)}</span>
          <button type="button" title="Remover" aria-label="Remover ${peca.nome}"
            class="remover-peca-btn text-muted-light dark:text-muted hover:text-red-400 transition-colors leading-none text-base">
            &times;
          </button>
        </span>
      `;
      li.querySelector('.remover-peca-btn').addEventListener('click', () => removerPeca(cat.id));
      lista.appendChild(li);
    });
  }

  const total = escolhidas.reduce((soma, cat) => soma + build[cat.id].preco, 0);
  totalEl.textContent = precoFmt(total);
}

function renderAvisos() {
  const box = document.getElementById('avisos');
  const avisos = checarCompatibilidade();
  if (!avisos.length) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }
  box.classList.remove('hidden');
  box.innerHTML = avisos.map(a => `<p>${a}</p>`).join('');
}

function barraSegmentada(valor, cor) {
  const acesos = Math.round((valor / 100) * 20);
  let spans = '';
  for (let i = 0; i < 20; i++) {
    spans += `<span class="${i < acesos ? `bg-${cor}-light dark:bg-${cor}` : 'bg-line-light/60 dark:bg-line/60'}"></span>`;
  }
  return `<div class="meter-segmented h-1.5">${spans}</div>`;
}

function renderGargalo() {
  const box = document.getElementById('gargalo-info');
  if (!box) return;
  const gargalo = calcularGargalo(build.cpu, build['placa-video']);
  if (!gargalo) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }
  box.classList.remove('hidden');
  box.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <p class="text-sm font-display font-medium">Equilíbrio processador × placa de vídeo</p>
      <span class="font-mono text-xs text-copper-light dark:text-copper">${gargalo.rotulo}</span>
    </div>
    <div class="space-y-3 mb-3">
      <div>
        <div class="flex justify-between text-xs text-muted-light dark:text-muted mb-1.5">
          <span>${build.cpu.nome}</span><span class="font-mono">${build.cpu.desempenho_idx}</span>
        </div>
        ${barraSegmentada(build.cpu.desempenho_idx, 'copper')}
      </div>
      <div>
        <div class="flex justify-between text-xs text-muted-light dark:text-muted mb-1.5">
          <span>${build['placa-video'].nome}</span><span class="font-mono">${build['placa-video'].desempenho_idx}</span>
        </div>
        ${barraSegmentada(build['placa-video'].desempenho_idx, 'cyan')}
      </div>
    </div>
    <p class="text-xs text-muted-light dark:text-muted leading-relaxed">
      Estimativa baseada em índices públicos de benchmark (jun/2026); o resultado real
      varia por jogo, resolução e configurações.
    </p>
  `;
}

function renderGargaloAlerta() {
  const box = document.getElementById('gargalo-alerta');
  if (!box) return;
  const cpu = build.cpu;
  const gpu = build['placa-video'];
  const gargalo = calcularGargalo(cpu, gpu);

  if (!gargalo || gargalo.diferenca <= LIMIAR_AVISO_GARGALO) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  const categoriaFraca = gargalo.limitante; // 'processador' ou 'placa de vídeo'
  const categoriaForte = categoriaFraca === 'processador' ? 'placa de vídeo' : 'processador';
  const artigoFraca = categoriaFraca === 'processador' ? 'o' : 'a';
  const artigoForte = categoriaForte === 'processador' ? 'o' : 'a';
  const nomeFraco = categoriaFraca === 'processador' ? cpu.nome : gpu.nome;
  const nomeForte = categoriaFraca === 'processador' ? gpu.nome : cpu.nome;
  const adjFraco = artigoFraca === 'a' ? 'fraca' : 'fraco'; // "forte" não muda com o gênero

  box.classList.remove('hidden');
  box.innerHTML = `
    <div class="flex gap-3">
      <svg class="w-6 h-6 shrink-0 text-copper-light dark:text-copper" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z"/>
      </svg>
      <div>
        <p class="font-display font-semibold text-base mb-1">Essa combinação desperdiça ~${gargalo.diferenca}% do desempenho</p>
        <p class="text-sm leading-relaxed mb-2">
          ${nomeFraco} é bem mais ${adjFraco} que ${nomeForte} — cerca de <strong class="text-ink-light dark:text-ink">${gargalo.diferenca}% de diferença</strong>
          no índice de desempenho em jogos. Na prática, ${artigoFraca} ${categoriaFraca} chega no
          limite primeiro — ${artigoForte} ${categoriaForte} vai passar boa parte do tempo esperando, principalmente
          em jogos mais pesados, e você não vai aproveitar tudo o que pagou nela.
        </p>
        <p class="text-sm leading-relaxed mb-2">
          Considere trocar ${artigoFraca} ${categoriaFraca} por uma opção mais forte, ou ${artigoForte} ${categoriaForte}
          por uma mais em conta.
        </p>
        <p class="text-xs text-muted-light dark:text-muted">
          Estimativa baseada em índices públicos de benchmark; o resultado real varia por jogo e resolução.
        </p>
      </div>
    </div>
  `;
}

function render() {
  renderCategorias();
  renderDica();
  renderPecas();
  renderResumo();
  renderAvisos();
  renderGargalo();
  renderGargaloAlerta();
}

// ---------- 7) Início ----------
(async function init() {
  todasPecas = await carregarPecas();
  render();
})();
