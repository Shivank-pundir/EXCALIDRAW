
"use client";

import {
  useEffect,
  useState,
  type RefObject,
} from "react";

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 700;

const CANVAS_BOTTOM_PADDING = 300;
const CANVAS_EXPAND_THRESHOLD = 150;
const CANVAS_EXPAND_STEP = 500;

export type Point = {
  x: number;
  y: number;
};

export type Tool =
  | "select"
  | "pen"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "text"
  | "eraser";

export type BaseElement = {
  id: string;
  type: Tool;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
};

export type PenElement = BaseElement & {
  type: "pen";
  points: Point[];
};

export type RectangleElement = BaseElement & {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CircleElement = BaseElement & {
  type: "circle";
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
};

export type LineElement = BaseElement & {
  type: "line";
  start: Point;
  end: Point;
};

export type ArrowElement = BaseElement & {
  type: "arrow";
  start: Point;
  end: Point;
};

export type TextElement = BaseElement & {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
};

export type DrawingElement =
  | PenElement
  | RectangleElement
  | CircleElement
  | LineElement
  | ArrowElement
  | TextElement;

type CanvasProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  elements: DrawingElement[];
  selectedElementId: string | null;
  zoom: number;

  canvasBackground: "white" | "black";

  onPointerDown: (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => void;

  onPointerMove: (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => void;

  onPointerUp: (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => void;

  onPointerCancel: (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => void;
};

export default function Canvas({
  canvasRef,
  elements,
  selectedElementId,
  zoom,
  canvasBackground,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: CanvasProps) {
  const [canvasHeight, setCanvasHeight] =
    useState(CANVAS_HEIGHT);

  /*
   * Automatically expand the canvas when
   * drawings get close to the bottom.
   */
  useEffect(() => {
    if (elements.length === 0) return;

    let lowestPoint = 0;

    elements.forEach((element) => {
      if (element.type === "pen") {
        element.points.forEach((point) => {
          lowestPoint = Math.max(
            lowestPoint,
            point.y,
          );
        });
      }

      if (element.type === "rectangle") {
        lowestPoint = Math.max(
          lowestPoint,
          element.y + element.height,
        );
      }

      if (element.type === "circle") {
        lowestPoint = Math.max(
          lowestPoint,
          element.y +
            Math.abs(element.radiusY),
        );
      }

      if (
        element.type === "line" ||
        element.type === "arrow"
      ) {
        lowestPoint = Math.max(
          lowestPoint,
          element.start.y,
          element.end.y,
        );
      }

      if (element.type === "text") {
        lowestPoint = Math.max(
          lowestPoint,
          element.y,
        );
      }
    });

    /*
     * If the drawing gets close to the bottom,
     * add more space.
     */
    if (
      lowestPoint >
      canvasHeight - CANVAS_EXPAND_THRESHOLD
    ) {
      setCanvasHeight((currentHeight) => {
        let newHeight = currentHeight;

        while (
          lowestPoint >
          newHeight - CANVAS_EXPAND_THRESHOLD
        ) {
          newHeight += CANVAS_EXPAND_STEP;
        }

        return newHeight;
      });
    }
  }, [elements, canvasHeight]);

  /*
   * Redraw canvas whenever drawing state changes.
   */
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.clearRect(
      0,
      0,
      CANVAS_WIDTH,
      canvasHeight,
    );

    elements.forEach((element) => {
      context.save();

      context.strokeStyle =
        element.strokeColor;

      context.lineWidth =
        element.strokeWidth;

      context.lineCap = "round";
      context.lineJoin = "round";

      if (
        element.fillColor !== "transparent"
      ) {
        context.fillStyle =
          element.fillColor;
      }

      /*
       * PEN
       */
      if (element.type === "pen") {
        if (element.points.length < 2) {
          context.restore();
          return;
        }

        
        context.beginPath();

      const firstPoint = element.points[0];

if (!firstPoint) {
  context.restore();
  return;
}

context.beginPath();

context.moveTo(
  firstPoint.x,
  firstPoint.y,
);

for (
  let i = 1;
  i < element.points.length;
  i++
) {
  const point = element.points[i];

  if (!point) continue;

  context.lineTo(
    point.x,
    point.y,
  );
}

context.stroke();

        context.stroke();
      }

      /*
       * RECTANGLE
       */
      if (element.type === "rectangle") {
        context.beginPath();

        context.rect(
          element.x,
          element.y,
          element.width,
          element.height,
        );

        if (
          element.fillColor !==
          "transparent"
        ) {
          context.fill();
        }

        context.stroke();
      }

      /*
       * CIRCLE
       */
      if (element.type === "circle") {
        context.beginPath();

        const centerX = element.x;
        const centerY = element.y;

        const radiusX = Math.abs(
          element.radiusX,
        );

        const radiusY = Math.abs(
          element.radiusY,
        );

        context.ellipse(
          centerX,
          centerY,
          radiusX,
          radiusY,
          0,
          0,
          Math.PI * 2,
        );

        if (
          element.fillColor !==
          "transparent"
        ) {
          context.fill();
        }

        context.stroke();
      }

      /*
       * LINE
       */
      if (element.type === "line") {
        context.beginPath();

        context.moveTo(
          element.start.x,
          element.start.y,
        );

        context.lineTo(
          element.end.x,
          element.end.y,
        );

        context.stroke();
      }

      /*
       * ARROW
       */
      if (element.type === "arrow") {
        const startX = element.start.x;
        const startY = element.start.y;

        const endX = element.end.x;
        const endY = element.end.y;

        context.beginPath();

        context.moveTo(startX, startY);
        context.lineTo(endX, endY);

        context.stroke();

        const angle = Math.atan2(
          endY - startY,
          endX - startX,
        );

        const arrowLength = 12;
        const arrowAngle = Math.PI / 6;

        context.beginPath();

        context.moveTo(endX, endY);

        context.lineTo(
          endX -
            arrowLength *
              Math.cos(
                angle - arrowAngle,
              ),
          endY -
            arrowLength *
              Math.sin(
                angle - arrowAngle,
              ),
        );

        context.moveTo(endX, endY);

        context.lineTo(
          endX -
            arrowLength *
              Math.cos(
                angle + arrowAngle,
              ),
          endY -
            arrowLength *
              Math.sin(
                angle + arrowAngle,
              ),
        );

        context.stroke();
      }

      /*
       * TEXT
       */
      if (element.type === "text") {
        context.font = `${element.fontSize}px sans-serif`;

        context.fillStyle =
          element.strokeColor;

        context.fillText(
          element.text,
          element.x,
          element.y,
        );
      }

      /*
       * SELECTED ELEMENT
       */
      if (
        selectedElementId === element.id
      ) {
        context.save();

        context.strokeStyle = "#2563eb";
        context.lineWidth = 1;
        context.setLineDash([6, 4]);

        /*
         * Rectangle selection
         */
        if (element.type === "rectangle") {
          context.strokeRect(
            element.x - 5,
            element.y - 5,
            element.width + 10,
            element.height + 10,
          );
        }

        /*
         * Circle selection
         */
        if (element.type === "circle") {
          context.beginPath();

          context.ellipse(
            element.x,
            element.y,
            Math.abs(
              element.radiusX,
            ) + 5,
            Math.abs(
              element.radiusY,
            ) + 5,
            0,
            0,
            Math.PI * 2,
          );

          context.stroke();
        }

        /*
         * Line / Arrow selection
         */
        if (
          element.type === "line" ||
          element.type === "arrow"
        ) {
          const start = element.start;
          const end = element.end;

          const minX = Math.min(
            start.x,
            end.x,
          );

          const minY = Math.min(
            start.y,
            end.y,
          );

          const width = Math.abs(
            end.x - start.x,
          );

          const height = Math.abs(
            end.y - start.y,
          );

          context.strokeRect(
            minX - 5,
            minY - 5,
            width + 10,
            height + 10,
          );
        }

        /*
         * Text selection
         */
        if (element.type === "text") {
          const textWidth =
            context.measureText(
              element.text,
            ).width;

          context.strokeRect(
            element.x - 5,
            element.y -
              element.fontSize -
              5,
            textWidth + 10,
            element.fontSize + 10,
          );
        }

        /*
         * Pen selection
         */
        if (element.type === "pen") {
          const points = element.points;

          if (points.length > 0) {
            const xs = points.map(
              (point) => point.x,
            );

            const ys = points.map(
              (point) => point.y,
            );

            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);

            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            context.strokeRect(
              minX - 5,
              minY - 5,
              maxX - minX + 10,
              maxY - minY + 10,
            );
          }
        }

        context.restore();
      }

      context.restore();
    });
  }, [
    canvasRef,
    elements,
    selectedElementId,
    zoom,
    canvasBackground,
    canvasHeight,
  ]);

  return (
    <div className="overflow-auto rounded-lg bg-gray-200 p-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={canvasHeight}
        style={{
          width: `${CANVAS_WIDTH * zoom}px`,
          height: `${canvasHeight * zoom}px`,
          backgroundColor:
            canvasBackground,
        }}
        className="block cursor-crosshair shadow-md"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />
    </div>
  );
}

