"use client";

type RoomHeaderProps = {
  slug: string;
  isConnected: boolean;
  roomUsersCount: number;
  isSaving: boolean;
  onSave: () => void;
};

export default function RoomHeader({
  slug,
  isConnected,
  roomUsersCount,
  isSaving,
  onSave,
}: RoomHeaderProps) {
  return (
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
            isConnected
              ? "text-green-300"
              : "text-red-300"
          }
        >
          👥 {roomUsersCount} online{" "}
          {isConnected
            ? "● Connected"
            : "● Disconnected"}
        </span>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="rounded-md bg-green-600 px-4 py-2 font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </nav>
  );
}