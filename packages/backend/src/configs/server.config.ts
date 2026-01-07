import { isNotNullish } from "@shared/functions/nullish";
import { NodeEnv } from "./node-env.enum";
import dotEnv from 'dotenv';
export interface IServerConfig {
    nodeEnv: string;
    dbUri: string;
    openaiApiKey: string;
    jwtSecret: string;
    logLevel: string;
    port: number;
    energy: {
        costPerKwh: number;
        costPerKwp: number;
        auditKCh: number;
        auditKFr: number;
        auditEcsGasEff: number;
        auditEcsSolarCoverage: number;
        auditEcsSolarAppointEff: number;
        auditEcsPacCop: number;
    };
    googleMaps: {
        apiKey: string;
        apiUrl: string;
    };
    nasaPower: {
        apiUrl: string;
        community: string;
        parameter: string;
    };

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
            dbUri: process.env.DB_URI,
            openaiApiKey: process.env.OPENAI_API_KEY,
            jwtSecret: process.env.JWT_SECRET,
            logLevel: process.env.LOG_LEVEL,
            port: Number(process.env.PORT),
            energy: {
                costPerKwh: isNotNullish(process.env.ENERGY_COST_PER_KWH) ? Number(process.env.ENERGY_COST_PER_KWH) : 0,
                costPerKwp: isNotNullish(process.env.ENERGY_COST_PER_KWP) ? Number(process.env.ENERGY_COST_PER_KWP) : 0,
                auditKCh: isNotNullish(process.env.ENERGY_AUDIT_K_CH) ? Number(process.env.ENERGY_AUDIT_K_CH) : 0,
                auditKFr: isNotNullish(process.env.ENERGY_AUDIT_K_FR) ? Number(process.env.ENERGY_AUDIT_K_FR) : 0,
                auditEcsGasEff: isNotNullish(process.env.ENERGY_AUDIT_ECS_GAS_EFF) ? Number(process.env.ENERGY_AUDIT_ECS_GAS_EFF) : 0,
                auditEcsSolarCoverage: isNotNullish(process.env.ENERGY_AUDIT_ECS_SOLAR_COVERAGE) ? Number(process.env.ENERGY_AUDIT_ECS_SOLAR_COVERAGE) : 0,
                auditEcsSolarAppointEff: isNotNullish(process.env.ENERGY_AUDIT_ECS_SOLAR_APPOINT_EFF) ? Number(process.env.ENERGY_AUDIT_ECS_SOLAR_APPOINT_EFF) : 0,
                auditEcsPacCop: isNotNullish(process.env.ENERGY_AUDIT_ECS_PAC_COP) ? Number(process.env.ENERGY_AUDIT_ECS_PAC_COP) : 0,
            },
            googleMaps: {
                apiKey: isNotNullish(process.env.GOOGLE_MAPS_API_KEY) ? process.env.GOOGLE_MAPS_API_KEY : '',
                apiUrl: isNotNullish(process.env.GOOGLE_MAPS_API_URL) ? process.env.GOOGLE_MAPS_API_URL : '',
            },
            nasaPower: {
                apiUrl: isNotNullish(process.env.NASA_POWER_API_URL) ? process.env.NASA_POWER_API_URL : '',
                community: isNotNullish(process.env.NASA_POWER_COMMUNITY) ? process.env.NASA_POWER_COMMUNITY : '',
                parameter: isNotNullish(process.env.NASA_POWER_PARAMETER) ? process.env.NASA_POWER_PARAMETER : '',
            },
        };
    }
}