import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.join(__dirname, "../../.env") })

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",

  supabase: {
    url: process.env.SUPABASE_URL || "",
    key: process.env.SUPABASE_ANON_KEY || "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
}

const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`)
}

export default config
