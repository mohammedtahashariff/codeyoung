import { z } from "zod";
import { TimezoneService } from "../services/timezoneService.js";

export const getAvailabilitySchema = z.object({
  date: z
    .string({ required_error: "date parameter (YYYY-MM-DD) is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
  timezone: z
    .string({ required_error: "timezone parameter is required" })
    .refine((tz) => TimezoneService.isValidTimezone(tz), {
      message: "Invalid IANA timezone identifier (e.g. America/New_York, Europe/London)",
    }),
});
