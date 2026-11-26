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
  fotoPreview: document.getElementById('foto-preview'),
  fotoArquivo: document.getElementById('foto-arquivo'),
  btnFoto: document.getElementById('btn-foto'),
  btnFotoRemover: document.getElementById('btn-foto-remover'),
  msgFoto: document.getElementById('foto-msg'),
};
let usuario = null;
if (typeof montarMedidorSenha === 'function') montarMedidorSenha(els.senhaNova);

// Mostra a foto (ou a inicial do nome) no círculo do perfil
function desenharFoto() {
  const url = urlAvatarSegura(usuario);
  els.fotoPreview.replaceChildren();
  if (url) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.className = 'h-full w-full object-cover';
    els.fotoPreview.appendChild(img);
  } else {
    els.fotoPreview.textContent = (nomeExibicao(usuario).charAt(0) || '?').toUpperCase();
  }
  els.btnFotoRemover.classList.toggle('hidden', !url);
}

// Recorta em quadrado e reduz para 256 px em JPEG (some metadados/EXIF e fica leve)
function prepararFoto(arquivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      const lado = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 256, 256);
      ctx.drawImage(img, (img.naturalWidth - lado) / 2, (img.naturalHeight - lado) / 2, lado, lado, 0, 0, 256, 256);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Falha ao converter a imagem.'))), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não deu pra ler essa imagem.')); };
    img.src = url;
  });
}

async function atualizarUsuario() {
  const sessao = await sessaoAtual();
  if (sessao) usuario = sessao.user;
  desenharFoto();
  if (typeof renderConta === 'function') renderConta();
}

els.btnFoto.addEventListener('click', () => els.fotoArquivo.click());

els.fotoArquivo.addEventListener('change', async () => {
  const arquivo = els.fotoArquivo.files[0];
  els.fotoArquivo.value = '';
  if (!arquivo) return;
  limparMsg(els.msgFoto);
  if (!/^image\/(png|jpeg|webp)$/.test(arquivo.type)) {
    mostrarMsg(els.msgFoto, 'Escolha uma imagem JPG, PNG ou WebP.', 'erro');
    return;
  }
  if (arquivo.size > 10 * 1024 * 1024) {
    mostrarMsg(els.msgFoto, 'A imagem é grande demais (máximo 10 MB).', 'erro');
    return;
  }
  await comBotao(els.btnFoto, 'Enviando…', async () => {
    try {
      const blob = await prepararFoto(arquivo);
      const r = await enviarAvatar(usuario, blob);
      if (!r.ok) { mostrarMsg(els.msgFoto, r.mensagem, 'erro'); return; }
      await atualizarUsuario();
      mostrarMsg(els.msgFoto, 'Foto atualizada.', 'sucesso');
    } catch (erro) {
      mostrarMsg(els.msgFoto, erro.message || 'Não deu pra enviar agora. Tente de novo.', 'erro');
      console.error(erro);
    }
  });
});

els.btnFotoRemover.addEventListener('click', async () => {
  limparMsg(els.msgFoto);
  await comBotao(els.btnFotoRemover, 'Removendo…', async () => {
    try {
      const r = await removerAvatar(usuario);
      if (!r.ok) { mostrarMsg(els.msgFoto, r.mensagem, 'erro'); return; }
      await atualizarUsuario();
      mostrarMsg(els.msgFoto, 'Foto removida.', 'sucesso');
    } catch (erro) {
      mostrarMsg(els.msgFoto, 'Não deu pra remover agora. Tente de novo.', 'erro');
      console.error(erro);
    }
  });
});

function limparMsg(caixa) {
  caixa.textContent = '';
  caixa.className = 'hidden mb-4 text-sm rounded-lg px-3 py-2';
}

function mostrarMsg(caixa, texto, tipo) {
  caixa.textContent = texto;
  const cores = tipo === 'sucesso'
    ? 'border border-cyan-light/40 dark:border-cyan/40 bg-cyan-light/10 dark:bg-cyan/10 text-cyan-light dark:text-cyan'
    : 'border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400';
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
  if (nova.length < SENHA_MIN) {
    mostrarMsg(els.msgSenha, `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`, 'erro');
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
  usuario = sessao.user;
  desenharFoto();
  els.card.classList.remove('hidden');
})();
