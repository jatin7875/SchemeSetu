import Scheme from "../models/Scheme.js";
import ImportJob from "../models/ImportJob.js";
import { isMongoConnected } from "../config/db.js";
import { normalizeSchemeRecord } from "../utils/schemeNormalizer.js";
import { validateSchemeRecord } from "../utils/validateSchemeRecord.js";

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

export function parseCsvRecords(csvText) {
  const lines = String(csvText || "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {});
  });
}

export async function importSchemeRecords(records, { importType, fileName, adminId }) {
  if (!isMongoConnected()) {
    const error = new Error("Scheme import requires MongoDB. Set MONGO_URI and restart the backend.");
    error.statusCode = 503;
    throw error;
  }

  const job = await ImportJob.create({
    file_name: fileName,
    import_type: importType,
    status: "processing",
    total_records: records.length,
    created_by: adminId || null
  });

  let insertedCount = 0;
  let updatedCount = 0;
  const errors = [];

  for (const [index, record] of records.entries()) {
    const validation = validateSchemeRecord(record);
    if (!validation.valid) {
      errors.push(`Row ${index + 1}: ${validation.errors.join(", ")}`);
      continue;
    }

    const normalized = normalizeSchemeRecord(record, {
      verification_status: "needs_review",
      created_by: adminId,
      updated_by: adminId
    });

    const existing = await Scheme.findOne({ scheme_id: normalized.scheme_id });
    if (existing) {
      await Scheme.updateOne({ _id: existing._id }, { $set: normalized });
      updatedCount += 1;
    } else {
      await Scheme.create(normalized);
      insertedCount += 1;
    }
  }

  job.status = errors.length === records.length ? "failed" : "completed";
  job.inserted_count = insertedCount;
  job.updated_count = updatedCount;
  job.failed_count = errors.length;
  job.error_messages = errors;
  await job.save();

  return job;
}
