import { z } from 'zod';

// dotenv/process.env transforma "SEED_ADMIN_PASSWORD=" (sem valor) em string vazia,
// não em undefined — sem isso, .optional() rejeitaria a variável vazia como inválida.
const emptyStringToUndefined = z.literal('').transform(() => undefined);

// z.coerce.boolean() usa Boolean(valor) por baixo dos panos: QUALQUER string não
// vazia (inclusive a string "false") vira `true`. Como as variáveis de ambiente
// sempre chegam como string, isso faz "DATABASE_SSL=false" virar `true` de verdade.
// Este schema interpreta explicitamente "false"/"0"/"" como falso.
const booleanFromEnv = z.union([z.boolean(), z.string()]).transform((value) => {
  if (typeof value === 'boolean') return value;
  return !['false', '0', ''].includes(value.trim().toLowerCase());
});

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_NAME: z.string().min(1),
  DATABASE_SSL: booleanFromEnv.default(false),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_COOKIE_NAME: z.string().min(1).default('concretrack_session'),

  AUTH_MAX_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
  AUTH_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  SEED_ADMIN_EMAIL: z.union([z.string().email(), emptyStringToUndefined]).optional(),
  SEED_ADMIN_PASSWORD: z.union([z.string().min(12), emptyStringToUndefined]).optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuração de ambiente inválida: ${issues}`);
  }
  return parsed.data;
}
