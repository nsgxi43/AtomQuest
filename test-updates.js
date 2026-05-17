const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.quarterlyUpdate.count();
  console.log("Total updates: " + count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
