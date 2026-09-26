import { Router } from "express";
import { HealthController } from "../controllers/healthController.js";
import { AvailabilityController } from "../controllers/availabilityController.js";
import { BookingController } from "../controllers/bookingController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { getAvailabilitySchema } from "../validators/availabilityValidator.js";
import { createBookingSchema } from "../validators/bookingValidator.js";
import { bookingRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Health check endpoint
router.get("/health", HealthController.getHealth);

// Availability endpoint
router.get(
  "/availability",
  validateRequest(getAvailabilitySchema, "query"),
  AvailabilityController.getAvailability
);

// Booking endpoints
router.post(
  "/bookings",
  bookingRateLimiter,
  validateRequest(createBookingSchema, "body"),
  BookingController.createBooking
);

router.get("/bookings/:id", BookingController.getBooking);

router.get("/bookings/:id/class-link", BookingController.getClassLink);

export default router;
