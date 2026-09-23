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
  hasElements: boolean;

  onUndo: () => void;
  onRedo: () => void;
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
  hasElements,

  onUndo,
  onRedo,
  onClear,
}: ToolbarProps) {
  const toolButtonClass = (
    tool: Tool,
  ) =>
    `flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      selectedTool === tool
        ? "bg-gray-900 text-white shadow-sm"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  const strokeWidths = [
    {
      value: 1,
      label: "Thin",
    },
    {
      value: 2,
      label: "Small",
    },
    {
      value: 3,
      label: "Medium",
    },
    {
      value: 5,
      label: "Thick",
    },
    {
      value: 8,
      label: "Bold",
    },
  ];

  return (
    <aside className="flex w-48 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
      {/* HEADER */}
      <div className="border-b border-gray-200 px-4 py-4">
        <div className="text-sm font-semibold text-gray-900">
          Tools
        </div>

        <div className="mt-1 text-xs text-gray-500">
          Draw and edit your canvas
        </div>
      </div>

      {/* TOOLS */}
      <div className="space-y-1 p-3">
        <button
          type="button"
          onClick={() =>
            setSelectedTool("select")
          }
          className={toolButtonClass(
            "select",
          )}
        >
          <span className="w-5 text-center">
            🖱
          </span>

          <span>Select</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedTool("pen")
          }
          className={toolButtonClass(
            "pen",
          )}
        >
          <span className="w-5 text-center">
            ✏️
          </span>

          <span>Pen</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedTool("rectangle")
          }
          className={toolButtonClass(
            "rectangle",
          )}
        >
          <span className="w-5 text-center">
            ▭
          </span>

          <span>Rectangle</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedTool("circle")
          }
          className={toolButtonClass(
            "circle",
          )}
        >
          <span className="w-5 text-center">
            ◯
          </span>

          <span>Circle</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedTool("line")
          }
          className={toolButtonClass(
            "line",
          )}
        >
          <span className="w-5 text-center">
            ╱
          </span>

          <span>Line</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedTool("arrow")
          }
          className={toolButtonClass(
            "arrow",
          )}
        >
          <span className="w-5 text-center">
            ➜
          </span>

          <span>Arrow</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedTool("text")
          }
          className={toolButtonClass(
            "text",
          )}
        >
          <span className="w-5 text-center font-bold">
            T
          </span>

          <span>Text</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedTool("eraser")
          }
          className={toolButtonClass(
            "eraser",
          )}
        >
          <span className="w-5 text-center">
            🧹
          </span>

          <span>Eraser</span>
        </button>
      </div>

      <div className="mx-3 h-px bg-gray-200" />

      {/* STYLE */}
      <div className="space-y-5 p-3">
        {/* STROKE */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Stroke
            </label>

            <span className="text-[11px] text-gray-400">
              {strokeColor.toUpperCase()}
            </span>
          </div>

          <div className="flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1.5">
            <div
              className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-gray-300"
              style={{
                backgroundColor:
                  strokeColor,
              }}
            >
              <input
                type="color"
                value={strokeColor}
                onChange={(event) =>
                  setStrokeColor(
                    event.target.value,
                  )
                }
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>

            <div className="flex-1 text-xs text-gray-500">
              Choose color
            </div>

            <input
              type="color"
              value={strokeColor}
              onChange={(event) =>
                setStrokeColor(
                  event.target.value,
                )
              }
              className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
            />
          </div>
        </div>

        {/* FILL */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Fill
          </label>

          <select
            value={fillColor}
            onChange={(event) =>
              setFillColor(
                event.target.value,
              )
            }
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
          >
            <option value="transparent">
              None
            </option>

            <option value="#fecaca">
              Red
            </option>

            <option value="#fed7aa">
              Orange
            </option>

            <option value="#fef08a">
              Yellow
            </option>

            <option value="#bbf7d0">
              Green
            </option>

            <option value="#bfdbfe">
              Blue
            </option>

            <option value="#e9d5ff">
              Purple
            </option>

            <option value="#e5e7eb">
              Gray
            </option>
          </select>
        </div>

        {/* STROKE WIDTH */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Stroke width
            </label>

            <span className="text-xs font-medium text-gray-500">
              {strokeWidth}px
            </span>
          </div>

          <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-1.5">
            {strokeWidths.map(
              (item) => (
                <button
                  key={
                    item.value
                  }
                  type="button"
                  onClick={() =>
                    setStrokeWidth(
                      item.value,
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 transition ${
                    strokeWidth ===
                    item.value
                      ? "bg-white shadow-sm ring-1 ring-gray-200"
                      : "hover:bg-white"
                  }`}
                >
                  <div className="flex h-5 w-8 items-center">
                    <div
                      className="w-full rounded-full"
                      style={{
                        height:
                          `${item.value}px`,
                        backgroundColor:
                          strokeColor,
                      }}
                    />
                  </div>

                  <span className="text-xs text-gray-600">
                    {item.label}
                  </span>
                </button>
              ),
            )}
          </div>
        </div>

        {/* TEXT SIZE */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Text size
            </label>

            <span className="text-xs font-medium text-gray-500">
              {fontSize}px
            </span>
          </div>

          <select
            value={fontSize}
            onChange={(event) =>
              setFontSize(
                Number(
                  event.target
                    .value,
                ),
              )
            }
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
          >
            <option value={16}>
              16 px
            </option>

            <option value={20}>
              20 px
            </option>

            <option value={24}>
              24 px
            </option>

            <option value={32}>
              32 px
            </option>

            <option value={40}>
              40 px
            </option>
          </select>
        </div>
      </div>

      <div className="mx-3 h-px bg-gray-200" />

      {/* HISTORY */}
      <div className="space-y-2 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          History
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={
              historyLength === 0
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↶ Undo
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={
              redoLength === 0
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↷ Redo
          </button>
        </div>

        <button
          type="button"
          onClick={onClear}
          disabled={!hasElements}
          className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear Canvas
        </button>
      </div>
    </aside>
  );
}