import { WebSocket } from "ws";

export type ConnectedUser = {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
};

export type RoomUser = {
  userId: string;
};

export type RoomUsersMessage = {
  type: "room_users";
  roomId: string;
  users: RoomUser[];
};

export type JoinRoomMessage = {
  type: "join_room";
  roomId: string;
};

export type LeaveRoomMessage = {
  type: "leave_room";
  roomId: string;
};

export type ChatMessage = {
  type: "chat";
  roomId: string;
  message: string;
};

export type GetChatsMessage = {
  type: "get_chats";
  roomId: string;
};

export type DrawingMessage = {
  type: "drawing";
  roomId: string;
  elements: unknown[];
};

export type IncomingMessage =
  | JoinRoomMessage
  | LeaveRoomMessage
  | ChatMessage
  | GetChatsMessage
  | DrawingMessage;