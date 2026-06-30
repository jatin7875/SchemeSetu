import mongoose from "mongoose";

export function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function redactMongoUri(uri = "") {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:<redacted>@");
}

function hasPlaceholderPassword(uri = "") {
  return uri.includes("<db_password>") || uri.includes("<password>");
}

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    const message = "MONGO_URI is not set. Authentication and MongoDB features are unavailable.";
    if (process.env.NODE_ENV === "production") {
      throw new Error(`${message} Refusing to start in production.`);
    }
    console.warn(message);
    console.warn("Using local JSON fallback in development.");
    return null;
  }

  if (hasPlaceholderPassword(mongoUri)) {
    const message = "MONGO_URI still contains a placeholder password. Replace <db_password> with your MongoDB Atlas password.";
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }
    console.warn(message);
    console.warn("Authentication and MongoDB features are unavailable until MONGO_URI is fixed.");
    return null;
  }

  try {
    mongoose.set("strictQuery", true);
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log("MongoDB connected successfully");
    return connection;
  } catch (error) {
    const safeUri = redactMongoUri(mongoUri);
    const message = `MongoDB connection failed for ${safeUri}: ${error.message}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }
    console.warn(message);
    console.warn("Authentication and MongoDB features are unavailable. Local JSON fallback remains available in development.");
    return null;
  }
}
