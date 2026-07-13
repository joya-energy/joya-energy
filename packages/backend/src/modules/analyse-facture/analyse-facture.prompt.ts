import { STEG_ANALYSE_FACTURE_PROMPT } from './prompts/steg-analyse-facture.prompt.content';

/** Full STEG bill analysis agent prompt (BT & MT extraction + financial study). */
export function getStegAnalyseFacturePrompt(): string {
  return STEG_ANALYSE_FACTURE_PROMPT;
}
