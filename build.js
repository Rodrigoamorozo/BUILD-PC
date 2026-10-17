
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
  { id: 'memoria', label: 'Memória' },
  { id: 'placa-video', label: 'Placa de vídeo' },
  { id: 'armazenamento', label: 'Armazenamento' },
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
async function carregarPecas() {
  const configurado =
    typeof SUPABASE_URL !== 'undefined' &&
    SUPABASE_URL !== 'COLE_AQUI_SUA_PROJECT_URL';

  if (configurado && typeof buscarPecas === 'function') {
    try {
      const dados = await buscarPecas();

      if (Array.isArray(dados) && dados.length) {
        fonteDados = { origem: 'banco', motivo: '' };
        return dados;
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
  return MOCK_PECAS;
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
  const { cpu, fonte } = build;
  const placaMae = build['placa-mae'];
  const memoria = build.memoria;

  if (cpu && placaMae && cpu.socket !== placaMae.socket) {
    avisos.push(
      `${cpu.nome} usa o socket ${cpu.socket}, mas a ${placaMae.nome} é ${placaMae.socket} — troque uma das duas.`
    );
  }

  if (placaMae && memoria && placaMae.tipo_memoria !== memoria.tipo_memoria) {
    avisos.push(
      `A memória é ${memoria.tipo_memoria}, mas a placa-mãe aceita ${placaMae.tipo_memoria} — escolha uma memória compatível.`
    );
  }

  if (fonte) {
    const consumoEstimado = Object.values(build).reduce(
      (soma, peca) => soma + (Number(peca.potencia_w) || 0),
      0
    ) - (Number(fonte.potencia_w) || 0);

    if (consumoEstimado > Number(fonte.potencia_w) * 0.8) {
      avisos.push(
        `A fonte de ${fonte.potencia_w}W pode ser justa para o consumo estimado (${consumoEstimado}W) — considere uma fonte mais potente.`
      );
    }
  }

  return avisos;
}

// ---------- 5b) Remover peça ----------
function removerPeca(categoriaId) {
  delete build[categoriaId];
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
    return pecas.filter(
      p => p.tipo_memoria === build['placa-mae'].tipo_memoria
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
    const escolhida = Boolean(build[cat.id]);
    const btn = document.createElement('button');

    btn.dataset.active = String(ativa);
    btn.className = `pin-tab flex items-center gap-2 transition-colors ${
      ativa
        ? 'text-copper-light dark:text-copper border-copper-light dark:border-copper'
        : 'text-muted-light dark:text-muted border-transparent hover:text-ink-light dark:hover:text-ink'
    }`;

    btn.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-sm shrink-0 ${
        escolhida
          ? 'bg-copper-light dark:bg-copper'
          : 'bg-line-light dark:bg-line'
      }" aria-hidden="true"></span>
      ${escaparHTML(cat.label)}
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
    ? `<p class="text-sm text-ink-light dark:text-ink pl-3 border-l-2 border-copper-light dark:border-copper">${escaparHTML(dica)}</p>`
    : '';
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

function renderPecas() {
  const grid = document.getElementById('pecas-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const pecasDaCategoria = todasPecas.filter(
    p => p.categoria === categoriaAtiva
  );
  const pecasFiltradas = filtrarCompativeis(pecasDaCategoria);

  renderFiltroInfo(pecasDaCategoria.length, pecasFiltradas.length);

  if (!pecasFiltradas.length) {
    grid.innerHTML = `
      <p class="text-sm text-muted-light dark:text-muted col-span-full">
        Nenhuma peça compatível encontrada — troque a peça escolhida numa categoria anterior.
      </p>
    `;
    return;
  }

  pecasFiltradas.forEach(peca => {
    const selecionada = build[categoriaAtiva]?.id === peca.id;
    const card = document.createElement('button');

    card.type = 'button';
    card.title = selecionada ? 'Toque para remover' : '';
    card.className = `text-left border rounded-lg p-5 transition-colors relative ${
      selecionada
        ? 'border-copper-light dark:border-copper bg-copper-light/5 dark:bg-copper/5'
        : 'border-line-light dark:border-line hover:border-copper-light dark:hover:border-copper'
    }`;

    card.innerHTML = `
      ${selecionada ? `
        <span class="absolute top-3 right-3 w-[18px] h-[18px] rounded flex items-center justify-center bg-copper-light dark:bg-copper text-white text-[11px] leading-none" aria-hidden="true">✓</span>
      ` : ''}
      <p class="font-mono text-[11px] text-muted-light dark:text-muted mb-1">${escaparHTML(peca.marca)}</p>
      <h4 class="font-display font-semibold mb-2 pr-6">${escaparHTML(peca.nome)}</h4>
      <p class="font-mono text-copper-light dark:text-copper font-semibold">${precoFmt(peca.preco)}</p>
    `;

    card.addEventListener('click', () => {
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

// ---------- 7) Resumo da montagem ----------
function renderResumo() {
  const lista = document.getElementById('resumo-lista');
  const totalEl = document.getElementById('total-preco');
  const progresso = document.getElementById('resumo-progresso');
  const contagem = document.getElementById('resumo-contagem');

  if (!lista || !totalEl) return;

  lista.innerHTML = '';

  const escolhidas = CATEGORIAS.filter(cat => build[cat.id]);

  if (progresso) {
    progresso.innerHTML = CATEGORIAS.map(cat => {
      const preenchido = Boolean(build[cat.id]);

      return `
        <span title="${escaparHTML(cat.label)}"
          class="h-1.5 flex-1 rounded-sm ${
            preenchido
              ? 'bg-copper-light dark:bg-copper'
              : 'bg-line-light dark:bg-line'
          }"></span>
      `;
    }).join('');
  }

  if (contagem) {
    contagem.textContent = `${escolhidas.length}/${CATEGORIAS.length}`;
  }

  if (!escolhidas.length) {
    lista.innerHTML = `
      <li class="text-muted-light dark:text-muted">
        Nenhuma peça escolhida ainda.
      </li>
    `;
  } else {
    escolhidas.forEach(cat => {
      const peca = build[cat.id];
      const li = document.createElement('li');

      li.className = 'flex justify-between items-center gap-3';
      li.innerHTML = `
        <span class="text-muted-light dark:text-muted truncate min-w-0">${escaparHTML(peca.nome)}</span>
        <span class="flex items-center gap-2 shrink-0">
          <span>${precoFmt(peca.preco)}</span>
          <button type="button"
            title="Remover"
            aria-label="Remover ${escaparHTML(peca.nome)}"
            class="remover-peca-btn text-muted-light dark:text-muted hover:text-red-400 transition-colors leading-none text-base">
            &times;
          </button>
        </span>
      `;

      li.querySelector('.remover-peca-btn').addEventListener(
        'click',
        () => removerPeca(cat.id)
      );

      lista.appendChild(li);
    });
  }

  const total = escolhidas.reduce(
    (soma, cat) => soma + (Number(build[cat.id].preco) || 0),
    0
  );

  totalEl.textContent = precoFmt(total);
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

const LIMITE_ALERTA_GARGALO = 15; // % a partir do qual o aviso grande aparece
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

// CPU mínima (no índice do catálogo) para cada faixa de GPU, calibrada para
// 1080p: abaixo disso a CPU vira o limitante antes da placa.
const FAIXAS_CPU_MINIMA = [
  { ateGpu: 30, cpuMinima: 42 },
  { ateGpu: 45, cpuMinima: 50 },
  { ateGpu: 60, cpuMinima: 58 },
  { ateGpu: 75, cpuMinima: 65 },
  { ateGpu: 88, cpuMinima: 78 },
  { ateGpu: Infinity, cpuMinima: 88 }
];

function cpuMinimaParaGpu(idxGpu) {
  const faixa = FAIXAS_CPU_MINIMA.find(item => idxGpu <= item.ateGpu);
  return faixa
    ? faixa.cpuMinima
    : FAIXAS_CPU_MINIMA[FAIXAS_CPU_MINIMA.length - 1].cpuMinima;
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

// Aviso grande no topo da grade: só aparece quando o processador fica bem
// abaixo do que a placa de vídeo pede.
function renderGargaloAlerta() {
  const box = document.getElementById('gargalo-alerta');
  if (!box) return;

  const dados = calcularGargalo();

  if (!dados || dados.faltando || dados.percentual <= LIMITE_ALERTA_GARGALO) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  box.classList.remove('hidden');
  box.innerHTML = `
    <p class="font-display font-semibold text-sm mb-1.5">
      Processador abaixo do recomendado para esta placa
    </p>
    <p class="text-sm text-muted-light dark:text-muted leading-relaxed">
      O <strong class="text-ink-light dark:text-ink">${escaparHTML(dados.cpu.nome)}</strong>
      fica cerca de <strong class="text-ink-light dark:text-ink">${percentualFmt(dados.percentual)}</strong>
      abaixo do índice mínimo que acompanha a
      <strong class="text-ink-light dark:text-ink">${escaparHTML(dados.gpu.nome)}</strong>
      (${indiceFmt(dados.cpuMinima)}). Na prática, é ele que tende a segurar o PC,
      principalmente em resoluções mais baixas. ${textoNivel(dados)}
    </p>
  `;
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
        ${medidorHTML('Seu processador', dados.idxCpu, 'bg-copper-light dark:bg-copper')}
        ${medidorHTML('CPU recomendada para esta placa', dados.cpuMinima, 'bg-cyan-light dark:bg-cyan')}
      </div>

      ${dados.percentual > 0
        ? `<p class="text-sm mb-2">
            Déficit de <strong class="font-mono">${percentualFmt(dados.percentual)}</strong>
            — o processador está abaixo do recomendado
          </p>`
        : `<p class="text-sm mb-2">
            Processador suficiente para esta placa
            <strong class="font-mono">(${indiceFmt(dados.idxCpu)} ≥ ${indiceFmt(dados.cpuMinima)})</strong>
            — o limitante tende a ser a placa de vídeo
          </p>`}

      ${dados.percentual > 0
        ? `<p class="text-sm text-muted-light dark:text-muted leading-relaxed">
            ${textoNivel(dados)}
          </p>`
        : ''}

      <p class="text-xs text-muted-light dark:text-muted leading-relaxed mt-4 pt-4 border-t border-line-light dark:border-line">
        Estimativa: cada faixa de placa de vídeo pede um processador mínimo para
        não ser limitada em 1080p. O resultado real muda por jogo, resolução e
        qualidade gráfica — isto não é medição.
      </p>
    `;
  }

  box.classList.remove('hidden');
  box.innerHTML = `
    <h3 class="font-display font-semibold text-base mb-3">Gargalo estimado</h3>
    ${conteudo}
    <div id="benchmark-painel" class="mt-5 pt-5 border-t border-line-light dark:border-line"></div>
  `;

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

  alvo.innerHTML = `
    ${titulo}
    <p class="text-sm text-muted-light dark:text-muted">Consultando benchmarks...</p>
  `;

  try {
    const benchmarks = await buscarBenchmarksDoPar(cpu.id, gpu.id);

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
            class="w-full border border-line-light dark:border-line rounded-md p-2 bg-panel-light dark:bg-panel text-xs"
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

  // Calcula a estimativa de gargalo do par e, se houver, o benchmark medido.
  renderGargalo();

  // Aviso grande no topo: só quando o desequilíbrio passa de 15%.
  renderGargaloAlerta();
}

// ---------- 11) Inicialização ----------
(async function init() {
  todasPecas = await carregarPecas();
  renderAvisoBanco();
  render();
})();
