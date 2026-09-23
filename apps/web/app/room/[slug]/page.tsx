"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";

import { useParams } from "next/navigation";
import type { PointerEvent as ReactPointerEvent } from "react";

import RoomHeader from "@/app/components/room/RoomHeader";
import Toolbar from "@/app/components/room/Toolbar";
import Canvas, {
  type DrawingElement,
} from "@/app/components/canvas/Canvas";
import Chat from "@/app/components/chat/Chat";
import ZoomControls from "@/app/components/canvas/ZoomControl";

import { useDrawing } from "@/app/hooks/useDrawing";
import { useRoomSocket } from "@/app/hooks/useRoomSocket";

export default function RoomPage() {
  const params = useParams();
  const slug = params.slug as string;


  const setElementsRef = useRef<
    Dispatch<SetStateAction<DrawingElement[]>> | null
  >(null);

  /*
   * WebSocket
   */
  const roomSocket = useRoomSocket(
    slug,
    (receivedElements) => {
      setElementsRef.current?.(
        receivedElements,
      );
    },
  );

  /*
   * Drawing
   */
  const drawing = useDrawing(
    slug,
    roomSocket.skipDrawingBroadcastRef,
  );

  setElementsRef.current =
    drawing.setElements;

 const {
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
} = roomSocket;

  const {
    canvasRef,

    elements,
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
     * Inline text editor
     */
    textEditor,
    setTextEditor,
    handleTextEditorKeyDown,

    /*
     * Drawing actions
     */
    handleUndo,
    handleRedo,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleDelete,
    handleClear,
    saveDrawing,

    /*
     * Zoom
     */
    zoomIn,
    zoomOut,
    resetZoom,
  } = drawing;

  /*
   * Broadcast local drawing changes
   * to everyone in the room.
   */
  useEffect(() => {
    if (!hasJoinedRoomRef.current) {
      return;
    }

    /*
     * Don't broadcast the drawing that was
     * loaded from the database.
     */
    if (skipDrawingBroadcastRef.current) {
      skipDrawingBroadcastRef.current = false;
      return;
    }

    const socket = wsRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
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
  }, [
    elements,
    hasJoinedRoomRef,
    skipDrawingBroadcastRef,
    slug,
    wsRef,
  ]);

  /*
   * Keyboard shortcuts.
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      const target =
        event.target as HTMLElement;

      /*
       * Don't trigger canvas shortcuts while
       * typing inside an input.
       */
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      /*
       * Undo
       */
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "z"
      ) {
        event.preventDefault();

        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }

        return;
      }

      /*
       * Redo
       */
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "y"
      ) {
        event.preventDefault();
        handleRedo();
        return;
      }

      /*
       * Delete selected element.
       */
      if (
        event.key === "Delete" ||
        event.key === "Backspace"
      ) {
        handleDelete();
      }

      /*
       * Tool shortcuts.
       */
      const toolShortcuts: Record<
        string,
        typeof selectedTool
      > = {
        v: "select",
        p: "pen",
        r: "rectangle",
        c: "circle",
        l: "line",
        a: "arrow",
        t: "text",
        e: "eraser",
      };

      const tool =
        toolShortcuts[
          event.key.toLowerCase()
        ];

      if (tool) {
        setSelectedTool(tool);
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
    handleDelete,
    handleRedo,
    handleUndo,
    setSelectedTool,
  ]);

  /*
   * Canvas pointer movement.
   *
   * Handles both:
   * 1. Local drawing
   * 2. Remote cursor position
   */
  const handleCanvasPointerMove =
    useCallback(
      (
        event: ReactPointerEvent<HTMLCanvasElement>,
      ) => {
        sendCursorPosition(event);
        handlePointerMove(event);
      },
      [
        handlePointerMove,
        sendCursorPosition,
      ],
    );

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Header */}
      <RoomHeader
        slug={slug}
        isConnected={isConnected}
        roomUsersCount={roomUsers.length}
        roomUsers={roomUsers}
        isSaving={isSaving}
        onSave={saveDrawing}
      />

      <div className="flex min-h-0 flex-1">
        {/* Toolbar */}
        <Toolbar
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          fillColor={fillColor}
          setFillColor={setFillColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          fontSize={fontSize}
          setFontSize={setFontSize}
          historyLength={history.length}
          redoLength={redoStack.length}
         
          hasElements={elements.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
         
          onClear={handleClear}
        />

        {/* Main canvas area */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Zoom controls */}
          <div className="flex items-center justify-center border-b bg-white p-3">
            <ZoomControls
              zoom={zoom}
              onZoomOut={zoomOut}
              onZoomIn={zoomIn}
              onReset={resetZoom}
            />
          </div>

          {/* Canvas container */}
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="relative inline-block">
              {/* Canvas */}
              <Canvas
                canvasRef={canvasRef}
                elements={elements}
                canvasBackground="white"
                selectedElementId={
                  selectedElementId
                }
                zoom={zoom}
                onPointerDown={
                  handlePointerDown
                }
                onPointerMove={
                  handleCanvasPointerMove
                }
                onPointerUp={
                  handlePointerUp
                }
                onPointerCancel={
                  handlePointerCancel
                }
              />

              {textEditor && (
                <input
                  autoFocus
                  value={textEditor.value}
                  onChange={(event) => {
                    setTextEditor(
                      (previous) =>
                        previous
                          ? {
                              ...previous,
                              value:
                                event.target
                                  .value,
                            }
                          : previous,
                    );
                  }}
                  onKeyDown={
                    handleTextEditorKeyDown
                  }
                  style={{
                    position: "absolute",

                    /*
                     * Canvas has p-4,
                     * so compensate for that padding.
                     */
                    left:
                      16 +
                      textEditor.x *
                        zoom,

                    /*
                     * Canvas text uses the
                     * baseline as its Y position.
                     */
                    top:
                      16 +
                      (textEditor.y -
                        fontSize) *
                        zoom,

                    fontSize:
                      `${fontSize * zoom}px`,

                    lineHeight: "1.2",

                    color: strokeColor,

                    minWidth: "20px",

                    padding: 0,
                    margin: 0,

                    border: "none",
                    outline: "none",

                    background:
                      "transparent",

                    fontFamily:
                      "sans-serif",

                    zIndex: 20,
                  }}
                  className="cursor-text"
                />
              )}

              {/* Remote cursors */}
              {Object.entries(
                remoteCursors,
              ).map(
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
                        {/* Cursor arrow */}
                        <div
                          className="h-0 w-0"
                          style={{
                            borderTop:
                              "10px solid #111827",
                            borderRight:
                              "7px solid transparent",
                          }}
                        />

                        {/* User name */}
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

          {/* Loading indicator */}
          {isLoading && (
            <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 rounded-md bg-white px-4 py-2 text-sm shadow">
              Loading drawing...
            </div>
          )}
        </main>

        {/* Chat is visible only when
            there is more than one user. */}
        
         <Chat
  chatMessages={chatMessages}
  chatInput={chatInput}
  currentUserId={currentUserId}
  setChatInput={setChatInput}
  isChatConnected={isChatConnected}
  onSendMessage={sendChatMessage}
/>
        
      </div>
    </div>
  );
}