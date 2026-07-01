import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // Three.js / R3F + GSAP hooks mutate state imperatively.
  // React Compiler's immutability + refs-during-render rules are
  // fundamentally incompatible with this imperative pattern.
  {
    files: [
      'src/KiraKiraVortex.tsx',
      'src/SparkleSystem.tsx',
      'src/hooks/useScrollReveal.ts',
      'src/components/HUD.tsx',
      'src/components/NavPill.tsx',
      'src/components/AudioBar.tsx',
      'src/components/PsycommuBoot.tsx',
      'src/components/ScrollProgress.tsx',
    ],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
    },
  },
])
