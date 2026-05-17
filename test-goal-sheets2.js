const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const gs = await prisma.goalSheet.findUnique({
    where: { id: "cmp9hsvka000f3ffciqsej163" },
    include: { goals: true }
  });
  console.log(JSON.stringify(gs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
