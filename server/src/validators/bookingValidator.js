import { z } from "zod";
import { TimezoneService } from "../services/timezoneService.js";

const timezoneSchema = z
  .string({ required_error: "Timezone is required" })
  .refine((tz) => TimezoneService.isValidTimezone(tz), {
    message: "Invalid IANA timezone identifier (e.g., America/New_York, Europe/London, Asia/Kolkata)",
  });

export const createBookingSchema = z.object({
  parent: z.object({
    fullName: z.string().trim().min(2, "Parent name must be at least 2 characters"),
    email: z.string().trim().email("Parent email must be a valid email address"),
    phone: z.string().trim().optional().nullable(),
    timezone: timezoneSchema.optional(),
  }),
  student: z.object({
    firstName: z.string().trim().min(1, "Student first name is required"),
    age: z
      .union([z.number(), z.string()])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
      .refine((val) => !isNaN(val) && val >= 4 && val <= 25, {
        message: "Student age must be a number between 4 and 25",
      }),
    grade: z.string().trim().min(1, "Grade / Class is required"),
    codingExperience: z.string().trim().optional().nullable(),
    email: z
      .string()
      .trim()
      .email("Student email must be a valid email address")
      .optional()
      .nullable()
      .or(z.literal("")),
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  time: z.string().min(1).optional(),
  startTime: z.string().optional(),
  timezone: timezoneSchema.optional(),
  mentorId: z.string().optional().nullable(),
}).refine(
  (data) => (data.date && data.time) || data.startTime,
  {
    message: "Either (date and time) or startTime must be provided",
    path: ["date"],
  }
).refine(
  (data) => Boolean(data.parent.timezone || data.timezone),
  {
    message: "Parent timezone is required",
    path: ["timezone"],
  }
);
