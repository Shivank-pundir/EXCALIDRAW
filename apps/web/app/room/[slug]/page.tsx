"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function RoomPage() {
  const params = useParams();
  const slug = params.slug as string;

  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedTool, setSelectedTool] = useState("pen");

  // WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("JWT token not found");
      return;
    }

    const ws = new WebSocket(
      `ws://localhost:8080?token=${token}`
    );

    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to WebSocket server");

      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId: slug,
        })
      );
    };

    ws.onmessage = (event) => {
      console.log("Server message:", event.data);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [slug]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 180;

    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "#111827";

    let isDrawing = false;

    const startDrawing = (
      event: PointerEvent
    ) => {
      if (selectedTool !== "pen") return;

      isDrawing = true;

      context.beginPath();
      context.moveTo(event.offsetX, event.offsetY);
    };

    const draw = (event: PointerEvent) => {
      if (!isDrawing || selectedTool !== "pen") return;

      context.lineTo(event.offsetX, event.offsetY);
      context.stroke();
    };

    const stopDrawing = () => {
      isDrawing = false;
      context.closePath();
    };

    canvas.addEventListener("pointerdown", startDrawing);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", stopDrawing);
    canvas.addEventListener("pointerleave", stopDrawing);

    return () => {
      canvas.removeEventListener(
        "pointerdown",
        startDrawing
      );

      canvas.removeEventListener(
        "pointermove",
        draw
      );

      canvas.removeEventListener(
        "pointerup",
        stopDrawing
      );

      canvas.removeEventListener(
        "pointerleave",
        stopDrawing
      );
    };
  }, [selectedTool]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            EXCALIDRAW
          </h1>

          <p className="text-sm text-gray-500">
            Room: {slug}
          </p>
        </div>

        <button
          onClick={clearCanvas}
          className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          Clear Canvas
        </button>
      </nav>

      {/* Toolbar */}
      <div className="flex gap-3 border-b bg-white px-6 py-3">
        <button
          onClick={() => setSelectedTool("pen")}
          className={`rounded-md border px-4 py-2 ${
            selectedTool === "pen"
              ? "bg-black text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Pen
        </button>

        <button
          onClick={() => setSelectedTool("select")}
          className={`rounded-md border px-4 py-2 ${
            selectedTool === "select"
              ? "bg-black text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Select
        </button>
      </div>

      {/* Canvas */}
      <section className="overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="block min-h-[calc(100vh-145px)] w-full touch-none"
        />
      </section>
    </main>
  );
}