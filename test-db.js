const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const gs = await prisma.goalSheet.findMany({ include: { employee: true, goals: true } });
  console.log(JSON.stringify(gs.map(g => ({ id: g.id, emp: g.employee.name, goals: g.goals.length, created: g.createdAt })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
