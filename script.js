// script.js
// Alterna entre tema claro e escuro (o "Monte seu PC" agora é um link
// <a> de verdade no HTML, não precisa mais de JS pra navegar).

const html = document.documentElement;
const themeBtn = document.getElementById('theme-btn');
const themeLabel = document.getElementById('theme-label');

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    html.classList.toggle('dark');
    const escuro = html.classList.contains('dark');
    themeLabel.textContent = escuro ? 'Modo claro' : 'Modo escuro';
  });
}
