const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const currentYear = new Date().getFullYear();
  const goalSheets = await prisma.goalSheet.findMany({
    where: {
      employeeId: "cmp9h6pz0000l3fz951asbc8i", // Sneha's ID is what? No, wait, her employee ID is what?
      cycleYear: currentYear,
    },
    include: {
      goals: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(JSON.stringify(goalSheets, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
