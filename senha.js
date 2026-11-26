// senha.js
// Regras de senha e medidor de força (fraca / média / forte).
// Usado no cadastro (auth.js) e na troca de senha (perfil.js).
// O medidor é só uma dica: a única regra que bloqueia é o mínimo de caracteres.

const SENHA_MIN = 5;
const SENHA_MAX = 72; // limite real do bcrypt, que o Supabase usa

const SENHAS_COMUNS = ['12345', '123456', '1234567', '12345678', '123456789', '1234567890', '111111', '000000',
  'senha', 'senha123', 'password', 'qwerty', 'qwerty123', 'abc123', 'abcde', 'abcdef', 'admin', 'admin123',
  'iloveyou', 'brasil', 'brasil123', 'flamengo', 'corinthians', 'gabriel', 'mudar123'];

// Devolve { nivel: 0..3, rotulo, dica }. 0 = ainda vazia; 1 fraca; 2 média; 3 forte.
function avaliarSenha(senha) {
  const s = senha || '';
  if (!s) return { nivel: 0, rotulo: '', dica: '' };

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(s)).length;
  const unicos = new Set(s.toLowerCase()).size;
  const comum = SENHAS_COMUNS.includes(s.toLowerCase());
  const sequencia = /^(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwer|asdf)/i.test(s);

  let pontos = 0;
  if (s.length >= 8) pontos += 1;
  if (s.length >= 12) pontos += 1;
  if (s.length >= 16) pontos += 1;
  if (classes >= 2) pontos += 1;
  if (classes >= 3) pontos += 1;
  if (unicos >= 5) pontos += 1;
  if (s.length < SENHA_MIN || comum || unicos <= 2) pontos = 0;
  if (sequencia) pontos = Math.min(pontos, 1);

  if (pontos <= 2) {
    let dica = 'Use 8 ou mais caracteres, misturando letras e números.';
    if (s.length < SENHA_MIN) dica = `Faltam ${SENHA_MIN - s.length} caractere(s) para o mínimo.`;
    else if (comum || sequencia) dica = 'Evite sequências e senhas muito usadas.';
    return { nivel: 1, rotulo: 'Fraca', dica };
  }
  if (pontos <= 4) return { nivel: 2, rotulo: 'Média', dica: 'Com 12 ou mais caracteres e símbolos ela fica forte.' };
  return { nivel: 3, rotulo: 'Forte', dica: 'Boa senha.' };
}

// Cria o medidor logo abaixo do campo e o mantém atualizado enquanto a pessoa digita.
// Devolve { mostrar(bool) } para esconder no modo "entrar".
function montarMedidorSenha(campo) {
  const caixa = document.createElement('div');
  caixa.className = 'hidden mt-2';
  caixa.innerHTML =
    '<div class="meter-segmented h-1.5" aria-hidden="true">' +
    '<span></span><span></span><span></span></div>' +
    '<p class="mt-1.5 text-xs" aria-live="polite"><strong class="medidor-rotulo font-semibold"></strong> <span class="medidor-dica text-muted-light dark:text-muted"></span></p>';
  const alvo = campo.closest('.relative') || campo;
  alvo.insertAdjacentElement('afterend', caixa);

  const segs = caixa.querySelectorAll('.meter-segmented > span');
  const rotulo = caixa.querySelector('.medidor-rotulo');
  const dica = caixa.querySelector('.medidor-dica');
  const COR_BARRA = ['', 'bg-red-600 dark:bg-red-400', 'bg-amber-600 dark:bg-yellow-400', 'bg-cyan-light dark:bg-cyan'];
  const COR_TEXTO = ['', 'text-red-700 dark:text-red-400', 'text-amber-800 dark:text-yellow-500', 'text-cyan-light dark:text-cyan'];
  const VAZIA = 'bg-line-light dark:bg-line';
  let ativo = true;

  function atualizar() {
    const r = avaliarSenha(campo.value);
    caixa.classList.toggle('hidden', !ativo || r.nivel === 0);
    segs.forEach((seg, i) => { seg.className = i < r.nivel ? COR_BARRA[r.nivel] : VAZIA; });
    rotulo.className = 'medidor-rotulo font-semibold ' + (COR_TEXTO[r.nivel] || '');
    rotulo.textContent = r.nivel ? 'Senha ' + r.rotulo.toLowerCase() + '.' : '';
    dica.textContent = r.dica;
  }

  campo.addEventListener('input', atualizar);
  atualizar();
  return { mostrar(v) { ativo = v; atualizar(); } };
}
