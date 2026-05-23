/**
 * migrate-assets.mjs
 *
 * Descarga todos os assets do Supabase Storage usando URLs públicas.
 * NÃO precisa de service role key — os buckets eram públicos.
 *
 * Uso:
 *   node scripts/migrate-assets.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SUPABASE_URL = 'https://qwaoeikvwwthlgcpagyz.supabase.co';
const BASE = `${SUPABASE_URL}/storage/v1/object/public`;

// ─── Lista completa de assets conhecidos ──────────────────────────────────────

// 280 frames de animação: frame_000_delay-0.033s.webp … frame_279_delay-0.033s.webp
const ANIMATION_FRAMES = Array.from({ length: 280 }, (_, i) =>
  `frame_${i.toString().padStart(3, '0')}_delay-0.033s.webp`
);

const ASSETS = [
  // Animação de fundo
  ...ANIMATION_FRAMES.map(f => ({ bucket: 'Nuvem LooP', file: f })),
  // Logótipo principal
  { bucket: 'Logo Sabermais', file: 'Sabermais_Logo.png' },
  // Logos dos institutos parceiros
  { bucket: 'Logo Institutos', file: 'med.png' },
  { bucket: 'Logo Institutos', file: 'insignia.png' },
  { bucket: 'Logo Institutos', file: 'infqe.png' },
  { bucket: 'Logo Institutos', file: 'icamoes.png' },
];

// ─── Funções auxiliares ────────────────────────────────────────────────────────

async function downloadAsset(bucket, file) {
  const url = `${BASE}/${encodeURIComponent(bucket)}/${encodeURIComponent(file)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function saveToDisk(bucket, file, buffer) {
  const dest = join(ROOT, 'storage', bucket, file);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buffer);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function migrate() {
  let ok = 0, skipped = 0, errors = 0;

  for (const { bucket, file } of ASSETS) {
    const dest = join(ROOT, 'storage', bucket, file);

    if (existsSync(dest)) {
      skipped++;
      continue;
    }

    process.stdout.write(`↓ ${bucket}/${file} ... `);
    try {
      const buffer = await downloadAsset(bucket, file);
      saveToDisk(bucket, file, buffer);
      process.stdout.write(`OK (${(buffer.length / 1024).toFixed(1)} KB)\n`);
      ok++;
    } catch (err) {
      process.stdout.write(`ERRO: ${err.message}\n`);
      errors++;
    }
  }

  console.log(`\n✅ ${ok} descarregados, ${skipped} já existentes, ${errors} erros.`);
  if (errors > 0) {
    console.log('Pode correr o script novamente — ficheiros já descarregados são ignorados.');
  }
}

migrate().catch(err => { console.error('Erro fatal:', err); process.exit(1); });
