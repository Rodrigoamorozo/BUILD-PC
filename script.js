// script.js
// 1) Alterna entre tema claro e escuro
// 2) Manda o usuário pra tela de montagem ao clicar em "Monte seu PC"
// (montarBtn só existe na página inicial, por isso o "if" antes de usá-lo)

const html = document.documentElement;
const themeBtn = document.getElementById('theme-btn');
const themeLabel = document.getElementById('theme-label');
const montarBtn = document.getElementById('montar-btn');

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    html.classList.toggle('dark');
    themeLabel.textContent = html.classList.contains('dark') ? 'MODO EMO' : 'MODO BEM';
  });
}

if (montarBtn) {
  montarBtn.addEventListener('click', () => {
    window.location.href = 'buildpc.html';
  });
}
