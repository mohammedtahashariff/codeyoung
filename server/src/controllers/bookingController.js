import { BookingService } from "../services/bookingService.js";

export class BookingController {
  /**
   * POST /api/bookings
   */
  static async createBooking(req, res, next) {
    try {
      const result = await BookingService.createBooking(req.body);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/bookings/:id
   */
  static async getBooking(req, res, next) {
    try {
      const { id } = req.params;
      const result = await BookingService.getBookingById(id);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/bookings/:id/class-link
   */
  static async getClassLink(req, res, next) {
    try {
      const { id } = req.params;
      const result = await BookingService.getClassLink(id);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export default BookingController;
