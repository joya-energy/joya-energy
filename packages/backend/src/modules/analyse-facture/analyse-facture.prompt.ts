import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function resolvePromptPath(): string {
  const candidates = [
    join(__dirname, 'prompts', 'steg-analyse-facture.prompt.txt'),
    join(
      process.cwd(),
      'packages/backend/src/modules/analyse-facture/prompts/steg-analyse-facture.prompt.txt'
    ),
    join(
      process.cwd(),
      'dist/packages/backend/src/modules/analyse-facture/prompts/steg-analyse-facture.prompt.txt'
    ),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('STEG analyse-facture prompt file not found');
}

let cachedPrompt: string | null = null;

/** Full STEG bill analysis agent prompt (BT & MT extraction + financial study). */
export function getStegAnalyseFacturePrompt(): string {
  if (cachedPrompt === null) {
    cachedPrompt = readFileSync(resolvePromptPath(), 'utf8');
  }
  return cachedPrompt;
}
