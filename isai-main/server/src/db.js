import mongoose from "mongoose";

export async function connectDb(uri) {
  if (!uri) {
    throw new Error("MONGO_URI is not set");
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    throw error;
  }
}
