import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import apiRouter from "./routes/api.js";
import passport, { configurePassport } from "./oauth/passport.js";

const app = express();
configurePassport();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://sprint-board-ipjz.vercel.app",
      ];

      // Allow server-to-server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(helmet());
app.use(limiter);
app.use(
  express.json({
    limit: "1mb",
    verify(req, _res, buf) {
      req.rawBody = buf.toString("utf8");
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan("dev"));
app.use(passport.initialize());

app.use("/api", apiRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

connectDb(config.mongoUri)
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server started on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed", err);
    process.exit(1);
  });
