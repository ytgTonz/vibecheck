/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        bebas: ['BebasNeue_400Regular'],
        serif: ['SourceSerif4_400Regular'],
        'serif-semibold': ['SourceSerif4_600SemiBold'],
        mono: ['IBMPlexMono_400Regular'],
      },
      colors: {
        brand: {
          red: '#FF2D55',
          lime: '#BFFF00',
        },
      },
    },
  },
  plugins: [],
};
