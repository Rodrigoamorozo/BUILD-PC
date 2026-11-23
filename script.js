// script.js
// Alterna entre tema claro e escuro e lembra a escolha neste navegador.
// A primeira visita segue o tema do sistema (o <head> de cada página já aplica
// isso antes de desenhar, para a tela não piscar).

const html = document.documentElement;
const themeBtn = document.getElementById('theme-btn');
const themeLabel = document.getElementById('theme-label');

function atualizarRotuloTema() {
  if (!themeLabel) return;
  themeLabel.textContent = html.classList.contains('dark') ? 'Modo claro' : 'Modo escuro';
}

atualizarRotuloTema();

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    html.classList.toggle('dark');
    atualizarRotuloTema();

    try {
      localStorage.setItem('buildpc:tema', html.classList.contains('dark') ? 'escuro' : 'claro');
    } catch (erro) {
      // Navegador sem armazenamento: o tema só vale nesta página.
    }
  });
}
