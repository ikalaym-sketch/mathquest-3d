/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // 奇幻標題字 / 內文字（於 index.html 以 Google Fonts 載入）
        display: ['"Cinzel"', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // 薩爾達風配色：暖金、古銅、深藍夜、草綠
        hyrule: {
          gold: '#e8c37a',
          bronze: '#8a6a3b',
          night: '#0f1a2e',
          grass: '#7ac74f',
          sky: '#7fb8d9',
        },
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};
