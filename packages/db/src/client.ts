import "temporal-polyfill/full/global";

import path from "node:path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
});

import postgres from "@prisma/orm-postgres/runtime";

import type { Contract } from "../prisma/contract.d.ts";
import contractJson from "../prisma/contract.json" with {
  type: "json",
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

export const db = postgres<Contract>({
  contractJson,
  url: connectionString,
});