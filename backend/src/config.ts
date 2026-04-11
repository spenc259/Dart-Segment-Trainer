import { resolve } from "node:path";

export interface AppConfig {
  host: string;
  port: number;
  dbFile: string;
}

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4000;
const DEFAULT_DB_FILE = "./data/dartscorer.db";

const parsePort = (value: string | undefined) => {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = Number.parseInt(value, 10);
  return Number.isNaN(port) ? DEFAULT_PORT : port;
};

export const resolveConfig = (overrides: Partial<AppConfig> = {}): AppConfig => {
  const dbFile = overrides.dbFile ?? process.env.DB_FILE ?? DEFAULT_DB_FILE;

  return {
    host: overrides.host ?? process.env.HOST ?? DEFAULT_HOST,
    port: overrides.port ?? parsePort(process.env.PORT),
    dbFile: dbFile === ":memory:" ? dbFile : resolve(process.cwd(), dbFile),
  };
};
