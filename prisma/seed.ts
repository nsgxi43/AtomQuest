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

  // Create Employee users
  const employees = [
    { name: "Priya Sharma", email: "priya@demo.com", dept: "Product Engineering" },
    { name: "Rahul Verma", email: "rahul@demo.com", dept: "System Optimization" },
    { name: "Ananya Iyer", email: "ananya@demo.com", dept: "QA Automation" },
    { name: "Arjun Nair", email: "arjun@demo.com", dept: "Process Excellence" },
    { name: "Sneha Reddy", email: "sneha@demo.com", dept: "Platform Reliability" },
  ];

  const createdEmployees = [];
  for (const emp of employees) {
    const user = await prisma.user.create({
      data: {
        name: emp.name,
        email: emp.email,
        password: hashedPassword,
        role: "EMPLOYEE",
        managerId: manager.id,
      },
    });
    createdEmployees.push(user);

    // Create a goal sheet for the employee
    await prisma.goalSheet.create({
      data: {
        employeeId: user.id,
        cycleYear: 2025,
        status: "DRAFT",
      },
    });
  }

  console.log("Seeding completed successfully!");
  console.log("Admin:", admin.email);
  console.log("Manager:", manager.email);
  console.log("Employees seeded:", createdEmployees.map(e => e.email));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
