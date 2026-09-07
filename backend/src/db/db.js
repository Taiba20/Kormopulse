import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

import dotenv from "dotenv";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGODB_URI;

export const connectDB = async () => {
  try {
    if (!MONGODB_URL) {
      throw new Error("MONGODB_URL is required. Copy .env.example to .env and configure MongoDB.");
    }
    const connectionInstance = await mongoose.connect(MONGODB_URL, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MONGODB Connected !! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log(`MONGODB Connection error`, error);
    throw error;
  }
};
