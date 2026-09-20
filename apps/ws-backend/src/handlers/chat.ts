import { WebSocket } from "ws";
import { prisma } from "@repo/db-stable";

import { ConnectedUser } from "../types/message";
import {
  broadcastToRoom,
  sendError,
  sendMessage,
} from "../utils/webSocket";

export async function handleGetChats(
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
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  sendMessage(ws, {
    type: "room_chats",
    roomId: cleanRoomId,
    messages: messages.map((chat) => ({
      chatId: chat.id,
      message: chat.message,
      userId: chat.userId,
      username: chat.user.name,
    })),
  });
}

export async function handleChat(
  ws: WebSocket,
  user: ConnectedUser,
  roomId: string,
  message: string,
  connectedUsers: Map<WebSocket, ConnectedUser>,
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
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  broadcastToRoom(
    cleanRoomId,
    {
      type: "chat",
      roomId: cleanRoomId,
      message: savedChat.message,
      userId: savedChat.userId,
      username: savedChat.user.name,
      chatId: savedChat.id,
    },
    connectedUsers,
  );

  console.log(
    `Message sent by ${savedChat.user.name} (${user.userId}) in room ${cleanRoomId}`,
  );
}