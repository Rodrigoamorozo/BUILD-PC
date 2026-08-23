// Configuração do Tailwind: cores e fontes do site BuildPC.
// Esse arquivo só existe porque estamos usando o Tailwind via CDN
// (sem instalação/build). Ele roda antes do resto da página.
tailwind.config = {
  darkMode: 'class', // tema muda trocando a classe "dark" no <html>
  theme: {
    extend: {
      colors: {
        bg:     { DEFAULT: '#0A0D12', light: '#F1F2F5' },
        panel:  { DEFAULT: '#12161D', light: '#FFFFFF' },
        line:   { DEFAULT: '#262D38', light: '#D7DAE0' },
        ink:    { DEFAULT: '#ECEEF1', light: '#171A1F' },
        muted:  { DEFAULT: '#8F99A8', light: '#5C6470' },
        copper: { DEFAULT: '#241ec9', light: '#241ec9' },
        cyan:   { DEFAULT: '#63D9CC', light: '#158C81' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
}
