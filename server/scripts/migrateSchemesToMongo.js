import "../config/env.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Scheme from "../models/Scheme.js";
import { normalizeSchemeRecord } from "../utils/schemeNormalizer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemesPath = path.resolve(__dirname, "../../data/schemes.json");

async function migrate() {
  await connectDB();

  const raw = await fs.readFile(schemesPath, "utf-8");
  const schemes = JSON.parse(raw);
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const scheme of schemes) {
    const normalized = normalizeSchemeRecord(scheme, { verification_status: "verified" });

    if (!normalized.scheme_id || !normalized.scheme_name) {
      skipped += 1;
      continue;
    }

    const result = await Scheme.updateOne(
      { scheme_id: normalized.scheme_id },
      { $set: normalized },
      { upsert: true, runValidators: true }
    );

    if (result.upsertedCount > 0) {
      inserted += 1;
    } else if (result.modifiedCount > 0 || result.matchedCount > 0) {
      updated += 1;
    }
  }

  console.log("Scheme migration completed");
  console.log(`Source file: ${schemesPath}`);
  console.log(`Total records: ${schemes.length}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

migrate()
  .catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
