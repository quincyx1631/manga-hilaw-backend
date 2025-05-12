import app from "./app"
import config from "./config"
import logger from "./utils/logger"

const PORT = config.port || 5000

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  logger.info(`Environment: ${config.nodeEnv}`)
})

process.on("unhandledRejection", (err: Error) => {
  logger.error("UNHANDLED REJECTION! Shutting down...")
  logger.error(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})

process.on("uncaughtException", (err: Error) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...")
  logger.error(err.name, err.message)
  process.exit(1)
})
