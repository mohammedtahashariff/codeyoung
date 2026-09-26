import app from "./app.js";
import { CONFIG } from "./config/constants.js";

const server = app.listen(CONFIG.PORT, () => {
  console.log(`🚀 Codeyoung Booking Server is running on port ${CONFIG.PORT} [${CONFIG.NODE_ENV}]`);
  console.log(`📡 Health Check: http://localhost:${CONFIG.PORT}/api/health`);
  console.log(`📅 Availability API: http://localhost:${CONFIG.PORT}/api/availability`);
  console.log(`📝 Bookings API: http://localhost:${CONFIG.PORT}/api/bookings`);
  console.log(`💾 Database: SQLite dev.db active`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Closing HTTP server cleanly...`);
  server.close(() => {
    console.log("[Server] HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default server;
