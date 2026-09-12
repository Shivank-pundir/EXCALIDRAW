
import express from "express";
import jwt from "jsonwebtoken";

import { middleware } from "./middleware";

import { jwt_secret } from "@repo/backend-common/config";

import {
  CreateUserSchema,
  siginSchema,
  createRoomSchema,
} from "@repo/common/types";

import { db } from "@repo/db";
import bcrypt from "bcrypt";

const app = express();

app.use(express.json());

app.post("/signup", async (req, res) => {
  const parsedata = CreateUserSchema.safeParse(req.body);

  if (!parsedata.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const existing = await db.orm.public.User.where({
      email: parsedata.data.username,
    }).first();

    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(parsedata.data.password, 10);

    const user = await db.orm.public.User.create({
      email: parsedata.data.username,
      password: hashedPassword,
      name: parsedata.data.name,
    });

    return res.status(201).json({
      message: "Signup successful",
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Signup failed" });
  }
});

// sign-in
app.post("/signin", async (req, res) => {
  const parsedata = siginSchema.safeParse(req.body);

  if (!parsedata.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const user = await db.orm.public.User.where({
      email: parsedata.data.username,
    }).first();

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(
      parsedata.data.password,
      user.password,
    );

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ userId: user.id }, jwt_secret);

    return res.status(200).json({ message: "Signin successful", token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Signin failed" });
  }
});

// ---------------- CREATE ROOM ----------------
app.post("/room", middleware, async (req, res) => {
  const parsedata = createRoomSchema.safeParse(req.body);

  if (!parsedata.success) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const room = await db.orm.public.Room.create({
      slug: parsedata.data.name,
      adminId: userId,
    });

    return res.status(201).json({
      message: "Room created successfully",
      roomId: room.id,
    });
  } catch (error: any) {
    console.error("ROOM CREATION ERROR:", error);

    if (
      error?.sqlState === "23505" ||
      error?.cause?.code === "23505"
    ) {
      return res.status(409).json({
        message: "Room name already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to create room",
    });
  }
});

app.listen(3001, () => {
  console.log("HTTP server running on port 3001");
});

