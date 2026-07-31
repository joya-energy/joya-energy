import { generatedEnv } from './environment.prod.generated';

export const environment = {
  production: true,
  ...generatedEnv,
  customerAppUrl:
    (generatedEnv as { customerAppUrl?: string }).customerAppUrl
    ?? 'https://app.joya-energy.com',
};
