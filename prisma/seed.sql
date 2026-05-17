-- Seed data for atomquest
-- Insert Admin User
INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt") 
VALUES ('admin_user_001', 'Admin User', 'admin@demo.com', '$2b$10$Jrgd.dGd0tFWYXgCx.zV3ePMEgoSCp3QW9p/O9ppAmGf.RytZtEja', 'ADMIN', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert Manager User
INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt") 
VALUES ('manager_user_001', 'Manager User', 'manager@demo.com', '$2b$10$Jrgd.dGd0tFWYXgCx.zV3ePMEgoSCp3QW9p/O9ppAmGf.RytZtEja', 'MANAGER', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert Employee User with Manager relationship
INSERT INTO users (id, name, email, password, role, "managerId", "createdAt", "updatedAt") 
VALUES ('employee_user_001', 'Employee User', 'employee@demo.com', '$2b$10$Jrgd.dGd0tFWYXgCx.zV3ePMEgoSCp3QW9p/O9ppAmGf.RytZtEja', 'EMPLOYEE', 'manager_user_001', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert Goal Sheet for Employee
INSERT INTO goal_sheets (id, "employeeId", "cycleYear", status, "createdAt", "updatedAt") 
VALUES ('goalsheet_001', 'employee_user_001', 2025, 'DRAFT', NOW(), NOW())
ON CONFLICT DO NOTHING;
