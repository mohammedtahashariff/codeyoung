export class HealthController {
  /**
   * GET /api/health
   */
  static getHealth(req, res) {
    return res.status(200).json({
      status: "healthy",
      service: "codeyoung-trial-booking-api",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}

export default HealthController;
