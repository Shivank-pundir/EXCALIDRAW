"use client";

type Tool =
  | "select"
  | "pen"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "text"
  | "eraser";

type ToolbarProps = {
  selectedTool: Tool;
  setSelectedTool: (tool: Tool) => void;

  strokeColor: string;
  setStrokeColor: (color: string) => void;

  fillColor: string;
  setFillColor: (color: string) => void;

  strokeWidth: number;
  setStrokeWidth: (width: number) => void;

  fontSize: number;
  setFontSize: (size: number) => void;

  historyLength: number;
  redoLength: number;
  hasSelectedElement: boolean;
  hasElements: boolean;

  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onClear: () => void;
};

export default function Toolbar({
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
  historyLength,
  redoLength,
  hasSelectedElement,
  hasElements,
  onUndo,
  onRedo,
  onDelete,
  onClear,
}: ToolbarProps) {
  const toolButtonClass = (tool: Tool) =>
    `w-full rounded-md px-2 py-2 text-sm font-medium transition ${
      selectedTool === tool
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }`;

  return (
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

      <button
        onClick={onUndo}
        disabled={historyLength === 0}
        className="w-full rounded-md bg-gray-800 px-2 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-40"
      >
        ↶ Undo
      </button>

      <button
        onClick={onRedo}
        disabled={redoLength === 0}
        className="w-full rounded-md bg-gray-800 px-2 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-40"
      >
        ↷ Redo
      </button>

      <button
        onClick={onDelete}
        disabled={!hasSelectedElement}
        className="w-full rounded-md bg-orange-600 px-2 py-2 text-sm text-white hover:bg-orange-700 disabled:opacity-40"
      >
        Delete
      </button>

      <button
        onClick={onClear}
        disabled={!hasElements}
        className="w-full rounded-md bg-red-600 px-2 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-40"
      >
        Clear
      </button>
    </aside>
  );
}