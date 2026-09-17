import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const rootEnvPath = path.resolve(
  currentDirectory,
  "../../../.env",
);

const result = dotenv.config({
  path: rootEnvPath,
});

console.log("Loaded env path:", rootEnvPath);
console.log("Dotenv error:", result.error ?? "none");
console.log(
  "DATABASE_URL loaded:",
  Boolean(process.env.DATABASE_URL),
);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaPg({
  connectionString,
});

export const prisma = new PrismaClient({
  adapter,
})