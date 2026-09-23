type ZoomControlsProps = {
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onReset: () => void;
};

export default function ZoomControls({
  zoom,
  onZoomOut,
  onZoomIn,
  onReset,
}: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onZoomOut}
        className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
      >
        −
      </button>

      <span className="min-w-16 text-center text-sm">
        {Math.round(zoom * 100)}%
      </span>

      <button
        onClick={onZoomIn}
        className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
      >
        +
      </button>

      <button
        onClick={onReset}
        className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
      >
        Reset
      </button>
    </div>
  );
}