
"use client";

type RoomHeaderProps = {
  slug: string;
  isConnected: boolean;
  roomUsersCount: number;
  roomUsers: {
    userId: string;
    name: string;
  }[];
  isSaving: boolean;
  onSave: () => void;
};

export default function RoomHeader({
  slug,
  isConnected,
  roomUsersCount,
  roomUsers,
  isSaving,
  onSave,
}: RoomHeaderProps) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 bg-gray-900 px-5 py-4 text-white">
      {/* App Name */}
      <h1 className="text-xl font-bold">
        Excalidraw Clone
      </h1>

      <div className="flex items-center gap-4 text-sm">
        {/* Room Name */}
        <span>
          Room:{" "}
          <strong className="text-blue-300">
            {slug}
          </strong>
        </span>

        {/* Online Users */}
        <div className="flex items-center gap-2">
          {/* User Avatars */}
          <div className="flex -space-x-2">
            {roomUsers.map((user) => (
              <div
                key={user.userId}
                className="group relative"
              >
                {/* Avatar */}
                <div
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-gray-900 bg-blue-500 text-xs font-bold text-white"
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>

                {/* Username Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                  {user.name}
                </div>
              </div>
            ))}
          </div>

          {/* Online Count */}
          <span className="text-gray-300">
            {roomUsersCount} online
          </span>
        </div>

        {/* Connection Status */}
        <span
          className={
            isConnected
              ? "text-green-300"
              : "text-red-300"
          }
        >
          ●{" "}
          {isConnected
            ? "Connected"
            : "Disconnected"}
        </span>

        {/* Save Button */}
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

