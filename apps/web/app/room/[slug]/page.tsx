"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import RoomHeader from "./components/RoomHader";
import Toolbar from "./components/Toolbar";
import Canvas, {
  type DrawingElement,
  type Point,
  type Tool,
} from "./components/Canvas";
import Chat, {
  type ChatMessage,
} from "./components/Chat";
import ZoomControls from "./components/ZoomControl";

const HTTP_BACKEND_URL = "http://localhost:4000";
const WS_BACKEND_URL = "ws://localhost:8080";

export default function RoomPage() {
  const params = useParams();

  const slug = params.slug as string;

  // =========================================================
  // REFS
  // =========================================================

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const wsRef =
    useRef<WebSocket | null>(null);

  const hasJoinedRoomRef =
    useRef(false);

  const skipDrawingBroadcastRef =
    useRef(false);

  // =========================================================
  // DRAWING STATE
  // =========================================================

  const [elements, setElements] =
    useState<DrawingElement[]>([]);

  const [history, setHistory] =
    useState<DrawingElement[][]>([]);

  const [redoStack, setRedoStack] =
    useState<DrawingElement[][]>([]);

  const [selectedElementId, setSelectedElementId] =
    useState<string | null>(null);

  const [selectedTool, setSelectedTool] =
    useState<Tool>("pen");

  const [strokeColor, setStrokeColor] =
    useState("#111827");

  const [fillColor, setFillColor] =
    useState("transparent");

  const [strokeWidth, setStrokeWidth] =
    useState(3);

  const [fontSize, setFontSize] =
    useState(24);

  const [zoom, setZoom] =
    useState(1);

  // =========================================================
  // DRAWING REFS
  // =========================================================

  const isDrawingRef =
    useRef(false);

  const currentElementIdRef =
    useRef<string | null>(null);

  const startPointRef =
    useRef<Point | null>(null);

  const movingElementRef =
    useRef<DrawingElement | null>(null);

  const moveOffsetRef =
    useRef<Point | null>(null);

  // =========================================================
  // SAVE / LOAD STATE
  // =========================================================

  const [isSaving, setIsSaving] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  // =========================================================
  // WEBSOCKET STATE
  // =========================================================

  const [isConnected, setIsConnected] =
    useState(false);

 const [roomUsers, setRoomUsers] =
  useState<
    {
      userId: string;
      name: string;
    }[]
  >([]);

  const [remoteCursors, setRemoteCursors] =
    useState<
      Record<
        string,
        {
          x: number;
          y: number;
        }
      >
    >({});

  const lastCursorSentRef =
    useRef(0);

  // =========================================================
  // CHAT STATE
  // =========================================================

  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>([]);

  const [chatInput, setChatInput] =
    useState("");

  const [isChatConnected, setIsChatConnected] =
    useState(false);

  // =========================================================
  // GET CANVAS POINT
  // =========================================================

  const getPoint = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): Point => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect =
      canvas.getBoundingClientRect();

    return {
      x:
        (event.clientX - rect.left) /
        zoom,
      y:
        (event.clientY - rect.top) /
        zoom,
    };
  };

  // =========================================================
  // SEND CURSOR POSITION
  // =========================================================

  const sendCursorPosition = (
    event: React.PointerEvent<HTMLCanvasElement>,
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

    if (now - lastCursorSentRef.current < 30) {
      return;
    }

    lastCursorSentRef.current = now;

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

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

  // =========================================================
  // HISTORY
  // =========================================================

  const saveHistory = () => {
    setHistory((prev) => [
      ...prev,
      elements,
    ]);

    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length === 0) {
      return;
    }

    const previousState =
      history[history.length - 1];

    setHistory((prev) =>
      prev.slice(0, -1),
    );

    setRedoStack((prev) => [
      ...prev,
      elements,
    ]);

    setElements(previousState);

    setSelectedElementId(null);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      return;
    }

    const nextState =
      redoStack[redoStack.length - 1];

    setRedoStack((prev) =>
      prev.slice(0, -1),
    );

    setHistory((prev) => [
      ...prev,
      elements,
    ]);

    setElements(nextState);

    setSelectedElementId(null);
  };

  // =========================================================
  // HIT TESTING
  // =========================================================

  const isPointInsideElement = (
    point: Point,
    element: DrawingElement,
  ): boolean => {
    if (element.type === "rectangle") {
      const minX = Math.min(
        element.x,
        element.x + element.width,
      );

      const maxX = Math.max(
        element.x,
        element.x + element.width,
      );

      const minY = Math.min(
        element.y,
        element.y + element.height,
      );

      const maxY = Math.max(
        element.y,
        element.y + element.height,
      );

      return (
        point.x >= minX &&
        point.x <= maxX &&
        point.y >= minY &&
        point.y <= maxY
      );
    }

    if (element.type === "circle") {
      const radiusX =
        Math.abs(element.radiusX);

      const radiusY =
        Math.abs(element.radiusY);

      if (
        radiusX === 0 ||
        radiusY === 0
      ) {
        return false;
      }

      const dx =
        (point.x - element.x) /
        radiusX;

      const dy =
        (point.y - element.y) /
        radiusY;

      return dx * dx + dy * dy <= 1;
    }

    if (
      element.type === "line" ||
      element.type === "arrow"
    ) {
      const x1 = element.start.x;
      const y1 = element.start.y;

      const x2 = element.end.x;
      const y2 = element.end.y;

      const dx = x2 - x1;
      const dy = y2 - y1;

      const lengthSquared =
        dx * dx + dy * dy;

      if (lengthSquared === 0) {
        return (
          Math.hypot(
            point.x - x1,
            point.y - y1,
          ) < 10
        );
      }

      let t =
        ((point.x - x1) * dx +
          (point.y - y1) * dy) /
        lengthSquared;

      t = Math.max(
        0,
        Math.min(1, t),
      );

      const closestX =
        x1 + t * dx;

      const closestY =
        y1 + t * dy;

      const distance =
        Math.hypot(
          point.x - closestX,
          point.y - closestY,
        );

      return distance <= 10;
    }

    if (element.type === "text") {
      const canvas =
        canvasRef.current;

      const context =
        canvas?.getContext("2d");

      if (!context) {
        return false;
      }

      context.font =
        `${element.fontSize}px sans-serif`;

      const width =
        context.measureText(
          element.text,
        ).width;

      return (
        point.x >= element.x &&
        point.x <=
          element.x + width &&
        point.y <= element.y &&
        point.y >=
          element.y -
            element.fontSize
      );
    }

    if (element.type === "pen") {
      return element.points.some(
        (p) =>
          Math.hypot(
            point.x - p.x,
            point.y - p.y,
          ) <= 10,
      );
    }

    return false;
  };

  const findElementAtPoint = (
    point: Point,
  ): DrawingElement | null => {
    for (
      let i = elements.length - 1;
      i >= 0;
      i--
    ) {
      const element =
        elements[i];

      if (
        isPointInsideElement(
          point,
          element,
        )
      ) {
        return element;
      }
    }

    return null;
  };

  // =========================================================
  // CREATE ELEMENT
  // =========================================================

  const createBaseElement = (
    id: string,
    type: Tool,
  ) => ({
    id,
    type,
    strokeColor,
    strokeWidth,
    fillColor,
  });

  // =========================================================
  // POINTER DOWN
  // =========================================================

  const handlePointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    const point =
      getPoint(event);

    // -------------------------------------------------------
    // SELECT
    // -------------------------------------------------------

    if (selectedTool === "select") {
      const element =
        findElementAtPoint(point);

      if (!element) {
        setSelectedElementId(null);
        return;
      }

      saveHistory();

      setSelectedElementId(
        element.id,
      );

      movingElementRef.current =
        element;

      moveOffsetRef.current = {
        x:
          point.x -
          (
            element.type === "pen"
              ? element.points[0]?.x ?? 0
              : element.type === "text" ||
                  element.type ===
                    "rectangle" ||
                  element.type ===
                    "circle"
                ? element.x
                : element.start.x
          ),

        y:
          point.y -
          (
            element.type === "pen"
              ? element.points[0]?.y ?? 0
              : element.type === "text" ||
                  element.type ===
                    "rectangle" ||
                  element.type ===
                    "circle"
                ? element.y
                : element.start.y
          ),
      };

      isDrawingRef.current =
        true;

      return;
    }

    // -------------------------------------------------------
    // ERASER
    // -------------------------------------------------------

    if (selectedTool === "eraser") {
      const element =
        findElementAtPoint(point);

      if (!element) {
        return;
      }

      saveHistory();

      setElements((prev) =>
        prev.filter(
          (item) =>
            item.id !== element.id,
        ),
      );

      return;
    }

    // -------------------------------------------------------
    // TEXT
    // -------------------------------------------------------

    if (selectedTool === "text") {
      const text =
        window.prompt("Enter text:");

      if (!text?.trim()) {
        return;
      }

      saveHistory();

      const newElement: DrawingElement = {
        ...createBaseElement(
          crypto.randomUUID(),
          "text",
        ),
        type: "text",
        x: point.x,
        y: point.y,
        text: text.trim(),
        fontSize,
      };

      setElements((prev) => [
        ...prev,
        newElement,
      ]);

      return;
    }

    // -------------------------------------------------------
    // PEN
    // -------------------------------------------------------

    if (selectedTool === "pen") {
      saveHistory();

      const id =
        crypto.randomUUID();

      currentElementIdRef.current =
        id;

      startPointRef.current =
        point;

      isDrawingRef.current =
        true;

      const newElement: DrawingElement = {
        ...createBaseElement(
          id,
          "pen",
        ),
        type: "pen",
        points: [point],
      };

      setElements((prev) => [
        ...prev,
        newElement,
      ]);

      return;
    }

    // -------------------------------------------------------
    // RECTANGLE
    // -------------------------------------------------------

    if (
      selectedTool === "rectangle"
    ) {
      saveHistory();

      const id =
        crypto.randomUUID();

      currentElementIdRef.current =
        id;

      startPointRef.current =
        point;

      isDrawingRef.current =
        true;

      const newElement: DrawingElement = {
        ...createBaseElement(
          id,
          "rectangle",
        ),
        type: "rectangle",
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      };

      setElements((prev) => [
        ...prev,
        newElement,
      ]);

      return;
    }

    // -------------------------------------------------------
    // CIRCLE
    // -------------------------------------------------------

    if (selectedTool === "circle") {
      saveHistory();

      const id =
        crypto.randomUUID();

      currentElementIdRef.current =
        id;

      startPointRef.current =
        point;

      isDrawingRef.current =
        true;

      const newElement: DrawingElement = {
        ...createBaseElement(
          id,
          "circle",
        ),
        type: "circle",
        x: point.x,
        y: point.y,
        radiusX: 0,
        radiusY: 0,
      };

      setElements((prev) => [
        ...prev,
        newElement,
      ]);

      return;
    }

    // -------------------------------------------------------
    // LINE
    // -------------------------------------------------------

    if (selectedTool === "line") {
      saveHistory();

      const id =
        crypto.randomUUID();

      currentElementIdRef.current =
        id;

      startPointRef.current =
        point;

      isDrawingRef.current =
        true;

      const newElement: DrawingElement = {
        ...createBaseElement(
          id,
          "line",
        ),
        type: "line",
        start: point,
        end: point,
      };

      setElements((prev) => [
        ...prev,
        newElement,
      ]);

      return;
    }

    // -------------------------------------------------------
    // ARROW
    // -------------------------------------------------------

    if (selectedTool === "arrow") {
      saveHistory();

      const id =
        crypto.randomUUID();

      currentElementIdRef.current =
        id;

      startPointRef.current =
        point;

      isDrawingRef.current =
        true;

      const newElement: DrawingElement = {
        ...createBaseElement(
          id,
          "arrow",
        ),
        type: "arrow",
        start: point,
        end: point,
      };

      setElements((prev) => [
        ...prev,
        newElement,
      ]);

      return;
    }
  };

  // =========================================================
  // POINTER MOVE
  // =========================================================

  const handlePointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    sendCursorPosition(event);

    const point =
      getPoint(event);

    // -------------------------------------------------------
    // MOVING SELECTED ELEMENT
    // -------------------------------------------------------

    if (
      selectedTool === "select" &&
      isDrawingRef.current &&
      movingElementRef.current &&
      moveOffsetRef.current
    ) {
      const element =
        movingElementRef.current;

      const offset =
        moveOffsetRef.current;

      const dx =
        point.x - offset.x;

      const dy =
        point.y - offset.y;

      setElements((prev) =>
        prev.map((item) => {
          if (
            item.id !== element.id
          ) {
            return item;
          }

          if (item.type === "pen") {
            const originalFirst =
              element.points[0];

            if (!originalFirst) {
              return item;
            }

            const deltaX =
              dx - originalFirst.x;

            const deltaY =
              dy - originalFirst.y;

            return {
              ...item,
              points:
                element.points.map(
                  (p) => ({
                    x:
                      p.x + deltaX,
                    y:
                      p.y + deltaY,
                  }),
                ),
            };
          }

          if (
            item.type ===
              "rectangle" ||
            item.type === "circle" ||
            item.type === "text"
          ) {
            return {
              ...item,
              x: dx,
              y: dy,
            };
          }

          if (
            item.type === "line" ||
            item.type === "arrow"
          ) {
            const originalStart =
              element.start;

            const deltaX =
              dx -
              originalStart.x;

            const deltaY =
              dy -
              originalStart.y;

            return {
              ...item,
              start: {
                x:
                  element.start.x +
                  deltaX,
                y:
                  element.start.y +
                  deltaY,
              },
              end: {
                x:
                  element.end.x +
                  deltaX,
                y:
                  element.end.y +
                  deltaY,
              },
            };
          }

          return item;
        }),
      );

      return;
    }

    // -------------------------------------------------------
    // DRAWING
    // -------------------------------------------------------

    if (
      !isDrawingRef.current ||
      !currentElementIdRef.current ||
      !startPointRef.current
    ) {
      return;
    }

    const elementId =
      currentElementIdRef.current;

    const start =
      startPointRef.current;

    setElements((prev) =>
      prev.map((element) => {
        if (
          element.id !== elementId
        ) {
          return element;
        }

        // PEN

        if (element.type === "pen") {
          return {
            ...element,
            points: [
              ...element.points,
              point,
            ],
          };
        }

        // RECTANGLE

        if (
          element.type ===
          "rectangle"
        ) {
          return {
            ...element,
            width:
              point.x - start.x,
            height:
              point.y - start.y,
          };
        }

        // CIRCLE

        if (
          element.type === "circle"
        ) {
          return {
            ...element,
            radiusX:
              point.x - start.x,
            radiusY:
              point.y - start.y,
          };
        }

        // LINE

        if (element.type === "line") {
          return {
            ...element,
            end: point,
          };
        }

        // ARROW

        if (
          element.type === "arrow"
        ) {
          return {
            ...element,
            end: point,
          };
        }

        return element;
      }),
    );
  };

  // =========================================================
  // POINTER UP
  // =========================================================

  const handlePointerUp = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }

    isDrawingRef.current =
      false;

    currentElementIdRef.current =
      null;

    startPointRef.current =
      null;

    movingElementRef.current =
      null;

    moveOffsetRef.current =
      null;
  };

  // =========================================================
  // POINTER CANCEL
  // =========================================================

  const handlePointerCancel = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }

    isDrawingRef.current =
      false;

    currentElementIdRef.current =
      null;

    startPointRef.current =
      null;

    movingElementRef.current =
      null;

    moveOffsetRef.current =
      null;
  };

  // =========================================================
  // DELETE SELECTED
  // =========================================================

  const handleDelete = () => {
    if (!selectedElementId) {
      return;
    }

    saveHistory();

    setElements((prev) =>
      prev.filter(
        (element) =>
          element.id !==
          selectedElementId,
      ),
    );

    setSelectedElementId(null);
  };

  // =========================================================
  // CLEAR CANVAS
  // =========================================================

  const handleClear = () => {
    if (elements.length === 0) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to clear the canvas?",
      );

    if (!confirmed) {
      return;
    }

    saveHistory();

    setElements([]);

    setSelectedElementId(null);
  };

  // =========================================================
  // SAVE DRAWING
  // =========================================================

  const saveDrawing = useCallback(
    async () => {
      if (!slug) {
        return;
      }

      const token =
        localStorage.getItem("token");

      if (!token) {
        console.error(
          "❌ No token found",
        );
        return;
      }

      try {
        setIsSaving(true);

        const url =
          `${HTTP_BACKEND_URL}/drawing/${slug}`;

        console.log(
          "💾 Saving drawing to:",
          url,
        );

        const response =
          await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              elements,
            }),
          });

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            `Failed to save drawing: ${response.status} ${errorText}`,
          );
        }

        const data =
          await response.json();

        console.log(
          "✅ Drawing saved:",
          data,
        );
      } catch (error) {
        console.error(
          "❌ Save drawing error:",
          error,
        );
      } finally {
        setIsSaving(false);
      }
    },
    [elements, slug],
  );

  // =========================================================
  // LOAD DRAWING
  // =========================================================

  const loadDrawing = useCallback(
    async () => {
      if (!slug) {
        return;
      }

      const token =
        localStorage.getItem("token");

      if (!token) {
        console.error(
          "❌ No token found",
        );

        setIsLoading(false);

        return;
      }

      try {
        setIsLoading(true);

        const url =
          `${HTTP_BACKEND_URL}/drawing/${slug}`;

        console.log(
          "📥 Loading drawing from:",
          url,
        );

        const response =
          await fetch(url, {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          });

        console.log(
          "📥 Load drawing status:",
          response.status,
        );

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            `Failed to load drawing: ${response.status} ${errorText}`,
          );
        }

        const data =
          await response.json();

        console.log(
          "📥 Drawing response:",
          data,
        );

        const drawingData =
          data?.drawing?.data;

        const loadedElements =
          Array.isArray(
            drawingData?.elements,
          )
            ? drawingData.elements
            : [];

        /*
         * Prevent the loaded drawing
         * from being broadcast back.
         */
        skipDrawingBroadcastRef.current =
          true;

        setElements(
          loadedElements as DrawingElement[],
        );
      } catch (error) {
        console.error(
          "❌ Load drawing error:",
          error,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [slug],
  );

  // =========================================================
  // LOAD DRAWING ON ROOM OPEN
  // =========================================================

  useEffect(() => {
    loadDrawing();
  }, [loadDrawing]);

  // =========================================================
  // AUTO SAVE
  // =========================================================

  useEffect(() => {
    if (isLoading) {
      return;
    }

    /*
     * Do NOT check elements.length here.
     *
     * An empty array is also a valid drawing state.
     * This allows Clear to save:
     *
     * {
     *   elements: []
     * }
     */

    const timer =
      setTimeout(() => {
        saveDrawing();
      }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [
    elements,
    isLoading,
    saveDrawing,
  ]);

  // =========================================================
  // WEBSOCKET
  // =========================================================

  useEffect(() => {
    if (!slug) {
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    const socket =
      new WebSocket(
        `${WS_BACKEND_URL}?token=${encodeURIComponent(
          token,
        )}`,
      );

    wsRef.current = socket;

    socket.onopen = () => {
      console.log(
        "✅ WebSocket connected",
      );

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
        const data =
          JSON.parse(event.data);

        console.log(
          "📩 WebSocket message:",
          data,
        );

        

   // ---------------------------------------------------
// JOINED ROOM
// ---------------------------------------------------

if (data.type === "joined_room") {
  if (data.roomId !== slug) {
    return;
  }

  hasJoinedRoomRef.current = true;

  socket.send(
    JSON.stringify({
      type: "get_chats",
      roomId: slug,
    }),
  );

  return;
}

// ---------------------------------------------------
// ALREADY JOINED
// ---------------------------------------------------

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

        // ---------------------------------------------------
        // ROOM USERS
        // ---------------------------------------------------

        if (
          data.type ===
          "room_users"
        ) {
          if (
            data.roomId === slug
          ) {
            setRoomUsers(
              Array.isArray(
                data.users,
              )
                ? data.users
                : [],
            );
          }

          return;
        }

        // ---------------------------------------------------
        // USER JOINED
        // ---------------------------------------------------

       // ---------------------------------------------------
// USER JOINED
// ---------------------------------------------------

if (data.type === "user_joined") {
  if (data.roomId !== slug) {
    return;
  }

  toast.success("A user joined the room");

  return;
}

// ---------------------------------------------------
// USER LEFT
// ---------------------------------------------------

if (data.type === "user_left") {
  if (data.roomId !== slug) {
    return;
  }

  toast.success("A user left the room");

  setRemoteCursors((prev) => {
    const next = { ...prev };
    delete next[data.userId];
    return next;
  });

  return;
}
        // ---------------------------------------------------
        // REMOTE CURSOR
        // ---------------------------------------------------

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

        // ---------------------------------------------------
        // DRAWING
        // ---------------------------------------------------

        if (
          data.type ===
          "drawing"
        ) {
          if (
            data.roomId !== slug
          ) {
            return;
          }

          if (
            !Array.isArray(
              data.elements,
            )
          ) {
            return;
          }

          skipDrawingBroadcastRef.current =
            true;

          setElements(
            data.elements as DrawingElement[],
          );

          return;
        }

        // ---------------------------------------------------
        // ROOM CHATS
        // ---------------------------------------------------

      if (data.type === "room_chats") {
  if (data.roomId !== slug) {
    return;
  }

  const messages = Array.isArray(data.messages)
    ? data.messages
    : [];

  setChatMessages(
    messages.map((message: any) => ({
      id: message.id,
      chatId: message.chatId ?? message.id,
      message: message.message,
      userId: message.userId,
      username: message.username,
    })),
  );

  return;
}

        // ---------------------------------------------------
        // NEW CHAT MESSAGE
        // ---------------------------------------------------

       if (data.type === "chat") {
  if (data.roomId !== slug) {
    return;
  }

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

        // ---------------------------------------------------
        // ERROR
        // ---------------------------------------------------

        if (
          data.type === "error"
        ) {
          console.error(
            "WebSocket error:",
            data.message,
          );

          return;
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
      console.log(
        "🔌 WebSocket disconnected",
      );

      setIsConnected(false);
      setIsChatConnected(false);
      setRemoteCursors({});

      hasJoinedRoomRef.current =
        false;
    };

    return () => {
      hasJoinedRoomRef.current =
        false;
      setRemoteCursors({});

      if (
        socket.readyState ===
        WebSocket.OPEN
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

  // =========================================================
  // BROADCAST DRAWING
  // =========================================================

  useEffect(() => {
    if (
      !hasJoinedRoomRef.current
    ) {
      return;
    }

    if (
      skipDrawingBroadcastRef.current
    ) {
      skipDrawingBroadcastRef.current =
        false;

      return;
    }

    const socket =
      wsRef.current;

    if (
      !socket ||
      socket.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "drawing",
        roomId: slug,
        elements,
      }),
    );
  }, [elements, slug]);

  // =========================================================
  // SEND CHAT
  // =========================================================

  const sendChatMessage = () => {
    const message =
      chatInput.trim();

    if (!message) {
      return;
    }

    const socket =
      wsRef.current;

    if (
      !socket ||
      socket.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }

    if (
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

  // =========================================================
  // KEYBOARD SHORTCUTS
  // =========================================================

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      const target =
        event.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "z"
      ) {
        event.preventDefault();

        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }

        return;
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "y"
      ) {
        event.preventDefault();

        handleRedo();

        return;
      }

      if (
        event.key === "Delete" ||
        event.key === "Backspace"
      ) {
        handleDelete();
      }

      if (
        event.key.toLowerCase() ===
        "v"
      ) {
        setSelectedTool("select");
      }

      if (
        event.key.toLowerCase() ===
        "p"
      ) {
        setSelectedTool("pen");
      }

      if (
        event.key.toLowerCase() ===
        "r"
      ) {
        setSelectedTool("rectangle");
      }

      if (
        event.key.toLowerCase() ===
        "c"
      ) {
        setSelectedTool("circle");
      }

      if (
        event.key.toLowerCase() ===
        "l"
      ) {
        setSelectedTool("line");
      }

      if (
        event.key.toLowerCase() ===
        "a"
      ) {
        setSelectedTool("arrow");
      }

      if (
        event.key.toLowerCase() ===
        "t"
      ) {
        setSelectedTool("text");
      }

      if (
        event.key.toLowerCase() ===
        "e"
      ) {
        setSelectedTool("eraser");
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    elements,
    history,
    redoStack,
    selectedElementId,
  ]);

  // =========================================================
  // ZOOM
  // =========================================================

  const zoomIn = () => {
    setZoom((prev) =>
      Math.min(
        2,
        Number(
          (prev + 0.1).toFixed(2),
        ),
      ),
    );
  };

  const zoomOut = () => {
    setZoom((prev) =>
      Math.max(
        0.5,
        Number(
          (prev - 0.1).toFixed(2),
        ),
      ),
    );
  };

  const resetZoom = () => {
    setZoom(1);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* HEADER */}

     <RoomHeader
  slug={slug}
  isConnected={isConnected}
  roomUsersCount={roomUsers.length}
  roomUsers={roomUsers}
  isSaving={isSaving}
  onSave={saveDrawing}
/>

      {/* MAIN */}

      <div className="flex min-h-0 flex-1">
        {/* TOOLBAR */}

        <Toolbar
          selectedTool={selectedTool}
          setSelectedTool={
            setSelectedTool
          }
          strokeColor={strokeColor}
          setStrokeColor={
            setStrokeColor
          }
          fillColor={fillColor}
          setFillColor={
            setFillColor
          }
          strokeWidth={strokeWidth}
          setStrokeWidth={
            setStrokeWidth
          }
          fontSize={fontSize}
          setFontSize={setFontSize}
          historyLength={
            history.length
          }
          redoLength={
            redoStack.length
          }
          hasSelectedElement={
            selectedElementId !== null
          }
          hasElements={
            elements.length > 0
          }
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDelete={handleDelete}
          onClear={handleClear}
        />

        {/* CANVAS AREA */}

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* ZOOM CONTROLS */}

          <div className="flex items-center justify-center border-b bg-white p-3">
            <ZoomControls
              zoom={zoom}
              onZoomOut={zoomOut}
              onZoomIn={zoomIn}
              onReset={resetZoom}
            />
          </div>

          {/* CANVAS */}

          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="relative inline-block">
              <Canvas
                canvasRef={canvasRef}
                elements={elements}
                selectedElementId={
                  selectedElementId
                }
                zoom={zoom}
                onPointerDown={
                  handlePointerDown
                }
                onPointerMove={
                  handlePointerMove
                }
                onPointerUp={
                  handlePointerUp
                }
                onPointerCancel={
                  handlePointerCancel
                }
              />

              {Object.entries(remoteCursors).map(
                ([userId, cursor]) => {
                  const user =
                    roomUsers.find(
                      (roomUser) =>
                        roomUser.userId ===
                        userId,
                    );

                  return (
                    <div
                      key={userId}
                      className="pointer-events-none absolute z-30"
                      style={{
                        left: cursor.x,
                        top: cursor.y,
                      }}
                    >
                      <div className="relative">
                        <div
                          className="h-0 w-0"
                          style={{
                            borderTop:
                              "10px solid #111827",
                            borderRight:
                              "7px solid transparent",
                          }}
                        />

                        <div className="absolute left-2 top-2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow">
                          {user?.name ??
                            "User"}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* LOADING */}

          {isLoading && (
            <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 rounded-md bg-white px-4 py-2 text-sm shadow">
              Loading drawing...
            </div>
          )}
        </main>

        {/* CHAT */}

        <Chat
          chatMessages={
            chatMessages
          }
          chatInput={chatInput}
          setChatInput={
            setChatInput
          }
          isChatConnected={
            isChatConnected
          }
          onSendMessage={
            sendChatMessage
          }
        />
      </div>
    </div>
  );
}