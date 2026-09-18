import { WebSocket } from "ws";

import { ConnectedUser } from "../types/message";
import {
  broadcastToRoom,
  sendError,
} from "../utils/webSocket";

export function handleDrawing(
  ws: WebSocket,
  user: ConnectedUser,
  roomId: string,
  elements: unknown[],
  connectedUsers: Map<WebSocket, ConnectedUser>,
): void {
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

  broadcastToRoom(
    cleanRoomId,
    {
      type: "drawing",
      roomId: cleanRoomId,
      elements,
      userId: user.userId,
    },
    connectedUsers,
    ws,
  );

  console.log(
    `Drawing update from ${user.userId} in room ${cleanRoomId}`,
  );
}