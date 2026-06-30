import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.resolve(__dirname, "../.env");

// Load server/.env before any route/service modules read process.env.
dotenv.config({ path: serverEnvPath });
dotenv.config();
