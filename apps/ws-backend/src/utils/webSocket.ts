import { WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db-stable";

import { jwt_secret } from "@repo/backend-common/config";
import { ConnectedUser } from "../types/message";

export function sendMessage(ws: WebSocket, data: object): void {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(JSON.stringify(data));
}

export function sendError(
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

export function broadcastToRoom(
  roomId: string,
  data: object,
  connectedUsers: Map<WebSocket, ConnectedUser>,
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

export function removeUserFromRoom(
  user: ConnectedUser,
  roomId: string,
): boolean {
  return user.rooms.delete(roomId);
}

export function getUserFromSocket(
  ws: WebSocket,
  connectedUsers: Map<WebSocket, ConnectedUser>,
): ConnectedUser | undefined {
  return connectedUsers.get(ws);
}

export function getUserIdFromToken(token: string): string {
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

export function getRoomUsers(
  roomId: string,
  connectedUsers: Map<WebSocket, ConnectedUser>,
): string[] {
  const users: string[] = [];

  for (const user of connectedUsers.values()) {
    if (user.rooms.has(roomId)) {
      users.push(user.userId);
    }
  }

  return users;
}

export async function broadcastRoomUsers(
  roomId: string,
  connectedUsers: Map<WebSocket, ConnectedUser>,
): Promise<void> {
  const users = getRoomUsers(
    roomId,
    connectedUsers,
  );

  const userDetails = await prisma.user.findMany({
    where: {
      id: {
        in: users,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  broadcastToRoom(
    roomId,
    {
      type: "room_users",
      roomId,
      users: userDetails.map((user) => ({
        userId: user.id,
        name: user.name,
      })),
    },
    connectedUsers,
  );
}