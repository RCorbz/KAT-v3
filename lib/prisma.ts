import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Lazily initialize Prisma Client to bypass Next.js 15+ Turbopack static extraction crashes
let prismaInstance: PrismaClient | undefined;

const getPrisma = (): PrismaClient => {
    if (!prismaInstance) {
        const connectionString = process.env.DATABASE_URL;
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        prismaInstance = new PrismaClient({ adapter });
    }
    return prismaInstance;
}

declare global {
    var prisma: undefined | PrismaClient
}

const prisma = new Proxy({} as PrismaClient, {
    get: (target, prop) => {
        const client: any = globalThis.prisma ?? getPrisma();
        if (process.env.NODE_ENV !== 'production' && !globalThis.prisma) {
            globalThis.prisma = client;
        }
        return typeof client[prop] === 'function' ? client[prop].bind(client) : client[prop];
    }
});

export default prisma;
