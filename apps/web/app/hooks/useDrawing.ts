"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";

import type {
  DrawingElement,
  Point,
  Tool,
} from "../components/canvas/Canvas";

const HTTP_BACKEND_URL = "http://localhost:4000";

type TextEditorState = {
  x: number;
  y: number;
  value: string;
};

export function useDrawing(
  slug: string,
  skipDrawingBroadcastRef?: MutableRefObject<boolean>,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingElement[][]>([]);
  const [selectedElementId, setSelectedElementId] =
    useState<string | null>(null);

  const [selectedTool, setSelectedTool] =
    useState<Tool>("pen");

  const [strokeColor, setStrokeColor] =
    useState("#111827");

  const [fillColor, setFillColor] =
    useState("transparent");

  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(24);
  const [zoom, setZoom] = useState(1);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /*
   * Inline text editor.
   */
  const [textEditor, setTextEditor] =
    useState<TextEditorState | null>(null);

  const isDrawingRef = useRef(false);
  const currentElementIdRef =
    useRef<string | null>(null);

  const startPointRef =
    useRef<Point | null>(null);

  const movingElementRef =
    useRef<DrawingElement | null>(null);

  const moveOffsetRef =
    useRef<Point | null>(null);

  const getPoint = useCallback(
    (
      event: ReactPointerEvent<HTMLCanvasElement>,
    ): Point => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return { x: 0, y: 0 };
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
    },
    [zoom],
  );

  const saveHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev,
      elements,
    ]);

    setRedoStack([]);
  }, [elements]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const previousState =
      history[history.length - 1];

    if (!previousState) {
      return;
    }

    setHistory((prev) =>
      prev.slice(0, -1),
    );

    setRedoStack((prev) => [
      ...prev,
      elements,
    ]);

    setElements(previousState);
    setSelectedElementId(null);
  }, [elements, history]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextState =
      redoStack[redoStack.length - 1];

    if (!nextState) {
      return;
    }

    setRedoStack((prev) =>
      prev.slice(0, -1),
    );

    setHistory((prev) => [
      ...prev,
      elements,
    ]);

    setElements(nextState);
    setSelectedElementId(null);
  }, [elements, redoStack]);

  const isPointInsideElement = useCallback(
    (
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
        const radiusX = Math.abs(
          element.radiusX,
        );

        const radiusY = Math.abs(
          element.radiusY,
        );

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

        return (
          dx * dx + dy * dy <= 1
        );
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

        return (
          Math.hypot(
            point.x - closestX,
            point.y - closestY,
          ) <= 10
        );
      }

      if (element.type === "text") {
        const context =
          canvasRef.current?.getContext(
            "2d",
          );

        if (!context) return false;

        context.font = `${element.fontSize}px sans-serif`;

        const lines =
          element.text.split("\n");

        const width = Math.max(
          ...lines.map((line) =>
            context.measureText(line).width,
          ),
        );

        const lineHeight =
          element.fontSize * 1.2;

        const height =
          lines.length * lineHeight;

        return (
          point.x >= element.x &&
          point.x <= element.x + width &&
          point.y <= element.y &&
          point.y >=
            element.y -
              element.fontSize -
              (lines.length - 1) *
                lineHeight
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
    },
    [],
  );

  const findElementAtPoint =
    useCallback(
      (point: Point): DrawingElement | null => {
        for (
          let i = elements.length - 1;
          i >= 0;
          i--
        ) {
          const element =
            elements[i];

          if (
            element &&
            isPointInsideElement(
              point,
              element,
            )
          ) {
            return element;
          }
        }

        return null;
      },
      [elements, isPointInsideElement],
    );

  const createBaseElement =
    useCallback(
      (id: string, type: Tool) => ({
        id,
        type,
        strokeColor,
        strokeWidth,
        fillColor,
      }),
      [
        fillColor,
        strokeColor,
        strokeWidth,
      ],
    );

  /*
   * Finish the current inline text editor.
   */
  const finishTextEditing =
    useCallback(() => {
      if (!textEditor) {
        return;
      }

      const text =
        textEditor.value.trim();

      if (text) {
        saveHistory();

        const newElement: DrawingElement = {
          ...createBaseElement(
            crypto.randomUUID(),
            "text",
          ),
          type: "text",
          x: textEditor.x,
          y: textEditor.y,
          text,
          fontSize,
        };

        setElements((prev) => [
          ...prev,
          newElement,
        ]);
      }

      setTextEditor(null);
    }, [
      createBaseElement,
      fontSize,
      saveHistory,
      textEditor,
    ]);

  /*
   * Cancel the current text editor.
   */
  const cancelTextEditing =
    useCallback(() => {
      setTextEditor(null);
    }, []);

  /*
   * Handle keyboard input inside
   * the inline text editor.
   */
  const handleTextEditorKeyDown =
    useCallback(
      (
        event: React.KeyboardEvent<HTMLInputElement>,
      ) => {
        if (event.key === "Enter") {
          event.preventDefault();
          finishTextEditing();
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          cancelTextEditing();
        }
      },
      [
        cancelTextEditing,
        finishTextEditing,
      ],
    );

  const handlePointerDown =
    useCallback(
      (
        event: ReactPointerEvent<HTMLCanvasElement>,
      ) => {
        event.currentTarget.setPointerCapture(
          event.pointerId,
        );

        const point = getPoint(event);

        /*
         * Text tool
         */
        if (selectedTool === "text") {
          if (textEditor) {
            finishTextEditing();
          }

          setTextEditor({
            x: point.x,
            y: point.y,
            value: "",
          });

          return;
        }

        /*
         * If user switches to another tool
         * while text editing is active,
         * finish the current text.
         */
        if (textEditor) {
          finishTextEditing();
        }

        /*
         * Select tool
         */
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

          let offsetX = 0;
          let offsetY = 0;

          if (element.type === "pen") {
            const firstPoint =
              element.points[0];

            if (firstPoint) {
              offsetX =
                point.x - firstPoint.x;
              offsetY =
                point.y - firstPoint.y;
            }
          } else if (
            element.type === "text" ||
            element.type === "rectangle" ||
            element.type === "circle"
          ) {
            offsetX =
              point.x - element.x;
            offsetY =
              point.y - element.y;
          } else if (
            element.type === "line" ||
            element.type === "arrow"
          ) {
            offsetX =
              point.x - element.start.x;
            offsetY =
              point.y - element.start.y;
          }

          moveOffsetRef.current = {
            x: offsetX,
            y: offsetY,
          };

          isDrawingRef.current =
            true;

          return;
        }

        /*
         * Eraser
         */
        if (selectedTool === "eraser") {
          const element =
            findElementAtPoint(point);

          if (!element) return;

          saveHistory();

          setElements((prev) =>
            prev.filter(
              (item) =>
                item.id !== element.id,
            ),
          );

          return;
        }

        /*
         * Drawing tools
         */
        if (
          [
            "pen",
            "rectangle",
            "circle",
            "line",
            "arrow",
          ].includes(selectedTool)
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

          let newElement: DrawingElement;

          if (selectedTool === "pen") {
            newElement = {
              ...createBaseElement(
                id,
                "pen",
              ),
              type: "pen",
              points: [point],
            };
          } else if (
            selectedTool === "rectangle"
          ) {
            newElement = {
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
          } else if (
            selectedTool === "circle"
          ) {
            newElement = {
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
          } else if (
            selectedTool === "line"
          ) {
            newElement = {
              ...createBaseElement(
                id,
                "line",
              ),
              type: "line",
              start: point,
              end: point,
            };
          } else {
            newElement = {
              ...createBaseElement(
                id,
                "arrow",
              ),
              type: "arrow",
              start: point,
              end: point,
            };
          }

          setElements((prev) => [
            ...prev,
            newElement,
          ]);
        }
      },
      [
        createBaseElement,
        findElementAtPoint,
        finishTextEditing,
        fontSize,
        getPoint,
        saveHistory,
        selectedTool,
        textEditor,
      ],
    );

  const handlePointerMove =
    useCallback(
      (
        event: ReactPointerEvent<HTMLCanvasElement>,
      ) => {
        const point = getPoint(event);

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

              /*
               * Move pen
               */
              if (
                item.type === "pen"
              ) {
                const originalFirst =
                  item.points[0];

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
                    item.points.map(
                      (p) => ({
                        x:
                          p.x + deltaX,
                        y:
                          p.y + deltaY,
                      }),
                    ),
                };
              }

              /*
               * Move rectangle,
               * circle, or text
               */
              if (
                item.type ===
                  "rectangle" ||
                item.type ===
                  "circle" ||
                item.type === "text"
              ) {
                return {
                  ...item,
                  x: dx,
                  y: dy,
                };
              }

              /*
               * Move line or arrow
               */
              if (
                item.type === "line" ||
                item.type === "arrow"
              ) {
                const originalStart =
                  item.start;

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
                      item.start.x +
                      deltaX,
                    y:
                      item.start.y +
                      deltaY,
                  },
                  end: {
                    x:
                      item.end.x +
                      deltaX,
                    y:
                      item.end.y +
                      deltaY,
                  },
                };
              }

              return item;
            }),
          );

          return;
        }

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

            if (
              element.type === "pen"
            ) {
              return {
                ...element,
                points: [
                  ...element.points,
                  point,
                ],
              };
            }

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

            if (
              element.type === "line" ||
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
      },
      [getPoint, selectedTool],
    );

  const resetPointerState =
    useCallback(() => {
      isDrawingRef.current = false;
      currentElementIdRef.current = null;
      startPointRef.current = null;
      movingElementRef.current = null;
      moveOffsetRef.current = null;
    }, []);

  const handlePointerUp =
    useCallback(
      (
        event: ReactPointerEvent<HTMLCanvasElement>,
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

        resetPointerState();
      },
      [resetPointerState],
    );

  const handlePointerCancel =
    useCallback(
      (
        event: ReactPointerEvent<HTMLCanvasElement>,
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

        resetPointerState();
      },
      [resetPointerState],
    );

  const handleDelete = useCallback(() => {
    if (!selectedElementId) return;

    saveHistory();

    setElements((prev) =>
      prev.filter(
        (element) =>
          element.id !==
          selectedElementId,
      ),
    );

    setSelectedElementId(null);
  }, [
    saveHistory,
    selectedElementId,
  ]);

  const handleClear = useCallback(() => {
    if (elements.length === 0) return;

    const confirmed = window.confirm(
      "Are you sure you want to clear the canvas?",
    );

    if (!confirmed) return;

    saveHistory();
    setElements([]);
    setSelectedElementId(null);
  }, [
    elements.length,
    saveHistory,
  ]);

  const saveDrawing =
    useCallback(async () => {
      if (!slug) return;

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

        const response = await fetch(
          `${HTTP_BACKEND_URL}/drawing/${slug}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              elements,
            }),
          },
        );

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            `Failed to save drawing: ${response.status} ${errorText}`,
          );
        }

        await response.json();
      } catch (error) {
        console.error(
          "❌ Save drawing error:",
          error,
        );
      } finally {
        setIsSaving(false);
      }
    }, [elements, slug]);

  const loadDrawing =
    useCallback(async () => {
      if (!slug) return;

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

        const response = await fetch(
          `${HTTP_BACKEND_URL}/drawing/${slug}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
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

        const drawingData =
          data?.drawing?.data;

        const loadedElements =
          Array.isArray(
            drawingData?.elements,
          )
            ? drawingData.elements
            : [];

        if (skipDrawingBroadcastRef) {
          skipDrawingBroadcastRef.current =
            true;
        }

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
    }, [
      slug,
      skipDrawingBroadcastRef,
    ]);

  useEffect(() => {
    loadDrawing();
  }, [loadDrawing]);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(
      () => saveDrawing(),
      1000,
    );

    return () =>
      clearTimeout(timer);
  }, [
    elements,
    isLoading,
    saveDrawing,
  ]);

  const zoomIn = useCallback(() => {
    setZoom((prev) =>
      Math.min(
        2,
        Number(
          (prev + 0.1).toFixed(2),
        ),
      ),
    );
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) =>
      Math.max(
        0.5,
        Number(
          (prev - 0.1).toFixed(2),
        ),
      ),
    );
  }, []);

  const resetZoom = useCallback(
    () => setZoom(1),
    [],
  );

  return {
    canvasRef,

    elements,
    setElements,

    history,
    redoStack,

    selectedElementId,
    selectedTool,
    setSelectedTool,

    strokeColor,
    setStrokeColor,

    fillColor,
    setFillColor,

    strokeWidth,
    setStrokeWidth,

    fontSize,
    setFontSize,

    zoom,

    isSaving,
    isLoading,

    /*
     * Text editor
     */
    textEditor,
    setTextEditor,
    finishTextEditing,
    cancelTextEditing,
    handleTextEditorKeyDown,

    handleUndo,
    handleRedo,

    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,

    handleDelete,
    handleClear,

    saveDrawing,

    zoomIn,
    zoomOut,
    resetZoom,
  };
}