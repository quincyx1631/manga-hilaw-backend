import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import { errorHandler } from "./middleware/errorHandler"
import { notFoundHandler } from "./middleware/notFoundHandler"
import authRoutes from "./routes/auth.routes"
import userRoutes from "./routes/user.routes"
import profileRoutes from "./routes/profile.routes"
import config from "./config"
import bookmarkRoutes from "./routes/bookmark.route"
import dotenv from "dotenv"
dotenv.config()

const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["https://manga-hilaw.vercel.app"];

app.use(
  cors({
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: false, // No longer needed since we're not using cookies
  })
);
app.use(helmet())
app.use(morgan("dev"))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/profile", profileRoutes)
app.use("/api/bookmarks", bookmarkRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" })
})

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app
