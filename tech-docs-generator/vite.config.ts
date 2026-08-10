import { defineConfig, loadEnv, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { getSiteOutputRoot, getTechDocsViteCacheDir } from './scripts/output-contract.mjs'
import { adminSupabaseDefine } from './scripts/resolve-admin-supabase-env.ts'
import { repoLivePlugin } from './scripts/vite-plugin-repo-live.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

export function createViteConfig(mode: string): UserConfig {
  const fileEnv = loadEnv(mode, repoRoot, '')
  const env = { ...process.env, ...fileEnv }

  return {
    cacheDir: getTechDocsViteCacheDir(repoRoot),
    define: adminSupabaseDefine(env),
    plugins: [react(), tailwindcss(), repoLivePlugin({ repoRoot })],
    server: {
      // Always off product Next (:3000). Fail if 3001 is taken — do not steal 3000.
      port: 3001,
      strictPort: true,
      host: true,
      fs: {
        // Allow serving FOCSS from site/focss/ (and rest of monorepo)
        allow: [repoRoot],
      },
    },
    preview: {
      port: 3001,
      strictPort: true,
      host: true,
    },
    build: {
      // Repo root (not site/) — see AGENTS.md layout. Write site directly; no .tmp stage.
      outDir: getSiteOutputRoot(repoRoot),
      emptyOutDir: true,
    },
    // Absolute base so /tech-stack and other client routes load /assets/* (not
    // ./assets relative to the deep path). Relative base broke hard-refresh on Vercel.
    base: '/',
  }
}

export default defineConfig(({ mode }) => createViteConfig(mode))
