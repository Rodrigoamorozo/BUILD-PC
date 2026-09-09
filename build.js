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

// ---------- 2) Peças de exemplo ----------
// Isso é só um mock pra tela funcionar antes de você cadastrar peças
// reais no Supabase. Cada peça tem os campos que a tabela "pecas" vai ter.
// Quando o Supabase estiver configurado (URL + chave em supabase.js),
// troque MOCK_PECAS por uma chamada real (veja carregarPecas() abaixo).
//
// Campo "desempenho" (0 a 100): usado só pra calcular o aviso de gargalo
// entre CPU e placa de vídeo (ver checarCompatibilidade). Pra peças novas
// que você for cadastrar, dá pra puxar um valor real de sites de
// benchmark, por exemplo:
//   - CPU: https://www.tomshardware.com/reviews/cpu-hierarchy,4312.html
//   - GPU: https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html
// Ambas as tabelas já vêm normalizadas de 0 a 100 (100 = a mais rápida
// da categoria), então dá só pra copiar o número direto pro campo.
//
// Campos de encaixe físico (pra checar se a peça cabe no gabinete):
//   - placa-video.comprimento_mm: comprimento da placa em milímetros
//     (o fabricante sempre informa isso na ficha técnica).
//   - placa-mae.formato: 'ATX', 'mATX' ou 'ITX'.
//   - gabinete.gpu_max_mm: maior placa de vídeo (em mm) que o gabinete aceita.
//   - gabinete.formatos_compativeis: lista separada por vírgula dos formatos
//     de placa-mãe que o gabinete encaixa, ex: 'ATX,mATX,ITX'.
//
// Campos de compatibilidade de placa-mãe (chipset "ruim"/limitado):
//   - cpu.geracao: número da geração/série do processador (ex: 13 pro
//     Core i5-13400F, 7 pra um Ryzen da série 7000).
//   - placa-mae.geracoes_suportadas: gerações que a placa-mãe aceita,
//     separadas por vírgula, ex: '12,13,14'.
//   - placa-mae.velocidade_ram_max: maior velocidade de RAM em MHz que
//     a placa-mãe suporta oficialmente.
//   - memoria.velocidade_mhz: velocidade da RAM em MHz.
//   - placa-mae.suporta_nvme: true ou false — se o slot M.2 aceita NVMe.
//   - armazenamento.tipo_conexao: 'NVMe' ou 'SATA'.
const MOCK_PECAS = [
  { id: 'cpu-1', categoria: 'cpu', nome: 'Ryzen 5 7600', marca: 'AMD', preco: 1299, socket: 'AM5', potencia_w: 65, desempenho: 64, geracao: 7 },
  { id: 'cpu-2', categoria: 'cpu', nome: 'Core i5-13400F', marca: 'Intel', preco: 1099, socket: 'LGA1700', potencia_w: 65, desempenho: 58, geracao: 13 },
  { id: 'cpu-3', categoria: 'cpu', nome: 'Ryzen 7 7800X3D', marca: 'AMD', preco: 2599, socket: 'AM5', potencia_w: 120, desempenho: 86, geracao: 7 },

  { id: 'mb-1', categoria: 'placa-mae', nome: 'B650M', marca: 'Gigabyte', preco: 899,  socket: 'AM5',    tipo_memoria: 'DDR5', formato: 'mATX', geracoes_suportadas: '7,8,9', velocidade_ram_max: 8000, suporta_nvme: true },
  { id: 'mb-2', categoria: 'placa-mae', nome: 'B760M', marca: 'ASUS',     preco: 799,  socket: 'LGA1700', tipo_memoria: 'DDR4', formato: 'mATX', geracoes_suportadas: '12,13,14', velocidade_ram_max: 5333, suporta_nvme: true },
  { id: 'mb-3', categoria: 'placa-mae', nome: 'X670E',  marca: 'MSI',     preco: 1899, socket: 'AM5',    tipo_memoria: 'DDR5', formato: 'ATX', geracoes_suportadas: '7,8,9', velocidade_ram_max: 7800, suporta_nvme: true },

  { id: 'ram-1', categoria: 'memoria', nome: '16GB (2x8) 5600MHz', marca: 'Kingston', preco: 349, tipo_memoria: 'DDR5', velocidade_mhz: 5600 },
  { id: 'ram-2', categoria: 'memoria', nome: '16GB (2x8) 3200MHz', marca: 'Corsair',  preco: 279, tipo_memoria: 'DDR4', velocidade_mhz: 3200 },
  { id: 'ram-3', categoria: 'memoria', nome: '32GB (2x16) 6000MHz', marca: 'Kingston', preco: 799, tipo_memoria: 'DDR5', velocidade_mhz: 6000 },

  { id: 'gpu-1', categoria: 'placa-video', nome: 'RTX 4060', marca: 'NVIDIA', preco: 2199, potencia_w: 115, desempenho: 28, comprimento_mm: 227 },
  { id: 'gpu-2', categoria: 'placa-video', nome: 'RTX 4070', marca: 'NVIDIA', preco: 3699, potencia_w: 200, desempenho: 47, comprimento_mm: 242 },
  { id: 'gpu-3', categoria: 'placa-video', nome: 'RX 7600',  marca: 'AMD',    preco: 1899, potencia_w: 165, desempenho: 27, comprimento_mm: 204 },
  { id: 'gpu-4', categoria: 'placa-video', nome: 'RTX 5090',  marca: 'NVIDIA', preco: 1899, potencia_w: 580, desempenho: 100, comprimento_mm: 304 },
  { id: 'gpu-5', categoria: 'placa-video', nome: 'RX 580',  marca: 'AMD', preco: 1899, potencia_w: 135, desempenho: 16, comprimento_mm: 241 },
  { id: 'gpu-6', categoria: 'placa-video', nome: 'RTX 3050 TI',  marca: 'NVIDIA', preco: 1899, potencia_w: 35, desempenho: 18, comprimento_mm: 180 },

  { id: 'ssd-1', categoria: 'armazenamento', nome: 'SSD NVMe 500GB', marca: 'Kingston', preco: 249, potencia_w: 6, tipo_conexao: 'NVMe' },
  { id: 'ssd-2', categoria: 'armazenamento', nome: 'SSD NVMe 1TB',   marca: 'WD',       preco: 449, potencia_w: 6, tipo_conexao: 'NVMe' },
  { id: 'hd-1',  categoria: 'armazenamento', nome: 'HD 1TB 7200RPM', marca: 'Seagate',  preco: 279, potencia_w: 8, tipo_conexao: 'SATA' },

  { id: 'psu-1', categoria: 'fonte', nome: '550W 80+ Bronze', marca: 'Corsair', preco: 399, potencia_w: 550 },
  { id: 'psu-2', categoria: 'fonte', nome: '650W 80+ Bronze', marca: 'EVGA',    preco: 499, potencia_w: 650 },
  { id: 'psu-3', categoria: 'fonte', nome: '750W 80+ Gold',   marca: 'Corsair', preco: 699, potencia_w: 750 },

  { id: 'case-1', categoria: 'gabinete', nome: 'NZXT H510', marca: 'NZXT', preco: 549, gpu_max_mm: 381, formatos_compativeis: 'ATX,mATX,ITX' },
  { id: 'case-2', categoria: 'gabinete', nome: 'Lancer',    marca: 'Gamdias', preco: 349, gpu_max_mm: 330, formatos_compativeis: 'mATX,ITX' },
];

// ---------- 2b) Dicas por categoria ----------
// Texto curto mostrado embaixo das abas quando aquela categoria está ativa.
const DICAS_CATEGORIA = {
  'cpu': {
    dica: 'Escolha primeiro o processador pensando no que você pretende fazer com o PC.',
    observar: 'Núcleos e threads, clock (GHz) e compatibilidade de socket com a placa-mãe.',
  },
  'placa-mae': {
    dica: 'A placa-mãe precisa ter o mesmo socket do processador e suportar o tipo de memória escolhido.',
    observar: 'Socket, formato (ATX/mATX/ITX), geração de CPU suportada e velocidade máxima de RAM.',
  },
  'memoria': {
    dica: 'Mais MHz significa mais velocidade, mas só se a placa-mãe suportar.',
    observar: 'Capacidade (GB), velocidade (MHz) e compatibilidade com a placa-mãe (DDR4/DDR5).',
  },
  'placa-video': {
    dica: 'Escolha uma placa de vídeo equilibrada com o processador pra evitar gargalo.',
    observar: 'Desempenho, quantidade de VRAM e consumo de energia (W).',
  },
  'armazenamento': {
    dica: 'SSD NVMe é bem mais rápido que HD, mas confira se a placa-mãe suporta NVMe.',
    observar: 'Capacidade, tipo (NVMe ou SATA) e velocidade de leitura/escrita.',
  },
  'fonte': {
    dica: 'A fonte precisa dar conta da potência somada de todas as peças, com folga.',
    observar: 'Potência (W), certificação 80+ e se é modular ou não.',
  },
  'gabinete': {
    dica: 'Confira se o gabinete comporta o tamanho da sua placa de vídeo e o formato da placa-mãe.',
    observar: 'Tamanho máximo de GPU, formatos de placa-mãe aceitos e ventilação.',
  },
};


const build = {}; // ex: { cpu: {...peca}, memoria: {...peca} }
let categoriaAtiva = CATEGORIAS[0].id;
let todasPecas = [];

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

// ---------- 5) Remover peça escolhida ----------
function removerPeca(categoriaId) {
  delete build[categoriaId];
  render();
}

// ---------- 6) Regras de compatibilidade ----------
// Diferença de desempenho (em %) a partir da qual consideramos que uma
// peça está "segurando" a outra. Ajuste esse número se quiser um
// critério mais ou menos sensível.
const LIMITE_GARGALO_PORCENTO = 15;

function checarCompatibilidade() {
  const avisos = [];
  const { cpu, ['placa-mae']: placaMae, memoria, fonte, ['placa-video']: gpu, gabinete, armazenamento } = build;

  if (cpu && placaMae && placaMae.geracoes_suportadas && cpu.geracao !== undefined) {
    const geracoesAceitas = placaMae.geracoes_suportadas.split(',').map(g => g.trim());
    if (!geracoesAceitas.includes(String(cpu.geracao))) {
      avisos.push(`A placa-mãe ${placaMae.nome} só aceita processadores de geração ${geracoesAceitas.join(', ')}, mas o ${cpu.nome} é de outra geração.`);
    }
  }
  if (placaMae && memoria && placaMae.velocidade_ram_max && memoria.velocidade_mhz > placaMae.velocidade_ram_max) {
    avisos.push(`A memória roda a ${memoria.velocidade_mhz}MHz, mas a placa-mãe ${placaMae.nome} só suporta até ${placaMae.velocidade_ram_max}MHz — ela vai funcionar, só que mais devagar do que o anunciado.`);
  }
  if (placaMae && armazenamento && placaMae.suporta_nvme === false && armazenamento.tipo_conexao === 'NVMe') {
    avisos.push(`A placa-mãe ${placaMae.nome} não tem suporte a NVMe — o ${armazenamento.nome} não vai funcionar no slot M.2 dela.`);
  }

  if (gabinete && gpu && gpu.comprimento_mm && gabinete.gpu_max_mm && gpu.comprimento_mm > gabinete.gpu_max_mm) {
    avisos.push(`A ${gpu.nome} tem ${gpu.comprimento_mm}mm de comprimento, mas o gabinete ${gabinete.nome} só aceita placas de até ${gabinete.gpu_max_mm}mm — ela não vai caber.`);
  }
  if (gabinete && placaMae && gabinete.formatos_compativeis) {
    const formatosAceitos = gabinete.formatos_compativeis.split(',').map(f => f.trim());
    if (placaMae.formato && !formatosAceitos.includes(placaMae.formato)) {
      avisos.push(`A placa-mãe ${placaMae.nome} é ${placaMae.formato}, mas o gabinete ${gabinete.nome} só encaixa: ${formatosAceitos.join(', ')}.`);
    }
  }

  if (cpu && gpu) {
    const maior = Math.max(cpu.desempenho, gpu.desempenho);
    const menor = Math.min(cpu.desempenho, gpu.desempenho);
    const diferencaPercentual = ((maior - menor) / maior) * 100;

    if (diferencaPercentual >= LIMITE_GARGALO_PORCENTO) {
      const percentual = diferencaPercentual.toFixed(0);
      if (cpu.desempenho < gpu.desempenho) {
        avisos.push(`Gargalo de ${percentual}%: ${cpu.nome} está bem abaixo da ${gpu.nome} — o processador não vai deixar a placa de vídeo mostrar todo o potencial dela.`);
      } else {
        avisos.push(`Gargalo de ${percentual}%: ${gpu.nome} está bem abaixo do ${cpu.nome} — a placa de vídeo vai ser o limite do sistema, dá pra economizar no processador.`);
      }
    }
  }

  if (cpu && placaMae && cpu.socket !== placaMae.socket) {
    avisos.push(`${cpu.nome} (${cpu.socket}) não encaixa na ${placaMae.nome} (${placaMae.socket}).`);
  }
  if (placaMae && memoria && placaMae.tipo_memoria !== memoria.tipo_memoria) {
    avisos.push(`A memória é ${memoria.tipo_memoria}, mas a placa-mãe só aceita ${placaMae.tipo_memoria}.`);
  }
  if (fonte) {
    const consumoEstimado = Object.values(build).reduce((soma, p) => soma + (p.potencia_w || 0), 0) - (fonte.potencia_w || 0);
    if (consumoEstimado > fonte.potencia_w * 0.8) {
      avisos.push(`A fonte de ${fonte.potencia_w}W pode ser justa para o consumo estimado (${consumoEstimado}W). Considere uma fonte mais potente.`);
    }
  }
  return avisos;
}

// ---------- 7) Renderização ----------
function renderCategorias() {
  const wrap = document.getElementById('categorias');
  wrap.innerHTML = '';
  CATEGORIAS.forEach(cat => {
    const btn = document.createElement('button');
    const escolhida = build[cat.id];
    btn.className = `px-4 py-2 rounded-full border transition-colors ${
      cat.id === categoriaAtiva
        ? 'border-copper-light dark:border-copper text-copper-light dark:text-copper'
        : 'border-line-light/60 dark:border-line/60 text-muted-light dark:text-muted hover:border-copper-light dark:hover:border-copper'
    }`;
    btn.textContent = cat.label + (escolhida ? ' ✓' : '');
    btn.addEventListener('click', () => {
      categoriaAtiva = cat.id;
      render();
    });
    wrap.appendChild(btn);
  });
}

// ---------- 6b) Filtro de compatibilidade ----------
// Reduz a lista de peças da categoria ativa às que combinam com o que
// já foi escolhido (CPU -> placa-mãe pelo socket, placa-mãe -> memória
// pelo tipo). Se ainda não há nada escolhido que restrinja, mostra tudo.
function filtrarCompativeis(pecas) {
  if (categoriaAtiva === 'placa-mae' && build.cpu) {
    return pecas.filter(p => p.socket === build.cpu.socket);
  }
  if (categoriaAtiva === 'memoria' && build['placa-mae']) {
    return pecas.filter(p => p.tipo_memoria === build['placa-mae'].tipo_memoria);
  }
  if (categoriaAtiva === 'cpu' && build['placa-mae']) {
    return pecas.filter(p => p.socket === build['placa-mae'].socket);
  }
  return pecas;
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

  pecasFiltradas.forEach(peca => {
    const selecionada = build[categoriaAtiva]?.id === peca.id;
    const card = document.createElement('button');
    card.className = `text-left border rounded-xl p-5 transition-colors relative ${
      selecionada
        ? 'border-copper-light dark:border-copper bg-copper-light/5 dark:bg-copper/5'
        : 'border-line-light dark:border-line hover:border-copper-light dark:hover:border-copper'
    }`;
    card.innerHTML = `
      ${selecionada ? `<span class="absolute top-3 right-3 text-[10px] font-mono text-copper-light dark:text-copper">SELECIONADA · toque para remover</span>` : ''}
      <p class="font-mono text-[11px] text-muted-light dark:text-muted mb-1">${peca.marca}</p>
      <h4 class="font-display font-semibold mb-2">${peca.nome}</h4>
      <p class="text-copper-light dark:text-copper font-semibold">R$ ${peca.preco.toLocaleString('pt-BR')}</p>
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
  lista.innerHTML = '';

  const escolhidas = CATEGORIAS.filter(cat => build[cat.id]);
  if (!escolhidas.length) {
    lista.innerHTML = `<li class="text-muted-light dark:text-muted">Nenhuma peça escolhida ainda.</li>`;
  } else {
    escolhidas.forEach(cat => {
      const peca = build[cat.id];
      const li = document.createElement('li');
      li.className = 'flex justify-between items-center gap-3';
      li.innerHTML = `
        <span class="text-muted-light dark:text-muted truncate">${peca.nome}</span>
        <span class="flex items-center gap-2 shrink-0">
          <span>R$ ${peca.preco.toLocaleString('pt-BR')}</span>
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
  totalEl.textContent = `R$ ${total.toLocaleString('pt-BR')}`;
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
  box.innerHTML = avisos.map(a => `<p>⚠ ${a}</p>`).join('');
}

function renderDica() {
  const box = document.getElementById('dica-categoria');
  if (!box) return;
  const info = DICAS_CATEGORIA[categoriaAtiva];
  if (!info) { box.innerHTML = ''; return; }
  box.innerHTML = `
    <p class="text-sm text-copper-light dark:text-copper">💡 Dica: ${info.dica}</p>
    <p class="text-xs text-muted-light dark:text-muted"><span class="font-semibold">O que observar?</span> ${info.observar}</p>
  `;
}

function render() {
  renderCategorias();
  renderDica();
  renderPecas();
  renderResumo();
  renderAvisos();
}

// ---------- 8) Início ----------
(async function init() {
  todasPecas = await carregarPecas();
  render();
})();
