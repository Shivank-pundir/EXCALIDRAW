import { WebSocket, WebSocketServer } from "ws";

import { handleJoinRoom, handleLeaveRoom } from "./handlers/room";
import { handleGetChats, handleChat } from "./handlers/chat";
import { handleDrawing } from "./handlers/drawing";

import {
  getUserFromSocket,
  getUserIdFromToken,
  sendError,
  broadcastToRoom,
  broadcastRoomUsers,
  sendMessage,
} from "./utils/webSocket";

import {
  ConnectedUser,
  IncomingMessage,
} from "./types/message";

const PORT = 8080;

const connectedUsers = new Map<WebSocket, ConnectedUser>();

const wss = new WebSocketServer({
  port: PORT,
});

console.log(`WebSocket server running on port ${PORT}`);

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

  if (data.type === "drawing") {
    return (
      typeof data.roomId === "string" &&
      Array.isArray(data.elements)
    );
  }

  return false;
}

wss.on("connection", (ws, request) => {
  let userId: string;

  // Authentication
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
    console.error(
      "WebSocket authentication error:",
      error,
    );

    sendError(ws, "Unauthorized connection");
    ws.close();
    return;
  }

  // Create connected user
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

  // Receive messages
  ws.on("message", async (rawMessage) => {
    try {
      const parsedData: unknown = JSON.parse(
        rawMessage.toString(),
      );

      if (!isIncomingMessage(parsedData)) {
        sendError(ws, "Invalid message format");
        return;
      }

      const currentUser = getUserFromSocket(
        ws,
        connectedUsers,
      );

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
            connectedUsers,
          );
          break;
        }

        case "leave_room": {
          await handleLeaveRoom(
            ws,
            currentUser,
            parsedData.roomId,
            connectedUsers,
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
            connectedUsers,
          );
          break;
        }

        case "drawing": {
          handleDrawing(
            ws,
            currentUser,
            parsedData.roomId,
            parsedData.elements,
            connectedUsers,
          );
          break;
        }

        default: {
          sendError(ws, "Invalid message type");
        }
      }
    } catch (error) {
      console.error(
        "WebSocket message error:",
        error,
      );

      sendError(ws, "Failed to process message");
    }
  });

  // Connection closed
  ws.on("close", async () => {
    const currentUser = connectedUsers.get(ws);

    if (!currentUser) {
      return;
    }

    const rooms = [...currentUser.rooms];

    for (const roomId of rooms) {
      currentUser.rooms.delete(roomId);

      broadcastToRoom(
        roomId,
        {
          type: "user_left",
          roomId,
          userId: currentUser.userId,
        },
        connectedUsers,
        ws,
      );

      await broadcastRoomUsers(
        roomId,
        connectedUsers,
      );
    }

    connectedUsers.delete(ws);

    console.log(
      `User disconnected: ${currentUser.userId}`,
    );
  });

  // WebSocket error
  ws.on("error", (error) => {
    console.error(
      `WebSocket error for user ${userId}:`,
      error,
    );
  });
});