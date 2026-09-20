import { WebSocket } from "ws";
import { prisma } from "@repo/db-stable";

import { ConnectedUser } from "../types/message";
import {
  broadcastRoomUsers,
  broadcastToRoom,
  removeUserFromRoom,
  sendError,
  sendMessage,
} from "../utils/webSocket";

export async function handleJoinRoom(
  ws: WebSocket,
  user: ConnectedUser,
  roomId: string,
  connectedUsers: Map<WebSocket, ConnectedUser>,
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
  console.log(
  "✅ ROOM JOINED:",
  user.userId,
  cleanRoomId,
  [...user.rooms],
);

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
    connectedUsers,
    ws,
  );
 await broadcastRoomUsers(cleanRoomId, connectedUsers);

  console.log(
    `User ${user.userId} joined room ${cleanRoomId}`,
  );
}

export async function handleLeaveRoom(
  ws: WebSocket,
  user: ConnectedUser,
  roomId: string,
  connectedUsers: Map<WebSocket, ConnectedUser>,
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

  broadcastToRoom(
    cleanRoomId,
    {
      type: "user_left",
      roomId: cleanRoomId,
      userId: user.userId,
    },
    connectedUsers,
  );
  broadcastRoomUsers(cleanRoomId, connectedUsers);

  console.log(
    `User ${user.userId} left room ${cleanRoomId}`,
  );
}