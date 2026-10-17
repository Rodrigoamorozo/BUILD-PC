// supabase.js
// Conexão do site com o Supabase: peças (banco de dados) e conta (login).
// URL e chave pública (anon) ficam em Project Settings > API, no supabase.com.
// A chave "anon" pode ficar no front-end — quem protege os dados é a RLS.

const SUPABASE_URL = 'https://bsunzvivyfalkstyxpno.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdW56dml2eWZhbGtzdHl4cG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NjgwMjEsImV4cCI6MjEwMzA0NDAyMX0.mt9lppz7_VCvQxduoD_ovl5jLdPwo8UUEXtFvDR7iTE';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------------------------------------------
// PEÇAS (banco de dados)
// ---------------------------------------------------------------

// Guarda o último erro de banco pra a tela de montagem poder avisar que
// caiu no modo "peças de exemplo" (em vez de falhar em silêncio).
let ultimoErroBanco = null;

// Busca todas as peças da tabela "pecas"
async function buscarPecas() {
  ultimoErroBanco = null;
  const { data, error } = await db.from('pecas').select('*');
  if (error) {
    ultimoErroBanco = error.message;
    console.error('Erro ao buscar peças:', error.message);
    return [];
  }
  return data;
}

// Busca só as peças de uma categoria (ex: "cpu", "placa-mae")
async function buscarPecasPorCategoria(categoria) {
  const { data, error } = await db.from('pecas').select('*').eq('categoria', categoria);
  if (error) {
    console.error('Erro ao buscar peças:', error.message);
    return [];
  }
  return data;
}
async function buscarBenchmarksDoPar(cpuId, gpuId) {
  const { data, error } = await db
    .from('benchmarks_pares')
    .select(`
      id,
      cpu_id,
      gpu_id,
      jogo,
      resolucao,
      qualidade,
      fps_medio,
      fps_1_low,
      limitante_medido,
      fonte,
      fonte_url,
      data_teste,
      metodologia
    `)
    .eq('cpu_id', cpuId)
    .eq('gpu_id', gpuId)
    .order('data_teste', { ascending: false });

  if (error) {
    console.error('Erro ao buscar benchmarks:', error.message);
    throw error;
  }

  return data || [];
}


// ---------------------------------------------------------------
// CONTA (login) — usadas por auth.js, conta.js e perfil.js
// Todas devolvem { ok: true } ou { ok: false, mensagem } (nunca lançam
// erro de login/senha; só falha de rede cai no catch de quem chamou).
// ---------------------------------------------------------------

// Traduz os erros do Supabase Auth pra mensagens em português.
function traduzirErroAuth(erro) {
  const codigo = erro && erro.code;
  const msg = ((erro && erro.message) || '').toLowerCase();

  if (codigo === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (codigo === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'Esse e-mail ainda não foi confirmado. Confira sua caixa de entrada.';
  if (codigo === 'user_already_exists' || msg.includes('already registered')) return 'Já existe uma conta com esse e-mail. Tente entrar.';
  if (codigo === 'weak_password' || msg.includes('at least 6')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (codigo === 'same_password' || msg.includes('different from the old')) return 'A nova senha precisa ser diferente da atual.';
  if (codigo === 'email_address_invalid' || msg.includes('invalid format') || msg.includes('is invalid')) return 'Esse e-mail não parece válido.';
  if (codigo === 'signup_disabled' || msg.includes('signups not allowed')) return 'O cadastro de novas contas está desativado no momento.';
  if (codigo === 'over_email_send_rate_limit' || codigo === 'over_request_rate_limit' || msg.includes('rate limit')) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'Não deu pra conectar ao servidor. Confira sua internet (ou se o projeto do Supabase está ativo).';
  return 'Algo deu errado: ' + (erro && erro.message ? erro.message : 'erro desconhecido') + '.';
}

// Sessão atual (ou null se ninguém logado)
async function sessaoAtual() {
  const { data, error } = await db.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

// Nome pra mostrar no menu: nome salvo no perfil, senão o começo do e-mail.
function nomeExibicao(user) {
  const nome = ((user && user.user_metadata && user.user_metadata.nome) || '').trim();
  if (nome) return nome;
  const email = (user && user.email) || '';
  return email.split('@')[0] || 'Conta';
}

async function entrarComEmail(email, senha) {
  const { error } = await db.auth.signInWithPassword({ email, password: senha });
  if (error) return { ok: false, mensagem: traduzirErroAuth(error) };
  return { ok: true };
}

async function criarConta(email, senha, nome) {
  const { data, error } = await db.auth.signUp({
    email,
    password: senha,
    options: { data: { nome: (nome || '').trim() } },
  });
  if (error) return { ok: false, mensagem: traduzirErroAuth(error) };

  // Com "Confirm email" LIGADO no Supabase, o cadastro funciona mas não
  // devolve sessão: a pessoa só entra depois de clicar no link do e-mail.
  if (!data.session) {
    return {
      ok: false,
      mensagem: 'Conta criada! Enviamos um link de confirmação pro seu e-mail — clique nele e depois entre. ' +
        '(Pra entrar direto, desligue "Confirm email" em Authentication > Providers > Email, no Supabase.)',
    };
  }
  return { ok: true };
}

// Manda o link de "esqueci minha senha". O link volta pra perfil.html,
// onde a pessoa já chega logada e pode trocar a senha.
async function redefinirSenha(email) {
  const redirectTo = new URL('perfil.html', window.location.href).href;
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { ok: false, mensagem: traduzirErroAuth(error) };
  return { ok: true };
}

async function sair() {
  const { error } = await db.auth.signOut();
  if (error) throw error;
}

async function atualizarNome(nome) {
  const { error } = await db.auth.updateUser({ data: { nome: (nome || '').trim() } });
  if (error) return { ok: false, mensagem: traduzirErroAuth(error) };
  return { ok: true };
}

async function alterarSenha(novaSenha) {
  const { error } = await db.auth.updateUser({ password: novaSenha });
  if (error) return { ok: false, mensagem: traduzirErroAuth(error) };
  return { ok: true };
}
