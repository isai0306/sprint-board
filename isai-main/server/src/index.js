import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import apiRouter from "./routes/api.js";
import passport, { configurePassport } from "./oauth/passport.js";

const app = express();
configurePassport();

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server or curl requests with no Origin header.
      if (!origin) return callback(null, true);
      if (config.clientUrls.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(express.json());
app.use(morgan("dev"));
app.use(passport.initialize());

app.use("/api", apiRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

connectDb(config.mongoUri)
  .then(() => {
    app.listen(config.port, () => {
      console.log(`API running at http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed", err);
    process.exit(1);
  });
