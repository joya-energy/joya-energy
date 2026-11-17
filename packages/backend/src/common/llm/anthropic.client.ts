import Anthropic from '@anthropic-ai/sdk';
import { ServerConfig } from '@backend/configs/server.config';
import {
  ANTHROPIC_DEFAULT_MAX_TOKENS,
  ANTHROPIC_DEFAULT_MODEL,
} from './llm.constants';

const SUPPORTED_IMAGE_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const);

type AnthropicImageMediaType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp';

export interface VisionCompletionParams {
  system: string;
  prompt: string;
  dataUrl: string;
  maxTokens: number;
  /** Extraction defaults to low effort (fast, deterministic). */
  effort?: 'low' | 'medium' | 'high';
}

export function createAnthropicClient(): Anthropic {
  const { apiKey } = ServerConfig.config.anthropic;
  return new Anthropic({ apiKey });
}

export function getLlmModel(): string {
  const model = ServerConfig.config.anthropic.model;
  return model !== '' ? model : ANTHROPIC_DEFAULT_MODEL;
}

export function resolveLlmMaxTokens(fallback: number = ANTHROPIC_DEFAULT_MAX_TOKENS): number {
  const fromEnv = Number.parseInt(
    process.env.ANTHROPIC_MAX_TOKENS ?? process.env.OPENROUTER_MAX_TOKENS ?? '',
    10
  );
  if (Number.isFinite(fromEnv) && fromEnv >= 800) {
    return fromEnv;
  }
  return fallback;
}

export function parseDataUrl(dataUrl: string): {
  mediaType: AnthropicImageMediaType;
  base64Data: string;
} {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (match === null) {
    throw new Error('Invalid image data URL for Anthropic vision request');
  }
  const rawMediaType = match[1].toLowerCase();
  const mediaType =
    rawMediaType === 'image/jpg' ? 'image/jpeg' : rawMediaType;
  if (!SUPPORTED_IMAGE_MEDIA_TYPES.has(mediaType as AnthropicImageMediaType)) {
    throw new Error(
      `Unsupported image media type for Anthropic: ${rawMediaType}. Use jpeg, png, gif, or webp.`
    );
  }
  return {
    mediaType: mediaType as AnthropicImageMediaType,
    base64Data: match[2],
  };
}

function extractTextContent(response: Anthropic.Message): string {
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );
  return textBlocks.map((block) => block.text).join('\n').trim();
}

/**
 * Vision + text completion via Anthropic Messages API.
 * Returns the assistant text (expect JSON from our prompts).
 */
export async function completeVisionExtraction(
  client: Anthropic,
  params: VisionCompletionParams
): Promise<string> {
  const model = getLlmModel();
  const { mediaType, base64Data } = parseDataUrl(params.dataUrl);

  const response = await client.messages.create({
    model,
    max_tokens: params.maxTokens,
    output_config: {
      effort: params.effort ?? 'low',
    },
    system: params.system,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: params.prompt },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Data,
            },
          },
        ],
      },
    ],
  });

  const content = extractTextContent(response);
  if (content === '') {
    throw new Error(
      `No content returned from Anthropic (stop_reason=${response.stop_reason ?? 'unknown'})`
    );
  }
  return content;
}

export function getAnthropicDefaults(): { model: string } {
  return { model: ANTHROPIC_DEFAULT_MODEL };
}
