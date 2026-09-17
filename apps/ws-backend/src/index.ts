import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

import { jwt_secret } from "@repo/backend-common/config";
import { prisma } from "@repo/db-stable";

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

type ConnectedUser = {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
};

type JoinRoomMessage = {
  type: "join_room";
  roomId: string;
};

type LeaveRoomMessage = {
  type: "leave_room";
  roomId: string;
};

type ChatMessage = {
  type: "chat";
  roomId: string;
  message: string;
};

type GetChatsMessage = {
  type: "get_chats";
  roomId: string;
};

type IncomingMessage =
  | JoinRoomMessage
  | LeaveRoomMessage
  | ChatMessage
  | GetChatsMessage;

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const PORT = 8080;

const connectedUsers = new Map<WebSocket, ConnectedUser>();

const wss = new WebSocketServer({
  port: PORT,
});

console.log(`WebSocket server running on port ${PORT}`);

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function sendMessage(ws: WebSocket, data: object): void {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(JSON.stringify(data));
}

function sendError(
  ws: WebSocket,
  message: string,
  roomId?: string,
): void {
  sendMessage(ws, {
    type: "error",
    message,
    ...(roomId ? { roomId } : {}),
  });
}

function broadcastToRoom(
  roomId: string,
  data: object,
  excludedWs?: WebSocket,
): void {
  for (const user of connectedUsers.values()) {
    const isMember = user.rooms.has(roomId);
    const isExcluded = user.ws === excludedWs;

    if (isMember && !isExcluded) {
      sendMessage(user.ws, data);
    }
  }
}

function removeUserFromRoom(
  user: ConnectedUser,
  roomId: string,
): boolean {
  return user.rooms.delete(roomId);
}

function getUserFromSocket(
  ws: WebSocket,
): ConnectedUser | undefined {
  return connectedUsers.get(ws);
}

function getUserIdFromToken(token: string): string {
  const decodedToken = jwt.verify(token, jwt_secret);

  if (typeof decodedToken === "string" || !decodedToken) {
    throw new Error("Invalid token");
  }

  const userId = String(
    decodedToken.userId ??
      decodedToken.id ??
      decodedToken._id ??
      "",
  );

  if (!userId) {
    throw new Error("User ID is missing in token");
  }

  return userId;
}

function isIncomingMessage(
  value: unknown,
): value is IncomingMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  if (typeof data.type !== "string") {
    return false;
  }

  if (
    data.type === "join_room" ||
    data.type === "leave_room" ||
    data.type === "get_chats"
  ) {
    return typeof data.roomId === "string";
  }

  if (data.type === "chat") {
    return (
      typeof data.roomId === "string" &&
      typeof data.message === "string"
    );
  }

  return false;
}

/* -------------------------------------------------------------------------- */
/*                                JOIN ROOM                                   */
/* -------------------------------------------------------------------------- */

async function handleJoinRoom(
  ws: WebSocket,
  user: ConnectedUser,
  roomId: string,
): Promise<void> {
  const cleanRoomId = roomId.trim();

  if (!cleanRoomId) {
    sendError(ws, "Room ID is required");
    return;
  }

  const room = await prisma.room.findUnique({
    where: {
      slug: cleanRoomId,
    },
  });

  if (!room) {
    sendError(ws, "Room not found", cleanRoomId);
    return;
  }

  if (user.rooms.has(cleanRoomId)) {
    sendMessage(ws, {
      type: "already_joined",
      roomId: cleanRoomId,
      message: "You have already joined this room",
    });

    return;
  }

  user.rooms.add(cleanRoomId);

  sendMessage(ws, {
    type: "joined_room",
    roomId: cleanRoomId,
    message: `Joined room ${cleanRoomId}`,
  });

  broadcastToRoom(
    cleanRoomId,
    {
      type: "user_joined",
      roomId: cleanRoomId,
      userId: user.userId,
    },
    ws,
  );

  console.log(
    `User ${user.userId} joined room ${cleanRoomId}`,
  );
}

/* -------------------------------------------------------------------------- */
/*                                LEAVE ROOM                                  */
/* -------------------------------------------------------------------------- */

async function handleLeaveRoom(
  ws: WebSocket,
  user: ConnectedUser,
  roomId: string,
): Promise<void> {
  const cleanRoomId = roomId.trim();

  if (!cleanRoomId) {
    sendError(ws, "Room ID is required");
    return;
  }

  const wasMember = removeUserFromRoom(user, cleanRoomId);

  if (!wasMember) {
    sendError(
      ws,
      "You have not joined this room",
      cleanRoomId,
    );

    return;
  }

  sendMessage(ws, {
    type: "left_room",
    roomId: cleanRoomId,
    message: `You left room ${cleanRoomId}`,
  });

  broadcastToRoom(cleanRoomId, {
    type: "user_left",
    roomId: cleanRoomId,
    userId: user.userId,
  });

  console.log(
    `User ${user.userId} left room ${cleanRoomId}`,
  );
}

/* -------------------------------------------------------------------------- */
/*                                GET CHATS                                   */
/* -------------------------------------------------------------------------- */

async function handleGetChats(
  ws: WebSocket,
  user: ConnectedUser,
  roomId: string,
): Promise<void> {
  const cleanRoomId = roomId.trim();

  if (!cleanRoomId) {
    sendError(ws, "Room ID is required");
    return;
  }

  if (!user.rooms.has(cleanRoomId)) {
    sendError(
      ws,
      "You have not joined this room",
      cleanRoomId,
    );

    return;
  }

  const room = await prisma.room.findUnique({
    where: {
      slug: cleanRoomId,
    },
  });

  if (!room) {
    sendError(ws, "Room not found", cleanRoomId);
    return;
  }

  const messages = await prisma.chat.findMany({
    where: {
      roomId: cleanRoomId,
    },
    orderBy: {
      id: "asc",
    },
  });

  sendMessage(ws, {
    type: "room_chats",
    roomId: cleanRoomId,
    messages,
  });
}

/* -------------------------------------------------------------------------- */
/*                                  CHAT                                      */
/* -------------------------------------------------------------------------- */

async function handleChat(
  ws: WebSocket,
  user: ConnectedUser,
  roomId: string,
  message: string,
): Promise<void> {
  const cleanRoomId = roomId.trim();
  const cleanMessage = message.trim();

  if (!cleanRoomId || !cleanMessage) {
    sendError(ws, "Room ID and message are required");
    return;
  }

  if (!user.rooms.has(cleanRoomId)) {
    sendError(
      ws,
      "You have not joined this room",
      cleanRoomId,
    );

    return;
  }

  const room = await prisma.room.findUnique({
    where: {
      slug: cleanRoomId,
    },
  });

  if (!room) {
    sendError(ws, "Room not found", cleanRoomId);
    return;
  }

  const savedChat = await prisma.chat.create({
    data: {
      roomId: cleanRoomId,
      message: cleanMessage,
      userId: user.userId,
    },
  });

  broadcastToRoom(cleanRoomId, {
    type: "chat",
    roomId: cleanRoomId,
    message: savedChat.message,
    userId: savedChat.userId,
    chatId: savedChat.id,
  });

  console.log(
    `Message sent by ${user.userId} in room ${cleanRoomId}`,
  );
}

/* -------------------------------------------------------------------------- */
/*                              WEBSOCKET SERVER                              */
/* -------------------------------------------------------------------------- */

wss.on("connection", (ws, request) => {
  let userId: string;

  try {
    const url = new URL(
      request.url ?? "",
      `http://${request.headers.host ?? "localhost"}`,
    );

    const token = url.searchParams.get("token");

    if (!token) {
      sendError(ws, "Token is required");
      ws.close();
      return;
    }

    userId = getUserIdFromToken(token);
  } catch (error) {
    console.error("WebSocket authentication error:", error);

    sendError(ws, "Unauthorized connection");
    ws.close();
    return;
  }

  const user: ConnectedUser = {
    ws,
    userId,
    rooms: new Set<string>(),
  };

  connectedUsers.set(ws, user);

  console.log(`User connected: ${userId}`);

  sendMessage(ws, {
    type: "connected",
    message: "WebSocket connected successfully",
    userId,
  });

  /* ------------------------------------------------------------------------ */
  /*                              MESSAGE HANDLER                             */
  /* ------------------------------------------------------------------------ */

  ws.on("message", async (rawMessage) => {
    try {
      const parsedData: unknown = JSON.parse(
        rawMessage.toString(),
      );

      if (!isIncomingMessage(parsedData)) {
        sendError(ws, "Invalid message format");
        return;
      }

      const currentUser = getUserFromSocket(ws);

      if (!currentUser) {
        sendError(ws, "User connection not found");
        return;
      }

      switch (parsedData.type) {
        case "join_room": {
          await handleJoinRoom(
            ws,
            currentUser,
            parsedData.roomId,
          );
          break;
        }

        case "leave_room": {
          await handleLeaveRoom(
            ws,
            currentUser,
            parsedData.roomId,
          );
          break;
        }

        case "get_chats": {
          await handleGetChats(
            ws,
            currentUser,
            parsedData.roomId,
          );
          break;
        }

        case "chat": {
          await handleChat(
            ws,
            currentUser,
            parsedData.roomId,
            parsedData.message,
          );
          break;
        }

        default: {
          sendError(ws, "Invalid message type");
        }
      }
    } catch (error) {
      console.error("WebSocket message error:", error);

      sendError(ws, "Failed to process message");
    }
  });

  ws.on("close", () => {
    const currentUser = connectedUsers.get(ws);

    if (!currentUser) {
      return;
    }

    for (const roomId of currentUser.rooms) {
      broadcastToRoom(
        roomId,
        {
          type: "user_left",
          roomId,
          userId: currentUser.userId,
        },
        ws,
      );
    }

    connectedUsers.delete(ws);

    console.log(
      `User disconnected: ${currentUser.userId}`,
    );
  });

  ws.on("error", (error) => {
    console.error(
      `WebSocket error for user ${userId}:`,
      error,
    );
  });
});