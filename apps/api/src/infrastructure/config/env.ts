export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly databaseUrl: string;
}

export function loadConfig(): AppConfig {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  return {
    port: parseInt(process.env["PORT"] ?? "3000", 10),
    host: process.env["HOST"] ?? "0.0.0.0",
    databaseUrl,
  };
}
