const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const gs = await prisma.goalSheet.findFirst({
    where: { employeeId: "cmp9h6pz0000j3fz9h5mygthf", cycleYear: 2026 },
    include: { goals: true }
  });
  console.log(JSON.stringify(gs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
