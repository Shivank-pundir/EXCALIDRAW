"use client";

type RoomInfoProps = {
  roomName: string;
  userCount: number;
};

export default function RoomInfo({
  roomName,
  userCount,
}: RoomInfoProps) {
  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Room
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Your collaborative workspace
        </p>
      </div>

      {/* Room details */}
      <div className="flex-1 space-y-4 p-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Room name
          </p>

          <p className="mt-2 break-all text-sm font-semibold text-slate-800">
            {roomName}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              People in room
            </span>

            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {userCount}
            </span>
          </div>
        </div>

        {/* Empty state */}
        <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">
            +
          </div>

          <h3 className="text-sm font-semibold text-slate-800">
            Invite someone
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Share this room with another user to start
            collaborating in real time.
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="border-t border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          You are the only person here
        </div>
      </div>
    </aside>
  );
}