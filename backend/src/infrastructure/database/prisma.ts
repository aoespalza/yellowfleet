import prisma from '../prisma/prismaClient';

export { prisma };

export async function connectDatabase() {
  try {
    await (prisma as any).$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  await (prisma as any).$disconnect();
}
