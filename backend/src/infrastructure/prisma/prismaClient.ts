import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export interface RLSContext {
  userId: string;
  userRole: string;
}

export const rlsStorage = new AsyncLocalStorage<RLSContext>();

const basePrisma = new PrismaClient({ log: ['error', 'warn'] });

// Cada query autenticada corre dentro de una TX que:
// 1. Cambia el rol a yf_app (activa RLS)
// 2. Inyecta app.user_id y app.user_role como settings locales
// 3. Ejecuta la query original
// Si no hay contexto (login, health), corre como yf_user (superuser → omite RLS)
const extended = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const ctx = rlsStorage.getStore();

        if (!ctx) {
          return query(args);
        }

        const [, , , result] = await basePrisma.$transaction([
          basePrisma.$executeRaw`SET LOCAL ROLE yf_app`,
          basePrisma.$executeRaw`SELECT set_config('app.user_id', ${ctx.userId}, true)`,
          basePrisma.$executeRaw`SELECT set_config('app.user_role', ${ctx.userRole}, true)`,
          query(args) as any,
        ]);

        return result;
      },
    },
  },
});

export default extended as unknown as PrismaClient;
