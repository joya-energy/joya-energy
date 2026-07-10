import { existsSync, readFileSync, statSync } from 'fs';
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
let cachedPromptMtimeMs = 0;
let cachedPromptPath: string | null = null;

/** Full STEG bill analysis agent prompt (BT & MT extraction + financial study). */
export function getStegAnalyseFacturePrompt(): string {
  const promptPath = resolvePromptPath();
  const mtimeMs = statSync(promptPath).mtimeMs;

  if (
    cachedPrompt === null
    || cachedPromptPath !== promptPath
    || cachedPromptMtimeMs !== mtimeMs
  ) {
    cachedPrompt = readFileSync(promptPath, 'utf8');
    cachedPromptPath = promptPath;
    cachedPromptMtimeMs = mtimeMs;
  }

  return cachedPrompt;
}
