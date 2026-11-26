// feedback.js
// Formulário de feedback: grava na tabela "feedback" do Supabase (só envio; leitura pelo painel).
const fb = {
  form: document.getElementById('form-feedback'),
  msg: document.getElementById('fb-mensagem'),
  email: document.getElementById('fb-email'),
  isca: document.getElementById('fb-site'),
  contador: document.getElementById('fb-contador'),
  botao: document.getElementById('btn-feedback'),
  aviso: document.getElementById('fb-msg'),
};
const CHAVE_ULTIMO_FEEDBACK = 'buildpc:ultimo-feedback';
const INTERVALO_MS = 30000;

function avisoFb(texto, tipo) {
  fb.aviso.textContent = texto;
  const cores = tipo === 'sucesso'
    ? 'border border-cyan-light/40 dark:border-cyan/40 bg-cyan-light/10 dark:bg-cyan/10 text-cyan-light dark:text-cyan'
    : 'border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400';
  fb.aviso.className = `mb-4 text-sm rounded-lg px-3 py-2 ${cores}`;
}

fb.msg.addEventListener('input', () => {
  fb.contador.textContent = `${fb.msg.value.length} / 2000`;
});

fb.form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  fb.aviso.className = 'hidden mb-4 text-sm rounded-lg px-3 py-2';

  const mensagem = fb.msg.value.trim();
  const email = fb.email.value.trim();
  const tipo = (fb.form.querySelector('input[name="tipo"]:checked') || {}).value || 'outro';

  if (mensagem.length < 5) { avisoFb('Escreva pelo menos 5 caracteres.', 'erro'); fb.msg.focus(); return; }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { avisoFb('Esse e-mail não parece válido. Corrija ou deixe em branco.', 'erro'); fb.email.focus(); return; }
  if (fb.isca.value) { avisoFb('Obrigado! Feedback enviado.', 'sucesso'); return; } // robô: finge que enviou

  try {
    const ultimo = Number(localStorage.getItem(CHAVE_ULTIMO_FEEDBACK)) || 0;
    if (Date.now() - ultimo < INTERVALO_MS) { avisoFb('Espere alguns segundos antes de enviar outro.', 'erro'); return; }
  } catch { /* sem armazenamento: segue */ }

  fb.botao.disabled = true;
  fb.botao.textContent = 'Enviando…';
  try {
    const r = await enviarFeedback({ tipo, mensagem, email: email || null, pagina: document.referrer ? new URL(document.referrer).pathname.slice(0, 200) : null });
    if (!r.ok) { avisoFb(r.mensagem, 'erro'); return; }
    try { localStorage.setItem(CHAVE_ULTIMO_FEEDBACK, String(Date.now())); } catch { /* ok */ }
    fb.form.reset();
    fb.contador.textContent = '0 / 2000';
    avisoFb('Obrigado! Feedback enviado.', 'sucesso');
  } catch (erro) {
    avisoFb('Não deu pra enviar agora. Tente de novo em instantes.', 'erro');
    console.error(erro);
  } finally {
    fb.botao.disabled = false;
    fb.botao.textContent = 'Enviar feedback';
  }
});
