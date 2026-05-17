const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const priya = await prisma.user.findFirst({ where: { name: "Priya Sharma" } });
  if (!priya) { console.log("Priya not found"); return; }
  
  const goalSheets = await prisma.goalSheet.findMany({
    where: { employeeId: priya.id },
    include: { goals: true }
  });
  
  console.log(JSON.stringify(goalSheets, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
