import { AvailabilityService } from "../services/availabilityService.js";

export class AvailabilityController {
  /**
   * GET /api/availability?date=YYYY-MM-DD&timezone=IANA_TZ
   */
  static async getAvailability(req, res, next) {
    try {
      const { date, timezone } = req.query;
      const result = await AvailabilityService.getAvailability({
        date,
        timezone,
      });
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export default AvailabilityController;
