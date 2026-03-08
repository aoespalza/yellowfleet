const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const machines = await prisma.machine.findMany({
    where: {
      id: { in: ['ae2bdc6e-5817-40fc-bfbf-2478bf90941c', 'c982d73b-615b-47a5-b935-4c714ff100e3'] }
    },
    select: {
      id: true,
      code: true,
      acquisitionValue: true,
      commercialValue: true
    }
  });
  
  console.log('Machines in DB:');
  console.log(JSON.stringify(machines, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
