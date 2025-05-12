import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import { errorHandler } from "./middleware/errorHandler"
import { notFoundHandler } from "./middleware/notFoundHandler"
import authRoutes from "./routes/auth.routes"
import userRoutes from "./routes/user.routes"
import config from "./config"

const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
)
app.use(helmet())
app.use(morgan("dev"))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" })
})

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app
