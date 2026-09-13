import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { db } from "@repo/db";
import { jwt_secret } from "@repo/backend-common/config";
import {
  CreateUserSchema,
  siginSchema,
  createRoomSchema,
} from "@repo/common/types";

import { middleware } from "./middleware";

const app = express();

app.use(express.json());

//signup
app.post("/signup", async (req: Request, res: Response) => {
  const parsedData = CreateUserSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.status(400).json({
      message: "Invalid signup input",
      errors: parsedData.error.flatten(),
    });
  }

  try {
    const { username, password, name } = parsedData.data;

    const existingUser = await db.orm.public.User.where({
      email: username,
    }).first();

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.orm.public.User.create({
      email: username,
      password: hashedPassword,
      name,
    });

    return res.status(201).json({
      message: "Signup successful",
      userId: user.id,
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    return res.status(500).json({
      message: "Signup failed",
    });
  }
});


//signin
app.post("/signin", async (req: Request, res: Response) => {
  const parsedData = siginSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.status(400).json({
      message: "Invalid signin input",
      errors: parsedData.error.flatten(),
    });
  }

  try {
    const { username, password } = parsedData.data;

    const user = await db.orm.public.User.where({
      email: username,
    }).first();

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatched = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordMatched) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      jwt_secret,
      {
        expiresIn: "7d",
      },
    );

    return res.status(200).json({
      message: "Signin successful",
      token,
    });
  } catch (error) {
    console.error("SIGNIN ERROR:", error);

    return res.status(500).json({
      message: "Signin failed",
    });
  }
});

//get toom chat

app.get("/chats/:roomId", async (req, res) => {
  try {
    const roomId = req.params.roomId;

    const messages = await db.orm.public.Chat
      .where({
        roomId,
      })
      .all();

    res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error("Failed to fetch chats:", error);

    res.status(500).json({
      message: "Failed to fetch chats",
    });
  }
});


  // CREATE ROOM    


app.post(
  "/room",
  middleware,
  async (req: Request, res: Response) => {
    const parsedData = createRoomSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        message: "Invalid room input",
        errors: parsedData.error.flatten(),
      });
    }

    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          message: "Not authorized",
        });
      }

      const { name } = parsedData.data;

      const existingRoom = await db.orm.public.Room.where({
        slug: name,
      }).first();

      if (existingRoom) {
        return res.status(409).json({
          message: "Room name already exists",
        });
      }

      const room = await db.orm.public.Room.create({
        slug: name,
        adminId: userId,
      });

      return res.status(201).json({
        message: "Room created successfully",
        roomId: room.id,
        room,
      });
    } catch (error: any) {
      console.error("CREATE ROOM ERROR:", error);

      // PostgreSQL duplicate key error fallback
      if (
        error?.sqlState === "23505" ||
        error?.cause?.sqlState === "23505" ||
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
  },
);

     


app.get("/", (_req: Request, res: Response) => {
  return res.status(200).json({
    message: "HTTP backend is running",
  });
});



const PORT = 3001;

app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});