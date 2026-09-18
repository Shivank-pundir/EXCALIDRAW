"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

/* ----------------------------- CONFIG ----------------------------- */

const HTTP_BACKEND_URL = "http://localhost:4000";
const WS_BACKEND_URL = "ws://localhost:8080";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;

/* ----------------------------- TYPES ----------------------------- */

type Point = {
  x: number;
  y: number;
};

type Tool =
  | "select"
  | "pen"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "text"
  | "eraser";

type BaseElement = {
  id: string;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
};

type PenElement = BaseElement & {
  type: "pen";
  points: Point[];
};

type RectangleElement = BaseElement & {
  type: "rectangle";
  startX: number;
  startY: number;
  width: number;
  height: number;
};

type CircleElement = BaseElement & {
  type: "circle";
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
};

type LineElement = BaseElement & {
  type: "line";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

type ArrowElement = BaseElement & {
  type: "arrow";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

type TextElement = BaseElement & {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
};

type DrawingElement =
  | PenElement
  | RectangleElement
  | CircleElement
  | LineElement
  | ArrowElement
  | TextElement;

type ChatMessage = {
  id?: number;
  chatId?: number;
  message: string;
  userId: string;
};

/* ----------------------------- HELPERS ----------------------------- */

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cloneElements(elements: DrawingElement[]): DrawingElement[] {
  return structuredClone(elements);
}

function distanceBetweenPoints(first: Point, second: Point): number {
  return Math.sqrt(
    Math.pow(first.x - second.x, 2) +
      Math.pow(first.y - second.y, 2),
  );
}

/* ----------------------------- COMPONENT ----------------------------- */

export default function RoomPage() {
  const params = useParams();
  const slug = params.slug as string;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
const chatBottomRef = useRef<HTMLDivElement | null>(null);
const hasJoinedRoomRef = useRef(false);

// Prevent drawing received from another user from being sent back
const skipDrawingBroadcastRef = useRef(false);

  

  const [selectedTool, setSelectedTool] =
    useState<Tool>("select");

  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingElement[][]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [selectedElementId, setSelectedElementId] =
    useState<string | null>(null);

  const [dragOffset, setDragOffset] = useState<Point | null>(null);
  const [isMovingElement, setIsMovingElement] = useState(false);

  const [strokeColor, setStrokeColor] = useState("#111827");
  const [fillColor, setFillColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(24);

  const [zoom, setZoom] = useState(1);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatConnected, setIsChatConnected] = useState(false);

  /* ----------------------------- CANVAS POINT ----------------------------- */

  const getPoint = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return { x: 0, y: 0 };
      }

      const rect = canvas.getBoundingClientRect();

      return {
        x:
          ((event.clientX - rect.left) / rect.width) *
          CANVAS_WIDTH /
          zoom,
        y:
          ((event.clientY - rect.top) / rect.height) *
          CANVAS_HEIGHT /
          zoom,
      };
    },
    [zoom],
  );

  /* ----------------------------- HISTORY ----------------------------- */

  const saveHistory = useCallback(() => {
    setHistory((previousHistory) => [
      ...previousHistory,
      cloneElements(elements),
    ]);

    setRedoStack([]);
  }, [elements]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const previousElements = history[history.length - 1];

    setRedoStack((previousRedoStack) => [
      ...previousRedoStack,
      cloneElements(elements),
    ]);

    setElements(cloneElements(previousElements));

    setHistory((previousHistory) =>
      previousHistory.slice(0, -1),
    );

    setSelectedElementId(null);
  }, [elements, history]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextElements = redoStack[redoStack.length - 1];

    setHistory((previousHistory) => [
      ...previousHistory,
      cloneElements(elements),
    ]);

    setElements(cloneElements(nextElements));

    setRedoStack((previousRedoStack) =>
      previousRedoStack.slice(0, -1),
    );

    setSelectedElementId(null);
  }, [elements, redoStack]);

  /* ----------------------------- HIT TESTING ----------------------------- */

  const isPointInsideElement = useCallback(
    (point: Point, element: DrawingElement): boolean => {
      if (element.type === "rectangle") {
        const left = Math.min(
          element.startX,
          element.startX + element.width,
        );

        const right = Math.max(
          element.startX,
          element.startX + element.width,
        );

        const top = Math.min(
          element.startY,
          element.startY + element.height,
        );

        const bottom = Math.max(
          element.startY,
          element.startY + element.height,
        );

        return (
          point.x >= left - 12 &&
          point.x <= right + 12 &&
          point.y >= top - 12 &&
          point.y <= bottom + 12
        );
      }

      if (element.type === "circle") {
        const distanceX = point.x - element.centerX;
        const distanceY = point.y - element.centerY;

        const normalizedX =
          element.radiusX === 0
            ? 999
            : distanceX / element.radiusX;

        const normalizedY =
          element.radiusY === 0
            ? 999
            : distanceY / element.radiusY;

        return (
          normalizedX * normalizedX +
            normalizedY * normalizedY <=
          1.3
        );
      }

      if (
        element.type === "line" ||
        element.type === "arrow"
      ) {
        const start = {
          x: element.startX,
          y: element.startY,
        };

        const end = {
          x: element.endX,
          y: element.endY,
        };

        const lineLength = distanceBetweenPoints(start, end);

        if (lineLength === 0) return false;

        const distanceToStart = distanceBetweenPoints(
          point,
          start,
        );

        const distanceToEnd = distanceBetweenPoints(
          point,
          end,
        );

        return (
          distanceToStart + distanceToEnd <=
          lineLength + 20
        );
      }

      if (element.type === "text") {
        return (
          point.x >= element.x - 10 &&
          point.x <=
            element.x + element.text.length * element.fontSize * 0.6 &&
          point.y >= element.y - element.fontSize &&
          point.y <= element.y + 10
        );
      }

      if (element.type === "pen") {
        return element.points.some(
          (linePoint) =>
            distanceBetweenPoints(point, linePoint) <= 14,
        );
      }

      return false;
    },
    [],
  );

  const getElementAtPoint = useCallback(
    (point: Point): DrawingElement | null => {
      for (let index = elements.length - 1; index >= 0; index--) {
        const element = elements[index];

        if (element && isPointInsideElement(point, element)) {
          return element;
        }
      }

      return null;
    },
    [elements, isPointInsideElement],
  );

  /* ----------------------------- SELECT/MOVE ----------------------------- */

  const startSelecting = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const point = getPoint(event);
    const clickedElement = getElementAtPoint(point);

    if (!clickedElement) {
      setSelectedElementId(null);
      return;
    }

    saveHistory();

    setSelectedElementId(clickedElement.id);
    setIsMovingElement(true);
    setIsDrawing(true);

    if (
      clickedElement.type === "rectangle" ||
      clickedElement.type === "circle"
    ) {
      setDragOffset({
        x:
          point.x -
          (clickedElement.type === "rectangle"
            ? clickedElement.startX
            : clickedElement.centerX),
        y:
          point.y -
          (clickedElement.type === "rectangle"
            ? clickedElement.startY
            : clickedElement.centerY),
      });
    }

    if (
      clickedElement.type === "line" ||
      clickedElement.type === "arrow"
    ) {
      setDragOffset({
        x: point.x - clickedElement.startX,
        y: point.y - clickedElement.startY,
      });
    }

    if (clickedElement.type === "text") {
      setDragOffset({
        x: point.x - clickedElement.x,
        y: point.y - clickedElement.y,
      });
    }

    if (clickedElement.type === "pen") {
      const firstPoint = clickedElement.points[0];

      if (firstPoint) {
        setDragOffset({
          x: point.x - firstPoint.x,
          y: point.y - firstPoint.y,
        });
      }
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  /* ----------------------------- START DRAWING ----------------------------- */

  const startPenDrawing = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const point = getPoint(event);

    saveHistory();

    setIsDrawing(true);
    setStartPoint(point);

    setElements((previousElements) => [
      ...previousElements,
      {
        id: createId(),
        type: "pen",
        points: [point],
        strokeColor,
        fillColor,
        strokeWidth,
      },
    ]);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startRectangle = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const point = getPoint(event);

    saveHistory();

    setIsDrawing(true);
    setStartPoint(point);

    setElements((previousElements) => [
      ...previousElements,
      {
        id: createId(),
        type: "rectangle",
        startX: point.x,
        startY: point.y,
        width: 0,
        height: 0,
        strokeColor,
        fillColor,
        strokeWidth,
      },
    ]);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startCircle = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const point = getPoint(event);

    saveHistory();

    setIsDrawing(true);
    setStartPoint(point);

    setElements((previousElements) => [
      ...previousElements,
      {
        id: createId(),
        type: "circle",
        centerX: point.x,
        centerY: point.y,
        radiusX: 0,
        radiusY: 0,
        strokeColor,
        fillColor,
        strokeWidth,
      },
    ]);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startLine = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const point = getPoint(event);

    saveHistory();

    setIsDrawing(true);
    setStartPoint(point);

    setElements((previousElements) => [
      ...previousElements,
      {
        id: createId(),
        type: "line",
        startX: point.x,
        startY: point.y,
        endX: point.x,
        endY: point.y,
        strokeColor,
        fillColor,
        strokeWidth,
      },
    ]);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startArrow = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const point = getPoint(event);

    saveHistory();

    setIsDrawing(true);
    setStartPoint(point);

    setElements((previousElements) => [
      ...previousElements,
      {
        id: createId(),
        type: "arrow",
        startX: point.x,
        startY: point.y,
        endX: point.x,
        endY: point.y,
        strokeColor,
        fillColor,
        strokeWidth,
      },
    ]);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startText = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const point = getPoint(event);
    const text = window.prompt("Enter text:");

    if (!text?.trim()) return;

    saveHistory();

    setElements((previousElements) => [
      ...previousElements,
      {
        id: createId(),
        type: "text",
        x: point.x,
        y: point.y,
        text: text.trim(),
        fontSize,
        strokeColor,
        fillColor,
        strokeWidth,
      },
    ]);
  };

  /* ----------------------------- POINTER EVENTS ----------------------------- */

  const handlePointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (selectedTool === "select") {
      startSelecting(event);
    }

    if (selectedTool === "pen") {
      startPenDrawing(event);
    }

    if (selectedTool === "rectangle") {
      startRectangle(event);
    }

    if (selectedTool === "circle") {
      startCircle(event);
    }

    if (selectedTool === "line") {
      startLine(event);
    }

    if (selectedTool === "arrow") {
      startArrow(event);
    }

    if (selectedTool === "text") {
      startText(event);
    }

    if (selectedTool === "eraser") {
      const point = getPoint(event);
      const clickedElement = getElementAtPoint(point);

      if (clickedElement) {
        saveHistory();

        setElements((previousElements) =>
          previousElements.filter(
            (element) => element.id !== clickedElement.id,
          ),
        );
      }
    }
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing) return;

    const point = getPoint(event);

    if (
      selectedTool === "select" &&
      isMovingElement &&
      selectedElementId &&
      dragOffset
    ) {
      setElements((previousElements) =>
        previousElements.map((element) => {
          if (element.id !== selectedElementId) {
            return element;
          }

          if (element.type === "rectangle") {
            return {
              ...element,
              startX: point.x - dragOffset.x,
              startY: point.y - dragOffset.y,
            };
          }

          if (element.type === "circle") {
            return {
              ...element,
              centerX: point.x - dragOffset.x,
              centerY: point.y - dragOffset.y,
            };
          }

          if (
            element.type === "line" ||
            element.type === "arrow"
          ) {
            const deltaX =
              point.x - dragOffset.x - element.startX;

            const deltaY =
              point.y - dragOffset.y - element.startY;

            return {
              ...element,
              startX: element.startX + deltaX,
              startY: element.startY + deltaY,
              endX: element.endX + deltaX,
              endY: element.endY + deltaY,
            };
          }

          if (element.type === "text") {
            return {
              ...element,
              x: point.x - dragOffset.x,
              y: point.y - dragOffset.y,
            };
          }

          if (element.type === "pen") {
            const firstPoint = element.points[0];

            if (!firstPoint) return element;

            const moveX =
              point.x - dragOffset.x - firstPoint.x;

            const moveY =
              point.y - dragOffset.y - firstPoint.y;

            return {
              ...element,
              points: element.points.map((linePoint) => ({
                x: linePoint.x + moveX,
                y: linePoint.y + moveY,
              })),
            };
          }

          return element;
        }),
      );

      return;
    }

    setElements((previousElements) => {
      if (previousElements.length === 0) {
        return previousElements;
      }

      const updatedElements = [...previousElements];
      const lastElement =
        updatedElements[updatedElements.length - 1];

      if (!lastElement) {
        return previousElements;
      }

      if (
        selectedTool === "pen" &&
        lastElement.type === "pen"
      ) {
        updatedElements[updatedElements.length - 1] = {
          ...lastElement,
          points: [...lastElement.points, point],
        };
      }

      if (
        selectedTool === "rectangle" &&
        lastElement.type === "rectangle" &&
        startPoint
      ) {
        updatedElements[updatedElements.length - 1] = {
          ...lastElement,
          width: point.x - startPoint.x,
          height: point.y - startPoint.y,
        };
      }

      if (
        selectedTool === "circle" &&
        lastElement.type === "circle" &&
        startPoint
      ) {
        updatedElements[updatedElements.length - 1] = {
          ...lastElement,
          radiusX: Math.abs(point.x - startPoint.x),
          radiusY: Math.abs(point.y - startPoint.y),
        };
      }

      if (
        selectedTool === "line" &&
        lastElement.type === "line"
      ) {
        updatedElements[updatedElements.length - 1] = {
          ...lastElement,
          endX: point.x,
          endY: point.y,
        };
      }

      if (
        selectedTool === "arrow" &&
        lastElement.type === "arrow"
      ) {
        updatedElements[updatedElements.length - 1] = {
          ...lastElement,
          endX: point.x,
          endY: point.y,
        };
      }

      return updatedElements;
    });
  };

  const stopDrawing = (
    event?: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    setIsDrawing(false);
    setStartPoint(null);
    setIsMovingElement(false);
    setDragOffset(null);

    if (
      event &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  /* ----------------------------- DELETE/CLEAR ----------------------------- */

  const handleDeleteSelected = useCallback(() => {
    if (!selectedElementId) return;

    saveHistory();

    setElements((previousElements) =>
      previousElements.filter(
        (element) => element.id !== selectedElementId,
      ),
    );

    setSelectedElementId(null);
  }, [saveHistory, selectedElementId]);

  const handleClearCanvas = () => {
    if (elements.length === 0) return;

    saveHistory();
    setElements([]);
    setSelectedElementId(null);
  };

  /* ----------------------------- SAVE DRAWING ----------------------------- */

  const saveDrawing = useCallback(
    async (showMessage = true) => {
      const token = localStorage.getItem("token");

      if (!token) {
        setSaveMessage("Token not found");
        return;
      }

      try {
        setIsSaving(true);

        const response = await fetch(
          `${HTTP_BACKEND_URL}/drawing/${encodeURIComponent(slug)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              elements,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to save drawing",
          );
        }

        if (showMessage) {
          setSaveMessage("Drawing saved successfully");

          window.setTimeout(() => {
            setSaveMessage("");
          }, 2500);
        }
      } catch (error) {
        console.error("SAVE DRAWING ERROR:", error);
        setSaveMessage("Failed to save drawing");
      } finally {
        setIsSaving(false);
      }
    },
    [elements, slug],
  );

  /* ----------------------------- LOAD DRAWING ----------------------------- */

  useEffect(() => {
    const loadDrawing = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${HTTP_BACKEND_URL}/drawing/${encodeURIComponent(slug)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load drawing",
          );
        }

        const savedElements = data.drawing?.data?.elements;

       if (Array.isArray(savedElements)) {
  // This drawing came from Neon, so don't broadcast it
  skipDrawingBroadcastRef.current = true;
  setElements(savedElements);
}
      } catch (error) {
        console.error("LOAD DRAWING ERROR:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDrawing();
  }, [slug]);

  /* ----------------------------- AUTO SAVE ----------------------------- */

  useEffect(() => {
    if (isLoading) return;

    const timeout = window.setTimeout(() => {
      saveDrawing(false);
    }, 1200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [elements, isLoading, saveDrawing]);

  /* ----------------------------- WEBSOCKET ----------------------------- */

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const socket = new WebSocket(
      `${WS_BACKEND_URL}?token=${encodeURIComponent(token)}`,
    );

    wsRef.current = socket;

   socket.onopen = () => {
  setIsChatConnected(true);

  hasJoinedRoomRef.current = false;

  socket.send(
    JSON.stringify({
      type: "join_room",
      roomId: slug,
    }),
  );

  socket.send(
    JSON.stringify({
      type: "get_chats",
      roomId: slug,
    }),
  );
};

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "room_joined") {
  if (data.roomId === slug) {
    hasJoinedRoomRef.current = true;
  }
}

        if (data.type === "room_chats") {
          setChatMessages(data.messages ?? []);
        }

        if (data.type === "chat") {
          setChatMessages((previousMessages) => [
            ...previousMessages,
            {
              id: data.chatId,
              chatId: data.chatId,
              message: data.message,
              userId: data.userId,
            },
          ]);
        }
        if (data.type === "drawing") {
  if (data.roomId === slug && Array.isArray(data.elements)) {
    // Drawing came from another user
    skipDrawingBroadcastRef.current = true;

    setElements(data.elements);
  }
}

        if (data.type === "error") {
          console.error("WebSocket error:", data.message);
        }
      } catch (error) {
        console.error("Invalid WebSocket response:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket connection error:", error);
      setIsChatConnected(false);
    };

    socket.onclose = () => {
      setIsChatConnected(false);
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [slug]);

  /* ----------------------------- CHAT ----------------------------- */

  const sendChatMessage = () => {
    const cleanMessage = chatInput.trim();

    if (!cleanMessage) return;

    const socket = wsRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "chat",
        roomId: slug,
        message: cleanMessage,
      }),
    );

    setChatInput("");
    chatInputRef.current?.focus();
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatMessages]);

  /* ----------------------------- KEYBOARD SHORTCUTS ----------------------------- */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA";

      if (
        !isTyping &&
        (event.key === "Delete" ||
          event.key === "Backspace")
      ) {
        handleDeleteSelected();
      }

      if (
        !isTyping &&
        event.ctrlKey &&
        event.key.toLowerCase() === "z"
      ) {
        event.preventDefault();
        handleUndo();
      }

      if (
        !isTyping &&
        event.ctrlKey &&
        event.key.toLowerCase() === "y"
      ) {
        event.preventDefault();
        handleRedo();
      }

      if (
        !isTyping &&
        event.ctrlKey &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        saveDrawing();
      }

      if (!isTyping) {
        if (event.key.toLowerCase() === "v") {
          setSelectedTool("select");
        }

        if (event.key.toLowerCase() === "p") {
          setSelectedTool("pen");
        }

        if (event.key.toLowerCase() === "r") {
          setSelectedTool("rectangle");
        }

        if (event.key.toLowerCase() === "c") {
          setSelectedTool("circle");
        }

        if (event.key.toLowerCase() === "l") {
          setSelectedTool("line");
        }

        if (event.key.toLowerCase() === "a") {
          setSelectedTool("arrow");
        }

        if (event.key.toLowerCase() === "t") {
          setSelectedTool("text");
        }

        if (event.key === "Escape") {
          setSelectedElementId(null);
          setSelectedTool("select");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleDeleteSelected,
    handleRedo,
    handleUndo,
    saveDrawing,
  ]);
  /* ----------------------------- REALTIME DRAWING ----------------------------- */

useEffect(() => {
  if (isLoading) return;

  const socket = wsRef.current;

  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    return;
  }

  // Don't send drawing back if it came from another user
  if (skipDrawingBroadcastRef.current) {
    skipDrawingBroadcastRef.current = false;
    return;
  }

  socket.send(
    JSON.stringify({
      type: "drawing",
      roomId: slug,
      elements,
    }),
  );
}, [elements, isLoading, slug]);

  /* ----------------------------- DRAW CANVAS ----------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.clearRect(
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
    );

    context.save();
    context.scale(zoom, zoom);

    context.lineCap = "round";
    context.lineJoin = "round";

    elements.forEach((element) => {
      const isSelected =
        element.id === selectedElementId;

      context.strokeStyle = isSelected
        ? "#2563eb"
        : element.strokeColor;

      context.fillStyle =
        element.fillColor === "transparent"
          ? "transparent"
          : element.fillColor;

      context.lineWidth = isSelected
        ? element.strokeWidth + 2
        : element.strokeWidth;

      if (element.type === "pen") {
        if (element.points.length === 0) return;

        const firstPoint = element.points[0];

        if (!firstPoint) return;

        context.beginPath();
        context.moveTo(firstPoint.x, firstPoint.y);

        element.points.forEach((point) => {
          context.lineTo(point.x, point.y);
        });

        context.stroke();
      }

      if (element.type === "rectangle") {
        if (element.fillColor !== "transparent") {
          context.fillRect(
            element.startX,
            element.startY,
            element.width,
            element.height,
          );
        }

        context.strokeRect(
          element.startX,
          element.startY,
          element.width,
          element.height,
        );
      }

      if (element.type === "circle") {
        context.beginPath();

        context.ellipse(
          element.centerX,
          element.centerY,
          element.radiusX,
          element.radiusY,
          0,
          0,
          Math.PI * 2,
        );

        if (element.fillColor !== "transparent") {
          context.fill();
        }

        context.stroke();
      }

      if (
        element.type === "line" ||
        element.type === "arrow"
      ) {
        context.beginPath();

        context.moveTo(element.startX, element.startY);
        context.lineTo(element.endX, element.endY);
        context.stroke();

        if (element.type === "arrow") {
          const angle = Math.atan2(
            element.endY - element.startY,
            element.endX - element.startX,
          );

          const arrowLength = 18;

          context.beginPath();

          context.moveTo(element.endX, element.endY);

          context.lineTo(
            element.endX -
              arrowLength * Math.cos(angle - Math.PI / 6),
            element.endY -
              arrowLength * Math.sin(angle - Math.PI / 6),
          );

          context.moveTo(element.endX, element.endY);

          context.lineTo(
            element.endX -
              arrowLength * Math.cos(angle + Math.PI / 6),
            element.endY -
              arrowLength * Math.sin(angle + Math.PI / 6),
          );

          context.stroke();
        }
      }

      if (element.type === "text") {
        context.font = `${element.fontSize}px sans-serif`;
        context.fillStyle = isSelected
          ? "#2563eb"
          : element.strokeColor;

        context.fillText(
          element.text,
          element.x,
          element.y,
        );
      }
    });

    context.restore();
  }, [elements, selectedElementId, zoom]);

  /* ----------------------------- TOOL BUTTON ----------------------------- */

  const toolButtonClass = (tool: Tool) =>
    `w-full rounded-md px-2 py-2 text-sm font-medium transition ${
      selectedTool === tool
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      {/* NAVBAR */}

      <nav className="flex flex-wrap items-center justify-between gap-3 bg-gray-900 px-5 py-4 text-white">
        <h1 className="text-xl font-bold">
          Excalidraw Clone
        </h1>

        <div className="flex items-center gap-4 text-sm">
          <span>
            Room:{" "}
            <strong className="text-blue-300">
              {slug}
            </strong>
          </span>

          <span
            className={
              isChatConnected
                ? "text-green-300"
                : "text-red-300"
            }
          >
            {isChatConnected
              ? "● Connected"
              : "● Disconnected"}
          </span>

          <button
            onClick={() => saveDrawing()}
            disabled={isSaving}
            className="rounded-md bg-green-600 px-4 py-2 font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* TOOLBAR */}

        <aside className="flex w-32 shrink-0 flex-col gap-2 border-r bg-white p-3">
          <button
            onClick={() => setSelectedTool("select")}
            className={toolButtonClass("select")}
          >
            🖱 Select
          </button>

          <button
            onClick={() => setSelectedTool("pen")}
            className={toolButtonClass("pen")}
          >
            ✏️ Pen
          </button>

          <button
            onClick={() => setSelectedTool("rectangle")}
            className={toolButtonClass("rectangle")}
          >
            ▭ Rect
          </button>

          <button
            onClick={() => setSelectedTool("circle")}
            className={toolButtonClass("circle")}
          >
            ◯ Circle
          </button>

          <button
            onClick={() => setSelectedTool("line")}
            className={toolButtonClass("line")}
          >
            ╱ Line
          </button>

          <button
            onClick={() => setSelectedTool("arrow")}
            className={toolButtonClass("arrow")}
          >
            ➜ Arrow
          </button>

          <button
            onClick={() => setSelectedTool("text")}
            className={toolButtonClass("text")}
          >
            T Text
          </button>

          <button
            onClick={() => setSelectedTool("eraser")}
            className={toolButtonClass("eraser")}
          >
            🧹 Eraser
          </button>

          <div className="my-2 h-px bg-gray-200" />

          {/* COLORS */}

          <label className="text-xs font-semibold text-gray-600">
            Stroke
          </label>

          <input
            type="color"
            value={strokeColor}
            onChange={(event) =>
              setStrokeColor(event.target.value)
            }
            className="h-9 w-full cursor-pointer"
          />

          <label className="text-xs font-semibold text-gray-600">
            Fill
          </label>

          <select
            value={fillColor}
            onChange={(event) =>
              setFillColor(event.target.value)
            }
            className="w-full rounded border px-1 py-2 text-xs"
          >
            <option value="transparent">None</option>
            <option value="#fecaca">Red</option>
            <option value="#fed7aa">Orange</option>
            <option value="#fef08a">Yellow</option>
            <option value="#bbf7d0">Green</option>
            <option value="#bfdbfe">Blue</option>
            <option value="#e9d5ff">Purple</option>
            <option value="#e5e7eb">Gray</option>
          </select>

          <label className="text-xs font-semibold text-gray-600">
            Stroke width
          </label>

          <select
            value={strokeWidth}
            onChange={(event) =>
              setStrokeWidth(Number(event.target.value))
            }
            className="w-full rounded border px-1 py-2 text-xs"
          >
            <option value={1}>1 px</option>
            <option value={2}>2 px</option>
            <option value={3}>3 px</option>
            <option value={5}>5 px</option>
            <option value={8}>8 px</option>
          </select>

          <label className="text-xs font-semibold text-gray-600">
            Text size
          </label>

          <select
            value={fontSize}
            onChange={(event) =>
              setFontSize(Number(event.target.value))
            }
            className="w-full rounded border px-1 py-2 text-xs"
          >
            <option value={16}>16 px</option>
            <option value={20}>20 px</option>
            <option value={24}>24 px</option>
            <option value={32}>32 px</option>
            <option value={40}>40 px</option>
          </select>

          <div className="my-2 h-px bg-gray-200" />

          {/* HISTORY */}

          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="w-full rounded-md bg-gray-800 px-2 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-40"
          >
            ↶ Undo
          </button>

          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="w-full rounded-md bg-gray-800 px-2 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-40"
          >
            ↷ Redo
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={!selectedElementId}
            className="w-full rounded-md bg-orange-600 px-2 py-2 text-sm text-white hover:bg-orange-700 disabled:opacity-40"
          >
            Delete
          </button>

          <button
            onClick={handleClearCanvas}
            disabled={elements.length === 0}
            className="w-full rounded-md bg-red-600 px-2 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-40"
          >
            Clear
          </button>
        </aside>

        {/* CANVAS AREA */}

        <main className="flex min-w-0 flex-1 flex-col items-center gap-3 p-4">
          <div className="flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 rounded-md border bg-white p-3 shadow-sm">
            <div className="text-sm text-gray-600">
              Tool:{" "}
              <strong className="capitalize">
                {selectedTool}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setZoom((previousZoom) =>
                    Math.max(0.5, previousZoom - 0.1),
                  )
                }
                className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
              >
                −
              </button>

              <span className="min-w-16 text-center text-sm">
                {Math.round(zoom * 100)}%
              </span>

              <button
                onClick={() =>
                  setZoom((previousZoom) =>
                    Math.min(2, previousZoom + 0.1),
                  )
                }
                className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
              >
                +
              </button>

              <button
                onClick={() => setZoom(1)}
                className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
              >
                Reset
              </button>
            </div>

            {saveMessage && (
              <span className="text-sm text-green-600">
                {saveMessage}
              </span>
            )}
          </div>

          <div className="w-full max-w-6xl overflow-auto rounded-lg border bg-white p-3 shadow">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              className="block min-w-[700px] touch-none rounded border border-gray-300 bg-white"
              style={{
                width: `${CANVAS_WIDTH * zoom}px`,
                height: `${CANVAS_HEIGHT * zoom}px`,
              }}
            />
          </div>

          <p className="text-xs text-gray-500">
            Shortcuts: V Select, P Pen, R Rectangle, C Circle,
            L Line, A Arrow, T Text, Ctrl+S Save, Ctrl+Z Undo,
            Ctrl+Y Redo
          </p>
        </main>

        {/* CHAT SIDEBAR */}

        <aside className="hidden w-80 shrink-0 flex-col border-l bg-white p-4 lg:flex">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Room Chat
            </h2>

            <span
              className={`text-xs ${
                isChatConnected
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {isChatConnected ? "Online" : "Offline"}
            </span>
          </div>

          <div className="flex h-[500px] flex-1 flex-col overflow-y-auto rounded-md bg-gray-100 p-3">
            {chatMessages.length === 0 ? (
              <p className="text-sm text-gray-500">
                No messages yet.
              </p>
            ) : (
              chatMessages.map((chat, index) => (
                <div
                  key={`${chat.id ?? chat.chatId ?? "message"}-${index}`}
                  className="mb-3 rounded-md bg-white p-3 shadow-sm"
                >
                  <p className="break-words text-sm text-gray-800">
                    {chat.message}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {chat.userId}
                  </p>
                </div>
              ))
            )}

            <div ref={chatBottomRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <input
              ref={chatInputRef}
              value={chatInput}
              onChange={(event) =>
                setChatInput(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendChatMessage();
                }
              }}
              placeholder="Write a message..."
              className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500"
            />

            <button
              onClick={sendChatMessage}
              disabled={
                !isChatConnected || !chatInput.trim()
              }
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}