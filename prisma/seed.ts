const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Delete existing data
  await prisma.auditLog.deleteMany();
  await prisma.checkinComment.deleteMany();
  await prisma.quarterlyUpdate.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.sharedGoal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.user.deleteMany();

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Admin user
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@demo.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Create Manager user
  const manager = await prisma.user.create({
    data: {
      name: "Manager User",
      email: "manager@demo.com",
      password: hashedPassword,
      role: "MANAGER",
    },
  });

  // Create Employee user
  const employee = await prisma.user.create({
    data: {
      name: "Employee User",
      email: "employee@demo.com",
      password: hashedPassword,
      role: "EMPLOYEE",
      managerId: manager.id,
    },
  });

  // Create a goal sheet for the employee
  const goalSheet = await prisma.goalSheet.create({
    data: {
      employeeId: employee.id,
      cycleYear: 2025,
      status: "DRAFT",
    },
  });

  console.log("Seeding completed successfully!");
  console.log("Admin:", admin);
  console.log("Manager:", manager);
  console.log("Employee:", employee);
  console.log("Goal Sheet:", goalSheet);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
