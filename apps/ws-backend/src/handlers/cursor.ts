import WebSocket from "ws";

import type {
  ConnectedUser,
  CursorMessage,
} from "../types/message";

import { broadcastToRoom } from "../utils/webSocket";

export function handleCursor(
  ws: WebSocket,
  message: CursorMessage,
  connectedUsers: Map<WebSocket, ConnectedUser>,
) {
  const user = connectedUsers.get(ws);

  console.log("🖱️ CURSOR RECEIVED:", message);

  if (!user) {
    console.log("❌ Cursor user not found");
    return;
  }

  const roomId = message.roomId.trim();

  if (!roomId) {
    console.log("❌ Cursor roomId is empty");
    return;
  }

  if (!user.rooms.has(roomId)) {
  console.log(
    "❌ Cursor ignored - user is not inside room:",
    roomId,
    "Current rooms:",
    [...user.rooms],
  );

  return;
}

  console.log("📡 BROADCASTING CURSOR:", {
    roomId,
    userId: user.userId,
    x: message.x,
    y: message.y,
  });

  broadcastToRoom(
    roomId,
    {
      type: "cursor",
      roomId,
      userId: user.userId,
      userName: user.userName,
      x: message.x,
      y: message.y,
    },
    connectedUsers,
    ws,
  );
}