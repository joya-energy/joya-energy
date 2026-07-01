import OpenAI from 'openai';
import { ServerConfig } from '@backend/configs/server.config';
import {
  OPENROUTER_DEFAULT_APP_NAME,
  OPENROUTER_DEFAULT_BASE_URL,
  OPENROUTER_DEFAULT_MODEL,
} from './llm.constants';

export function createOpenRouterClient(): OpenAI {
  const { apiKey, baseUrl, appUrl, appName } = ServerConfig.config.openrouter;

  const headers: Record<string, string> = {
    'X-Title': appName,
  };

  if (appUrl !== '') {
    headers['HTTP-Referer'] = appUrl;
  }

  return new OpenAI({
    apiKey,
    baseURL: baseUrl,
    defaultHeaders: headers,
  });
}

export function getLlmModel(): string {
  const model = ServerConfig.config.openrouter.model;
  return model !== '' ? model : OPENROUTER_DEFAULT_MODEL;
}

export function getOpenRouterDefaults(): {
  baseUrl: string;
  model: string;
  appName: string;
} {
  return {
    baseUrl: OPENROUTER_DEFAULT_BASE_URL,
    model: OPENROUTER_DEFAULT_MODEL,
    appName: OPENROUTER_DEFAULT_APP_NAME,
  };
}
