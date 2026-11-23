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
        // copper = azul da marca: fundo de botão com texto branco (10:1) e texto no tema claro.
        copper: { DEFAULT: '#241ec9', light: '#241ec9' },
        // accent = o mesmo azul, mais claro, para TEXTO e bordas no tema escuro (5,4:1; o copper dá 1,9:1).
        accent: { DEFAULT: '#7C78F0' },
        // field = borda de campos de formulário (3:1 contra o fundo).
        field:  { DEFAULT: '#5B6678', light: '#7A8494' },
        cyan:   { DEFAULT: '#63D9CC', light: '#0F6F66' },
        // Cobre de verdade — só decorativo (trilhas de placa-mãe), nunca em texto/botão.
        trace:  { DEFAULT: '#C97B3D', light: '#B8632A' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
}
