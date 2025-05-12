import { createClient } from "@supabase/supabase-js"
import config from "../config"

const supabase = createClient(config.supabase.url, config.supabase.key)
const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceKey)

export { supabase, supabaseAdmin }
