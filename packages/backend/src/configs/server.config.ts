import { NodeEnv } from "./node-env.enum";
import dotEnv from 'dotenv';
export interface IServerConfig {
    nodeEnv: string;
    dbUri: string;
}
export class ServerConfig {
    private static _config: Partial<IServerConfig> | null = null;

    public static get config(): IServerConfig {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!this._config) {
            this.initConfig();
        }

        return this._config as IServerConfig;
    }
    public static isEnv(env: NodeEnv): boolean {
        return this.config.nodeEnv === env;
    }

    public static isProduction(): boolean {
        return this.config.nodeEnv === 'production';
    }

    public static isNotProduction(): boolean {
        return !ServerConfig.isProduction();
    }

    public static isDebug(): boolean {
        return this.config.nodeEnv === NodeEnv.DEV;
    }
    public static initConfig(env?: NodeEnv): void {
        const nodeEnv = process.env.NODE_ENV || env || NodeEnv.DEV;
        dotEnv.config({
            path: `.env.${nodeEnv}`
        });
        this._config = {
            nodeEnv: process.env.NODE_ENV,
            dbUri: process.env.DB_URI
        };
    }
}