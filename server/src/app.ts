import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { algorithmRouter } from "./routes/algorithm.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { cubeRouter } from "./routes/cube.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { solveRouter } from "./routes/solve.routes.js";
import { userAlgorithmRouter } from "./routes/userAlgorithm.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use("/api/health", healthRouter);
  app.use("/api/cube", cubeRouter);
  app.use("/api/algorithms", algorithmRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/user/algorithms", userAlgorithmRouter);
  app.use("/api/solves", solveRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
