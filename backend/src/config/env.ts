import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 4000),
  JWT_SECRET: String(process.env.JWT_SECRET || "dev_secret_change_me"),
  CORS_ORIGIN: String(process.env.CORS_ORIGIN || "*"),
};
