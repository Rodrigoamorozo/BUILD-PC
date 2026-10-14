// conta.js
// Menu da conta no canto superior direito do menu do site.
// Deslogado: mostra o link "Entrar". Logado: mostra um botão com o nome da
// pessoa que abre um menu com "Editar perfil" e "Sair".
// Precisa que supabase.js já tenha carregado (sessaoAtual, sair, nomeExibicao).
// O nome vem do usuário, então é sempre inserido com textContent (nunca innerHTML).

(function () {
  const area = document.getElementById('conta-area');
  if (!area) return;

  const CLASSE_LINK = 'text-muted-light dark:text-muted hover:text-ink-light dark:hover:text-ink transition-colors';
  const CLASSE_ITEM = 'block w-full text-left rounded-md px-3 py-2 text-sm text-ink-light dark:text-ink hover:bg-bg-light dark:hover:bg-bg transition-colors';

  let botao = null;
  let menu = null;

  function abrir() {
    menu.classList.remove('hidden');
    botao.setAttribute('aria-expanded', 'true');
    const primeiro = menu.querySelector('[role="menuitem"]');
    if (primeiro) primeiro.focus();
  }

  function fechar(devolverFoco) {
    if (!menu) return;
    menu.classList.add('hidden');
    botao.setAttribute('aria-expanded', 'false');
    if (devolverFoco) botao.focus();
  }

  function montarEntrar() {
    area.replaceChildren();
    botao = null;
    menu = null;
    const link = document.createElement('a');
    link.href = 'login.html';
    link.textContent = 'Entrar';
    link.className = CLASSE_LINK;
    area.appendChild(link);
  }

  function montarMenu(user) {
    const nome = nomeExibicao(user);
    area.replaceChildren();

    botao = document.createElement('button');
    botao.type = 'button';
    botao.id = 'conta-btn';
    botao.setAttribute('aria-haspopup', 'menu');
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-controls', 'conta-menu');
    botao.setAttribute('aria-label', 'Menu da conta de ' + nome);
    botao.className = 'flex items-center gap-2 rounded-full border border-line-light dark:border-line bg-panel-light dark:bg-panel py-1 pl-1 pr-3 text-sm hover:border-copper-light dark:hover:border-copper transition-colors';

    const avatar = document.createElement('span');
    avatar.setAttribute('aria-hidden', 'true');
    avatar.className = 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-copper-light dark:bg-copper text-xs font-semibold text-white';
    avatar.textContent = (nome.charAt(0) || '?').toUpperCase();

    const rotulo = document.createElement('span');
    rotulo.className = 'hidden max-w-[140px] truncate sm:inline';
    rotulo.textContent = nome;

    botao.append(avatar, rotulo);
    botao.insertAdjacentHTML('beforeend',
      '<svg class="h-3 w-3 text-muted-light dark:text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>');

    menu = document.createElement('div');
    menu.id = 'conta-menu';
    menu.setAttribute('role', 'menu');
    menu.className = 'hidden absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-line-light dark:border-line bg-panel-light dark:bg-panel p-1 shadow-lg';

    const email = document.createElement('p');
    email.className = 'truncate px-3 pb-2 pt-2 text-xs text-muted-light dark:text-muted';
    email.textContent = user.email || '';

    const perfil = document.createElement('a');
    perfil.href = 'perfil.html';
    perfil.setAttribute('role', 'menuitem');
    perfil.className = CLASSE_ITEM;
    perfil.textContent = 'Editar perfil';

    const sairBtn = document.createElement('button');
    sairBtn.type = 'button';
    sairBtn.setAttribute('role', 'menuitem');
    sairBtn.className = CLASSE_ITEM;
    sairBtn.textContent = 'Sair';

    menu.append(email, perfil, sairBtn);
    area.append(botao, menu);

    botao.addEventListener('click', () => {
      if (menu.classList.contains('hidden')) abrir(); else fechar(false);
    });

    sairBtn.addEventListener('click', async () => {
      try {
        await sair();
      } catch (erro) {
        console.error('Erro ao sair:', erro);
      } finally {
        window.location.href = 'index.html';
      }
    });
  }

  // Fecha o menu ao clicar fora ou apertar Esc (registrado uma vez só)
  document.addEventListener('click', (evento) => {
    if (menu && !area.contains(evento.target)) fechar(false);
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menu && !menu.classList.contains('hidden')) fechar(true);
  });

  async function renderConta() {
    if (typeof sessaoAtual !== 'function') { montarEntrar(); return; }
    let sessao = null;
    try {
      sessao = await sessaoAtual();
    } catch (erro) {
      console.error('Não foi possível checar a sessão:', erro);
    }
    if (sessao && sessao.user) montarMenu(sessao.user);
    else montarEntrar();
  }

  // perfil.js chama isso depois de salvar o nome, pra o menu atualizar na hora
  window.renderConta = renderConta;
  renderConta();

  // Atualiza o menu quando a sessão muda (login, logout, outra aba).
  // O setTimeout evita chamar o Supabase de dentro do próprio callback.
  if (typeof db !== 'undefined' && db.auth && db.auth.onAuthStateChange) {
    db.auth.onAuthStateChange(() => { setTimeout(renderConta, 0); });
  }
})();
