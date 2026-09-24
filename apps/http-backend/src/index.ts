import express, {
  type Request,
  type Response,
} from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cors from "cors";
import { randomUUID } from "node:crypto";

import { prisma, Prisma } from "@repo/db-stable";
import { jwt_secret } from "@repo/backend-common/config";
import { siginSchema } from "@repo/common/types";

import { middleware } from "./middleware";

const app = express();

/*  CONFIG  */

const PORT = Number(process.env.PORT) || 4000;

const FRONTEND_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

/*  MIDDLEWARE  */

app.use(
  cors({
    origin: FRONTEND_ORIGINS,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

/*  HELPERS  */

function createRoomSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getRoomSlug(roomId: string): string {
  return createRoomSlug(decodeURIComponent(roomId));
}

function isValidObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/*  SIGNUP  */

app.post("/signup", async (req: Request, res: Response) => {
  try {
    const { username, password, name } = req.body;

    if (
      !username ||
      typeof username !== "string" ||
      !password ||
      typeof password !== "string" ||
      !name ||
      typeof name !== "string"
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanUsername || !cleanName || password.length < 6) {
      return res.status(400).json({
        message:
          "Valid name, email and password of at least 6 characters are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: cleanUsername,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: cleanUsername,
        password: hashedPassword,
        name: cleanName,
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
      },
      jwt_secret,
      {
        expiresIn: "7d",
      },
    );

    return res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    return res.status(500).json({
      message: "Signup failed",
    });
  }
});

/* SIGNIN  */

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

    const user = await prisma.user.findUnique({
      where: {
        email: username.trim().toLowerCase(),
      },
    });

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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("SIGNIN ERROR:", error);

    return res.status(500).json({
      message: "Signin failed",
    });
  }
});

/* CREATE ROOM */

app.post(
  "/room",
  middleware,
  async (req: Request, res: Response) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== "string") {
        return res.status(400).json({
          message: "Room name is required",
        });
      }

      const cleanName = name.trim();
      const slug = createRoomSlug(cleanName);

      if (!slug) {
        return res.status(400).json({
          message: "Please enter a valid room name",
        });
      }

      console.log("CREATE ROOM:", {
        originalName: cleanName,
        slug,
        adminId: req.userId,
      });

      const existingRoom = await prisma.room.findUnique({
        where: {
          slug,
        },
      });

      if (existingRoom) {
        return res.status(409).json({
          message: "Room already exists",
        });
      }

      const room = await prisma.room.create({
        data: {
          slug,
          name: cleanName,
          adminId: req.userId,
        },
      });

      console.log("ROOM CREATED:", room.slug);

      return res.status(201).json({
        message: "Room created successfully",
        room: {
          slug: room.slug,
          name: room.name,
          adminId: room.adminId,
        },
      });
    } catch (error: any) {
      console.error("CREATE ROOM ERROR:", error);

      if (error?.code === "P2002") {
        return res.status(409).json({
          message: "Room already exists",
        });
      }

      return res.status(500).json({
        message: "Failed to create room",
      });
    }
  },
);

/* GET MY ROOMS */

app.get(
  "/rooms",
  middleware,
  async (req: Request, res: Response) => {
    try {
      const rooms = await prisma.room.findMany({
        where: {
          adminId: req.userId,
        },
        orderBy: {
          slug: "asc",
        },
        select: {
          slug: true,
          name: true,
          adminId: true,
        },
      });

      return res.status(200).json({
        rooms,
      });
    } catch (error) {
      console.error("GET ROOMS ERROR:", error);

      return res.status(500).json({
        message: "Failed to fetch rooms",
      });
    }
  },
);

/* ----------------------------- FIND/JOIN ROOM ----------------------------- */

app.get(
  "/room/:roomId",
  middleware,
  async (req: Request, res: Response) => {
    try {
      const receivedRoomId = req.params.roomId;

      if (
        typeof receivedRoomId !== "string" ||
        receivedRoomId.trim().length === 0
      ) {
        return res.status(400).json({
          message: "Room ID is required",
        });
      }

      const roomId = getRoomSlug(receivedRoomId);

      console.log("JOIN ROOM:", {
        receivedRoomId,
        searchingFor: roomId,
      });

      const room = await prisma.room.findUnique({
        where: {
          slug: roomId,
        },
      });

      if (!room) {
        return res.status(404).json({
          message: "Room does not exist",
        });
      }

      return res.status(200).json({
        message: "Room found",
        room: {
          slug: room.slug,
          name: room.name,
          adminId: room.adminId,
        },
      });
    } catch (error) {
      console.error("JOIN ROOM ERROR:", error);

      return res.status(500).json({
        message: "Failed to join room",
      });
    }
  },
);

/* GET ROOM CHATS  */

app.get(
  "/chats/:roomId",
  middleware,
  async (req: Request, res: Response) => {
    try {
      const receivedRoomId = req.params.roomId;

      if (
        typeof receivedRoomId !== "string" ||
        receivedRoomId.trim().length === 0
      ) {
        return res.status(400).json({
          message: "Valid roomId is required",
        });
      }

      const roomId = getRoomSlug(receivedRoomId);

      const room = await prisma.room.findUnique({
        where: {
          slug: roomId,
        },
        select: {
          slug: true,
        },
      });

      if (!room) {
        return res.status(404).json({
          message: "Room does not exist",
        });
      }

      const messages = await prisma.chat.findMany({
        where: {
          roomId,
        },
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          message: true,
          roomId: true,
          userId: true,
        },
      });

      return res.status(200).json({
        roomId,
        messages,
      });
    } catch (error) {
      console.error("FAILED TO FETCH CHATS:", error);

      return res.status(500).json({
        message: "Failed to fetch chats",
      });
    }
  },
);

// GET ROOM DRAWING 

app.get(
  "/drawing/:roomId",
  middleware,
  async (req: Request, res: Response) => {
    try {
      const receivedRoomId = req.params.roomId;

      if (
        typeof receivedRoomId !== "string" ||
        receivedRoomId.trim().length === 0
      ) {
        return res.status(400).json({
          message: "Valid roomId is required",
        });
      }

      const roomId = getRoomSlug(receivedRoomId);

      const room = await prisma.room.findUnique({
        where: {
          slug: roomId,
        },
        select: {
          slug: true,
        },
      });

      if (!room) {
        return res.status(404).json({
          message: "Room does not exist",
        });
      }

      const drawing = await prisma.drawing.findUnique({
        where: {
          roomId,
        },
      });

      return res.status(200).json({
        roomId,
        drawing,
      });
    } catch (error) {
      console.error("FAILED TO FETCH DRAWING:", error);

      return res.status(500).json({
        message: "Failed to fetch drawing",
      });
    }
  },
);

// /SAVE/UPDATE DRAWING  

app.put(
  "/drawing/:roomId",
  middleware,
  async (req: Request, res: Response) => {
    try {
      const receivedRoomId = req.params.roomId;
const drawingData: Prisma.InputJsonValue = req.body;
      if (
        typeof receivedRoomId !== "string" ||
        receivedRoomId.trim().length === 0
      ) {
        return res.status(400).json({
          message: "Valid roomId is required",
        });
      }

      if (!isValidObject(drawingData)) {
        return res.status(400).json({
          message: "Invalid drawing data",
        });
      }

      if (
        "elements" in drawingData &&
        !Array.isArray(drawingData.elements)
      ) {
        return res.status(400).json({
          message: "Drawing elements must be an array",
        });
      }

      const roomId = getRoomSlug(receivedRoomId);

      const existingRoom = await prisma.room.findUnique({
        where: {
          slug: roomId,
        },
        select: {
          slug: true,
          adminId: true,
        },
      });

      if (!existingRoom) {
        return res.status(404).json({
          message: "Room does not exist",
        });
      }

      const drawing = await prisma.drawing.upsert({
        where: {
          roomId,
        },
        update: {
          data: drawingData,
        },
        create: {
          roomId,
          data: drawingData,
        },
      });

      return res.status(200).json({
        message: "Drawing saved successfully",
        drawing,
      });
    } catch (error) {
      console.error("SAVE DRAWING ERROR:", error);

      return res.status(500).json({
        message: "Failed to save drawing",
      });
    }
  },
);

// DELETE ROOM DRAWING 

app.delete(
  "/drawing/:roomId",
  middleware,
  async (req: Request, res: Response) => {
    try {
      const receivedRoomId = req.params.roomId;

      if (
        typeof receivedRoomId !== "string" ||
        receivedRoomId.trim().length === 0
      ) {
        return res.status(400).json({
          message: "Valid roomId is required",
        });
      }

      const roomId = getRoomSlug(receivedRoomId);

      const room = await prisma.room.findUnique({
        where: {
          slug: roomId,
        },
      });

      if (!room) {
        return res.status(404).json({
          message: "Room does not exist",
        });
      }

      const existingDrawing = await prisma.drawing.findUnique({
        where: {
          roomId,
        },
      });

      if (!existingDrawing) {
        return res.status(404).json({
          message: "Drawing does not exist",
        });
      }

      await prisma.drawing.delete({
        where: {
          roomId,
        },
      });

      return res.status(200).json({
        message: "Drawing deleted successfully",
      });
    } catch (error) {
      console.error("DELETE DRAWING ERROR:", error);

      return res.status(500).json({
        message: "Failed to delete drawing",
      });
    }
  },
);


/*SERVER */

app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});