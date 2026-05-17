const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rahul = await prisma.user.findFirst({ where: { name: "Rahul Verma" } });
  if (!rahul) { console.log("Rahul not found"); return; }
  
  const goalSheets = await prisma.goalSheet.findMany({
    where: { employeeId: rahul.id },
    include: { goals: true }
  });
  
  console.log(JSON.stringify(goalSheets, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
