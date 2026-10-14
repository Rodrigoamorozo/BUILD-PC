// auth.js
// Lógica da tela de login: alterna entre Entrar / Criar conta / Esqueci
// minha senha, e fala com o Supabase através das funções de supabase.js
// (entrarComEmail, criarConta, redefinirSenha, sessaoAtual).

const estado = { modo: 'entrar' };

const els = {
  tabs: document.getElementById('auth-tabs'),
  tabEntrar: document.getElementById('tab-entrar'),
  tabCriar: document.getElementById('tab-criar'),
  titulo: document.getElementById('auth-titulo'),
  subtitulo: document.getElementById('auth-subtitulo'),
  mensagem: document.getElementById('auth-mensagem'),
  form: document.getElementById('form-auth'),
  nomeWrap: document.getElementById('campo-nome-wrap'),
  nome: document.getElementById('campo-nome'),
  email: document.getElementById('campo-email'),
  senhaWrap: document.getElementById('campo-senha-wrap'),
  senha: document.getElementById('campo-senha'),
  toggleSenha: document.getElementById('toggle-senha'),
  iconeOlho: document.getElementById('icone-olho'),
  linkEsqueciWrap: document.getElementById('link-esqueci').closest('p'),
  linkEsqueci: document.getElementById('link-esqueci'),
  voltarWrap: document.getElementById('voltar-entrar-wrap'),
  voltar: document.getElementById('voltar-entrar'),
  btn: document.getElementById('btn-enviar'),
};

function limparMensagem() {
  els.mensagem.classList.add('hidden');
  els.mensagem.textContent = '';
  els.mensagem.className = 'hidden mb-4 text-sm rounded-lg px-3 py-2';
}

function mostrarMensagem(texto, tipo) {
  els.mensagem.textContent = texto;
  const cores = tipo === 'sucesso'
    ? 'border border-cyan-light/40 dark:border-cyan/40 bg-cyan-light/10 dark:bg-cyan/10 text-cyan-light dark:text-cyan'
    : 'border border-red-500/40 bg-red-500/10 text-red-400';
  els.mensagem.className = `mb-4 text-sm rounded-lg px-3 py-2 ${cores}`;
}

function marcarAbaAtiva(tab, ativa) {
  tab.dataset.active = String(ativa);
  tab.setAttribute('aria-selected', String(ativa));
  tab.classList.toggle('text-copper-light', ativa);
  tab.classList.toggle('dark:text-copper', ativa);
  tab.classList.toggle('border-copper-light', ativa);
  tab.classList.toggle('dark:border-copper', ativa);
  tab.classList.toggle('text-muted-light', !ativa);
  tab.classList.toggle('dark:text-muted', !ativa);
}

function setModo(modo) {
  estado.modo = modo;
  limparMensagem();

  if (modo === 'esqueci') {
    els.tabs.classList.add('hidden');
    els.nomeWrap.classList.add('hidden');
    els.senhaWrap.classList.add('hidden');
    els.senha.required = false;
    els.linkEsqueciWrap.classList.add('hidden');
    els.voltarWrap.classList.remove('hidden');
    els.titulo.textContent = 'Redefinir senha';
    els.subtitulo.textContent = 'A gente manda um link pro seu e-mail pra você criar uma senha nova.';
    els.btn.textContent = 'Enviar link';
    return;
  }

  els.tabs.classList.remove('hidden');
  els.nomeWrap.classList.toggle('hidden', modo !== 'criar');
  els.senhaWrap.classList.remove('hidden');
  els.senha.required = true;
  els.linkEsqueciWrap.classList.remove('hidden');
  els.voltarWrap.classList.add('hidden');
  marcarAbaAtiva(els.tabEntrar, modo === 'entrar');
  marcarAbaAtiva(els.tabCriar, modo === 'criar');

  if (modo === 'entrar') {
    els.titulo.textContent = 'Entre na sua conta';
    els.subtitulo.textContent = 'Acesse pra salvar e comparar seus builds.';
    els.btn.textContent = 'Entrar';
    els.senha.autocomplete = 'current-password';
    els.senha.removeAttribute('minlength');
  } else {
    els.titulo.textContent = 'Criar sua conta';
    els.subtitulo.textContent = 'Leva menos de um minuto e você já entra direto, sem confirmar e-mail.';
    els.btn.textContent = 'Criar conta';
    els.senha.autocomplete = 'new-password';
    els.senha.setAttribute('minlength', '6');
  }
}

els.tabEntrar.addEventListener('click', () => setModo('entrar'));
els.tabCriar.addEventListener('click', () => setModo('criar'));
els.linkEsqueci.addEventListener('click', () => setModo('esqueci'));
els.voltar.addEventListener('click', () => setModo('entrar'));

els.toggleSenha.addEventListener('click', () => {
  const mostrando = els.senha.type === 'text';
  els.senha.type = mostrando ? 'password' : 'text';
  els.toggleSenha.setAttribute('aria-pressed', String(!mostrando));
  els.toggleSenha.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Ocultar senha');
  // Olho riscado quando a senha está visível
  els.iconeOlho.innerHTML = mostrando
    ? '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'
    : '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>';
});

els.form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limparMensagem();

  const email = els.email.value.trim();
  const senha = els.senha.value;

  if (!email) { mostrarMensagem('Digite seu e-mail.', 'erro'); els.email.focus(); return; }
  if (estado.modo !== 'esqueci') {
    if (!senha) { mostrarMensagem('Digite sua senha.', 'erro'); els.senha.focus(); return; }
    if (estado.modo === 'criar' && senha.length < 6) {
      mostrarMensagem('A senha precisa ter pelo menos 6 caracteres.', 'erro');
      els.senha.focus();
      return;
    }
  }

  const textoOriginal = els.btn.textContent;
  els.btn.disabled = true;
  els.btn.textContent = 'Um instante…';

  try {
    if (estado.modo === 'entrar') {
      const r = await entrarComEmail(email, senha);
      if (!r.ok) { mostrarMensagem(r.mensagem, 'erro'); return; }
      window.location.href = 'index.html';
      return;
    }

    if (estado.modo === 'criar') {
      // Cria a conta no Supabase e já entra com ela, sem verificação por e-mail
      const r = await criarConta(email, senha, els.nome.value);
      if (!r.ok) { mostrarMensagem(r.mensagem, 'erro'); return; }
      window.location.href = 'index.html';
      return;
    }

    if (estado.modo === 'esqueci') {
      const r = await redefinirSenha(email);
      if (!r.ok) { mostrarMensagem(r.mensagem, 'erro'); return; }
      mostrarMensagem('Link enviado! Confira seu e-mail para redefinir a senha.', 'sucesso');
    }
  } catch (erro) {
    mostrarMensagem('Não deu pra conectar agora. Tente de novo em instantes.', 'erro');
    console.error(erro);
  } finally {
    els.btn.disabled = false;
    els.btn.textContent = textoOriginal;
  }
});

// Se a pessoa já está logada, não faz sentido mostrar o login de novo.
(async function initAuth() {
  setModo('entrar');
  try {
    if (typeof sessaoAtual === 'function') {
      const sessao = await sessaoAtual();
      if (sessao) window.location.href = 'index.html';
    }
  } catch (erro) {
    console.error('Não foi possível checar a sessão:', erro);
  }
})();
