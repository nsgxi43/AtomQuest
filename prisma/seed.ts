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
  const currentYear = new Date().getFullYear();

  // Create Admin user
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@demo.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Create Manager users
  const manager1 = await prisma.user.create({
    data: {
      name: "Alice Johnson",
      email: "manager@demo.com",
      password: hashedPassword,
      role: "MANAGER",
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: "Bob Smith",
      email: "manager2@demo.com",
      password: hashedPassword,
      role: "MANAGER",
    },
  });

  // Create Employee users
  const employees = [
    { name: "Priya Sharma", email: "priya@demo.com", dept: "Product Engineering", managerId: manager1.id },
    { name: "Rahul Verma", email: "rahul@demo.com", dept: "Operations", managerId: manager1.id },
    { name: "Ananya Iyer", email: "ananya@demo.com", dept: "QA Automation", managerId: manager1.id },
    { name: "Arjun Nair", email: "arjun@demo.com", dept: "Sales", managerId: manager2.id },
    { name: "Sneha Reddy", email: "sneha@demo.com", dept: "HR", managerId: manager2.id },
    { name: "Vikram Singh", email: "vikram@demo.com", dept: "Marketing", managerId: manager2.id },
  ];

  const createdEmployees = [];
  for (const emp of employees) {
    const user = await prisma.user.create({
      data: {
        name: emp.name,
        email: emp.email,
        password: hashedPassword,
        role: "EMPLOYEE",
        managerId: emp.managerId,
      },
    });
    createdEmployees.push(user);
    
    const isLocked = ["Priya Sharma", "Ananya Iyer", "Arjun Nair", "Sneha Reddy"].includes(emp.name);
    
    // Create a goal sheet for the employee
    const sheet = await prisma.goalSheet.create({
      data: {
        employeeId: user.id,
        cycleYear: currentYear,
        status: isLocked ? "LOCKED" : "DRAFT",
      },
    });

    if (isLocked) {
      // Add goals
      const goal1 = await prisma.goal.create({
        data: {
          goalSheetId: sheet.id,
          title: "Improve system performance",
          description: "Reduce latency by 20%",
          thrustArea: emp.dept,
          uom: "NUMERIC_MAX",
          target: "100",
          weightage: 60,
          isShared: false,
        }
      });
      
      const goal2 = await prisma.goal.create({
        data: {
          goalSheetId: sheet.id,
          title: "Complete team training",
          description: "Attend all workshops",
          thrustArea: "Training",
          uom: "NUMERIC_MAX",
          target: "10",
          weightage: 40,
          isShared: false,
        }
      });

      // Add quarterly updates
      const quarters = ["Q1", "Q2", "Q3", "Q4"];
      for (const q of quarters) {
        // Goal 1 updates
        const g1Score = Math.floor(Math.random() * 40) + 60; // 60-100
        let g1Status = "ON_TRACK";
        if (g1Score >= 90) g1Status = "COMPLETED";
        else if (g1Score < 70) g1Status = "DELAYED";
        
        await prisma.quarterlyUpdate.create({
          data: {
            goalId: goal1.id,
            quarter: q,
            actualAchievement: `${g1Score}%`,
            computedScore: g1Score,
            status: g1Status,
          }
        });

        // Goal 2 updates
        const g2Score = Math.floor(Math.random() * 50) + 50; // 50-100
        let g2Status = "ON_TRACK";
        if (g2Score >= 85) g2Status = "COMPLETED";
        else if (g2Score < 60) g2Status = "AT_RISK";

        await prisma.quarterlyUpdate.create({
          data: {
            goalId: goal2.id,
            quarter: q,
            actualAchievement: `${g2Score}%`,
            computedScore: g2Score,
            status: g2Status,
          }
        });
      }
    } else {
      // DRAFT sheets - just some partial goals to show pending status
      await prisma.goal.create({
        data: {
          goalSheetId: sheet.id,
          title: "Pending Goal",
          description: "Needs review",
          thrustArea: emp.dept,
          uom: "NUMERIC_MIN",
          target: "5",
          weightage: 50,
          isShared: false,
        }
      });
    }
  }

  console.log("Seeding completed successfully!");
  console.log("Admin:", admin.email);
  console.log("Manager 1:", manager1.email);
  console.log("Manager 2:", manager2.email);
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
