import mongoose from "mongoose";
import "dotenv/config";

const LEGACY_URI = process.env.MONGODB_URI ?? "";
const NEW_URI = process.env.MONGODB_URI_NEW ?? LEGACY_URI;

export async function connectLegacy() {
  return mongoose.createConnection(LEGACY_URI);
}

export async function connectNew() {
  return mongoose.createConnection(NEW_URI);
}
