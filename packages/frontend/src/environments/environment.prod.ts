import { generatedEnv } from './environment.prod.generated';

export const environment = {
  production: true,
  ...generatedEnv,
};
