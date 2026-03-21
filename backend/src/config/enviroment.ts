import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  DATABASE_URL: process.env.DATABASE_URL || "",
};
