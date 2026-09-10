import express from "express";
import { middleware } from "./middleware";
import jwt from "jsonwebtoken";

import { jwt_secret } from "@repo/backend-common/config";
import {
  CreateUserSchema,
  siginSchema,
  createRoomSchema
} from "@repo/common/types";

import { db } from "@repo/db";

const app = express();

app.use(express.json());

app.post("/signup", (req, res) => {
  const data = CreateUserSchema.safeParse(req.body);

  if (!data.success) {
    return res.json({
      message: "Invalid input"
    });
  }

  res.json({
    userId: "123"
  });
});

app.post("/signin", (req, res) => {
  const data = siginSchema.safeParse(req.body);

  if (!data.success) {
    return res.json({
      message: "Invalid input"
    });
  }

  const userId = "123";

  const token = jwt.sign(
    {
      userId
    },
    jwt_secret
  );

  res.json({
    token
  });
});

app.post("/room", middleware, (req, res) => {
  const data = createRoomSchema.safeParse(req.body);

  if (!data.success) {
    return res.json({
      message: "Invalid input"
    });
  }

  res.json({
    userId: "123"
  });
});

app.listen(3001, () => {
  console.log("HTTP server running on port 3001");
});