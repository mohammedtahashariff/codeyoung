import express from "express";
import cors from "cors";
import helmet from "helmet";
import { CONFIG } from "./config/constants.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import apiRoutes from "./routes/apiRoutes.js";

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching CLIENT_URL or localhost
      if (!origin || origin.startsWith("http://localhost:") || origin === CONFIG.CLIENT_URL) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General rate limiter
app.use("/api", apiRateLimiter);

// API routes
app.use("/api", apiRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    error: "Resource not found",
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
