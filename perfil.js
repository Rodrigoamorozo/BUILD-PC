// perfil.js
// Tela "Editar perfil": troca o nome e a senha da conta no Supabase.
// Usa as funções de supabase.js (sessaoAtual, atualizarNome, alterarSenha).
// Quem não está logado é mandado para o login.

const els = {
  card: document.getElementById('perfil-card'),
  email: document.getElementById('perfil-email'),
  nome: document.getElementById('perfil-nome'),
  formPerfil: document.getElementById('form-perfil'),
  btnPerfil: document.getElementById('btn-perfil'),
  msgPerfil: document.getElementById('perfil-msg'),
  formSenha: document.getElementById('form-senha'),
  senhaNova: document.getElementById('senha-nova'),
  senhaConfirma: document.getElementById('senha-confirma'),
  btnSenha: document.getElementById('btn-senha'),
  msgSenha: document.getElementById('senha-msg'),
};

function limparMsg(caixa) {
  caixa.textContent = '';
  caixa.className = 'hidden mb-4 text-sm rounded-lg px-3 py-2';
}

function mostrarMsg(caixa, texto, tipo) {
  caixa.textContent = texto;
  const cores = tipo === 'sucesso'
    ? 'border border-cyan-light/40 dark:border-cyan/40 bg-cyan-light/10 dark:bg-cyan/10 text-cyan-light dark:text-cyan'
    : 'border border-red-500/40 bg-red-500/10 text-red-400';
  caixa.className = `mb-4 text-sm rounded-lg px-3 py-2 ${cores}`;
}

// Roda uma ação com o botão travado e o texto trocado, e restaura no fim
async function comBotao(botao, textoEnquanto, acao) {
  const original = botao.textContent;
  botao.disabled = true;
  botao.textContent = textoEnquanto;
  try {
    await acao();
  } finally {
    botao.disabled = false;
    botao.textContent = original;
  }
}

els.formPerfil.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limparMsg(els.msgPerfil);
  await comBotao(els.btnPerfil, 'Salvando…', async () => {
    try {
      const r = await atualizarNome(els.nome.value);
      if (!r.ok) { mostrarMsg(els.msgPerfil, r.mensagem, 'erro'); return; }
      mostrarMsg(els.msgPerfil, 'Nome atualizado.', 'sucesso');
      if (typeof renderConta === 'function') renderConta();
    } catch (erro) {
      mostrarMsg(els.msgPerfil, 'Não deu pra conectar agora. Tente de novo em instantes.', 'erro');
      console.error(erro);
    }
  });
});

els.formSenha.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limparMsg(els.msgSenha);

  const nova = els.senhaNova.value;
  const confirma = els.senhaConfirma.value;
  if (nova.length < 6) {
    mostrarMsg(els.msgSenha, 'A senha precisa ter pelo menos 6 caracteres.', 'erro');
    els.senhaNova.focus();
    return;
  }
  if (nova !== confirma) {
    mostrarMsg(els.msgSenha, 'As senhas não são iguais.', 'erro');
    els.senhaConfirma.focus();
    return;
  }

  await comBotao(els.btnSenha, 'Alterando…', async () => {
    try {
      const r = await alterarSenha(nova);
      if (!r.ok) { mostrarMsg(els.msgSenha, r.mensagem, 'erro'); return; }
      els.senhaNova.value = '';
      els.senhaConfirma.value = '';
      mostrarMsg(els.msgSenha, 'Senha alterada. Use a nova senha no próximo login.', 'sucesso');
    } catch (erro) {
      mostrarMsg(els.msgSenha, 'Não deu pra conectar agora. Tente de novo em instantes.', 'erro');
      console.error(erro);
    }
  });
});

(async function initPerfil() {
  let sessao = null;
  try {
    if (typeof sessaoAtual === 'function') sessao = await sessaoAtual();
  } catch (erro) {
    console.error('Não foi possível checar a sessão:', erro);
  }
  if (!sessao) {
    window.location.href = 'login.html';
    return;
  }
  els.email.value = sessao.user.email || '';
  els.nome.value = (sessao.user.user_metadata?.nome || '').trim();
  els.card.classList.remove('hidden');
})();
