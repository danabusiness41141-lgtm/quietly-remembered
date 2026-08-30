import serverless from "serverless-http";

declare const Netlify: {
  env: {
    get(key: string): string | undefined;
  };
};

type LegacyHandler = (event: unknown, context: unknown) => Promise<unknown>;
let cachedHandler: LegacyHandler | undefined;

const serverEnvironmentKeys = [
  "VITE_APP_ID",
  "JWT_SECRET",
  "DATABASE_URL",
  "OAUTH_SERVER_URL",
  "OWNER_OPEN_ID",
  "BUILT_IN_FORGE_API_URL",
  "BUILT_IN_FORGE_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "QR_ENABLE_SCHEDULED_PUBLISHING",
] as const;

async function getHandler() {
  if (cachedHandler) return cachedHandler;
  for (const key of serverEnvironmentKeys) {
    const value = typeof Netlify !== "undefined" ? Netlify.env.get(key) : process.env[key];
    if (value) process.env[key] = value;
  }
  const { createApiApp } = await import("../../server/app");
  cachedHandler = serverless(createApiApp()) as unknown as LegacyHandler;
  return cachedHandler;
}

export const handler = async (event: unknown, context: unknown) => {
  return (await getHandler())(event, context);
};
