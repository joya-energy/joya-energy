import { STEG_ANALYSE_FACTURE_PROMPT } from './prompts/steg-analyse-facture.prompt.content';
import { STEG_EXTRACTION_FACTURE_PROMPT } from './prompts/steg-extraction-facture.prompt.content';

/**
 * Legacy full STEG prompt (extraction + financial study in one LLM call).
 * Kept for reference / rollback — production uses extraction + code.
 */
export function getStegAnalyseFacturePrompt(): string {
  return STEG_ANALYSE_FACTURE_PROMPT;
}

/** Stage 1 — extraction only (BT & MT). Calculations run in TypeScript after. */
export function getStegExtractionFacturePrompt(): string {
  return STEG_EXTRACTION_FACTURE_PROMPT;
}
