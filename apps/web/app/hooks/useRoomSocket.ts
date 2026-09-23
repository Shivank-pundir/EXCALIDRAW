"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { toast } from "react-hot-toast";
import type { DrawingElement } from "../components/canvas/Canvas";
import type { ChatMessage } from "../components/chat/Chat";

const WS_BACKEND_URL = "ws://localhost:8080";

type RoomUser = {
  userId: string;
  name: string;
};

type Cursor = {
  x: number;
  y: number;
};

export function useRoomSocket(
  slug: string,
  onDrawingReceived: (elements: DrawingElement[]) => void,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const hasJoinedRoomRef = useRef(false);
  const skipDrawingBroadcastRef = useRef(false);
  const lastCursorSentRef = useRef(0);
  const onDrawingReceivedRef = useRef(onDrawingReceived);

  useEffect(() => {
    onDrawingReceivedRef.current = onDrawingReceived;
  }, [onDrawingReceived]);

  const [isConnected, setIsConnected] = useState(false);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<
    Record<string, Cursor>
  >({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatConnected, setIsChatConnected] = useState(false);

  // Current logged-in user's ID
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    if (!slug) return;

    const token = localStorage.getItem("token");

    if (!token) return;

    // Get current user's ID from JWT
    try {
      const tokenParts = token.split(".");

      if (tokenParts.length >= 2) {
  const payload = JSON.parse(atob(tokenParts[1]!));

        setCurrentUserId(
          String(
            payload.userId ??
              payload.id ??
              payload._id ??
              "",
          ),
        );
      }
    } catch (error) {
      console.error("Failed to decode user ID from token:", error);
      setCurrentUserId("");
    }

    const socket = new WebSocket(
      `${WS_BACKEND_URL}?token=${encodeURIComponent(token)}`,
    );

    wsRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setIsChatConnected(true);

      socket.send(
        JSON.stringify({
          type: "join_room",
          roomId: slug,
        }),
      );
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "joined_room") {
          if (data.roomId !== slug) return;

          hasJoinedRoomRef.current = true;

          socket.send(
            JSON.stringify({
              type: "get_chats",
              roomId: slug,
            }),
          );

          return;
        }

        if (data.type === "already_joined") {
          hasJoinedRoomRef.current = true;

          socket.send(
            JSON.stringify({
              type: "get_chats",
              roomId: slug,
            }),
          );

          return;
        }

        if (data.type === "room_users") {
          if (data.roomId === slug) {
            setRoomUsers(
              Array.isArray(data.users)
                ? data.users
                : [],
            );
          }

          return;
        }

        if (data.type === "user_joined") {
          if (data.roomId !== slug) return;

          toast.success("A user joined the room");

          return;
        }

        if (data.type === "user_left") {
          if (data.roomId !== slug) return;

          toast.success("A user left the room");

          setRemoteCursors((prev) => {
            const next = { ...prev };

            delete next[data.userId];

            return next;
          });

          return;
        }

        if (data.type === "cursor_move") {
          if (
            data.roomId !== slug ||
            typeof data.userId !== "string" ||
            typeof data.x !== "number" ||
            typeof data.y !== "number"
          ) {
            return;
          }

          setRemoteCursors((prev) => ({
            ...prev,
            [data.userId]: {
              x: data.x,
              y: data.y,
            },
          }));

          return;
        }

        if (data.type === "drawing") {
          if (
            data.roomId !== slug ||
            !Array.isArray(data.elements)
          ) {
            return;
          }

          skipDrawingBroadcastRef.current = true;

          onDrawingReceivedRef.current(
            data.elements as DrawingElement[],
          );

          return;
        }

        if (data.type === "room_chats") {
          if (data.roomId !== slug) return;

          const messages = Array.isArray(
            data.messages,
          )
            ? data.messages
            : [];

          setChatMessages(
            messages.map((message: any) => ({
              id: message.id,
              chatId:
                message.chatId ?? message.id,
              message: message.message,
              userId: message.userId,
              username: message.username,
            })),
          );

          return;
        }

        if (data.type === "chat") {
          if (data.roomId !== slug) return;

          setChatMessages((prev) => [
            ...prev,
            {
              chatId: data.chatId,
              message: data.message,
              userId: data.userId,
              username: data.username,
            },
          ]);

          return;
        }

        if (data.type === "error") {
          console.error(
            "WebSocket error:",
            data.message,
          );
        }
      } catch (error) {
        console.error(
          "Invalid WebSocket message:",
          error,
        );
      }
    };

    socket.onerror = (error) => {
      console.error(
        "❌ WebSocket error:",
        error,
      );

      setIsConnected(false);
      setIsChatConnected(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
      setIsChatConnected(false);
      setRemoteCursors({});
      hasJoinedRoomRef.current = false;
    };

    return () => {
      hasJoinedRoomRef.current = false;

      setRemoteCursors({});

      if (
        socket.readyState === WebSocket.OPEN
      ) {
        socket.send(
          JSON.stringify({
            type: "leave_room",
            roomId: slug,
          }),
        );
      }

      socket.close();

      wsRef.current = null;
    };
  }, [slug]);

  const sendCursorPosition = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const socket = wsRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      !hasJoinedRoomRef.current
    ) {
      return;
    }

    const now = Date.now();

    if (
      now - lastCursorSentRef.current <
      30
    ) {
      return;
    }

    lastCursorSentRef.current = now;

    const canvas = event.currentTarget;
    const rect =
      canvas.getBoundingClientRect();

    socket.send(
      JSON.stringify({
        type: "cursor_move",
        roomId: slug,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }),
    );
  };

  const sendChatMessage = () => {
    const message = chatInput.trim();
    const socket = wsRef.current;

    if (
      !message ||
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      !hasJoinedRoomRef.current
    ) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "chat",
        roomId: slug,
        message,
      }),
    );

    setChatInput("");
  };

  return {
    wsRef,
    hasJoinedRoomRef,
    skipDrawingBroadcastRef,
    isConnected,
    roomUsers,
    remoteCursors,
    chatMessages,
    chatInput,
    setChatInput,
    isChatConnected,
    currentUserId,
    sendCursorPosition,
    sendChatMessage,
  };
}