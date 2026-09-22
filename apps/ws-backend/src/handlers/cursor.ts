import { WebSocket } from "ws";

import { ConnectedUser } from "../types/message";
import { broadcastToRoom } from "../utils/webSocket";

export function handleCursorMove(
  ws: WebSocket,
  user: ConnectedUser,
  roomId: string,
  x: number,
  y: number,
  connectedUsers: Map<WebSocket, ConnectedUser>,
): void {
  const cleanRoomId = roomId.trim();

  if (!cleanRoomId) {
    return;
  }

  // Only users who are actually inside the room
  // are allowed to broadcast cursor positions.
  if (!user.rooms.has(cleanRoomId)) {
    return;
  }

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return;
  }

  broadcastToRoom(
    cleanRoomId,
    {
      type: "cursor_move",
      roomId: cleanRoomId,
      userId: user.userId,
      x,
      y,
    },
    connectedUsers,
    ws,
  );
}
