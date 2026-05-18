import { z } from "zod";

export const CreateGoalSchema = z.object({
  thrustArea: z.string().min(1, "Thrust area is required"),
  title: z.string().min(1, "Goal title is required"),
  description: z.string().optional(),
  uom: z.enum(["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO"]),
  target: z.string().min(1, "Target is required"),
  weightage: z.number().min(10, "Minimum weightage is 10%").max(100, "Maximum weightage is 100%"),
});

export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;

export const SubmitGoalSheetSchema = z.object({
  goals: z
    .array(CreateGoalSchema)
    .min(1, "At least one goal is required")
    .max(8, "You have reached the maximum limit of 8 goals. Please redistribute existing goal weightages to achieve the required 100% allocation.")
    .refine((goals) => {
      const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
      return Math.abs(totalWeightage - 100) < 0.01; // Account for floating point precision
    }, "Total weightage must equal 100%"),
});

export type SubmitGoalSheetInput = z.infer<typeof SubmitGoalSheetSchema>;

export const QuarterlyUpdateSchema = z.object({
  goalId: z.string().min(1, "Goal ID is required"),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  actualAchievement: z.string().optional(),
  status: z.enum(["NOT_STARTED", "ON_TRACK", "COMPLETED", "DELAYED", "AT_RISK"]),
});

export type QuarterlyUpdateInput = z.infer<typeof QuarterlyUpdateSchema>;

export const CheckinCommentSchema = z.object({
  goalSheetId: z.string().min(1, "Goal sheet ID is required"),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
});

export type CheckinCommentInput = z.infer<typeof CheckinCommentSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  name:              z.string().min(2, "Full name must be at least 2 characters"),
  email:             z.string().email("Invalid email address"),
  password:          z.string().min(8, "Password must be at least 8 characters"),
  role:              z.enum(["EMPLOYEE", "MANAGER"]),
  employeeId:        z.string().min(1, "Employee ID is required").max(20),
  department:        z.string().min(1, "Department is required"),
  organization:      z.string().optional(),
  managerId:         z.string().optional(),
  notificationEmail: z.string().email("Invalid notification email").optional().or(z.literal("")),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
