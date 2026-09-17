"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Caveat, Inter } from "next/font/google";
import { toast } from "sonner";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

type User = {
  id: string;
  email: string;
  name: string;
};

type Room = {
  slug: string;
  name: string;
  updatedAt?: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    // No session at all — bounce to login immediately instead of
    // rendering an empty dashboard and only failing later on an action.
    if (!token || token === "undefined") {
      toast.error("Please login first");
      router.replace("/login");
      return;
    }

    const savedUser = localStorage.getItem("user");

    // Read user safely
    if (savedUser && savedUser !== "undefined") {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Invalid user data in localStorage:", error);
        localStorage.removeItem("user");
      }
    }

    // Rooms are fetched from the backend, scoped to this user's
    // adminId, instead of trusted from localStorage — localStorage
    // is shared by the whole browser, so it isn't safe to use as
    // the source of truth for "which rooms does THIS user own".
    async function fetchRooms() {
      try {
        const response = await axios.get(
          "http://127.0.0.1:4000/rooms",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setRooms(response.data.rooms ?? []);
      } catch (error) {
        console.error("Fetch rooms error:", error);

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          toast.error("Please login again");
          router.replace("/login");
          return;
        }

        toast.error("Failed to load your rooms");
      }
    }

    fetchRooms();
  }, [router]);

  function saveRooms(nextRooms: Room[]) {
    setRooms(nextRooms);
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoomName = roomName.trim();

    if (!cleanRoomName) {
      toast.error("Please enter a room name");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        router.push("/login");
        return;
      }

      const response = await axios.post(
        "http://127.0.0.1:4000/room",
        {
          name: cleanRoomName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Backend returns { slug, name, adminId } once the /room
      // route saves `name` on the Room model. If your Prisma
      // schema doesn't have that column yet, response.data.room.name
      // will be undefined and we fall back to what the user typed.
      const createdRoom: Room = {
        slug: response.data.room.slug,
        name: response.data.room.name ?? cleanRoomName,
      };

      const updatedRooms = [
        createdRoom,
        ...rooms.filter((room) => room.slug !== createdRoom.slug),
      ];

      saveRooms(updatedRooms);

      setRoomName("");
      setShowCreateModal(false);
      setError("");

      toast.success("Room created successfully");
    } catch (error: unknown) {
      console.error("Create room error:", error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 409) {
          toast.error("Room already exists");
          setError("Room already exists");
        } else {
          toast.error(message || "Failed to create room");
          setError(message || "Failed to create room");
        }
      } else {
        toast.error("Something went wrong");
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoomId = joinRoomId.trim();

    if (!cleanRoomId) {
      toast.error("Please enter a room ID");
      return;
    }

    try {
      setJoining(true);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        router.push("/login");
        return;
      }

      const response = await axios.get(
        `http://127.0.0.1:4000/room/${encodeURIComponent(cleanRoomId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const joinedRoom: Room = {
        slug: response.data.room.slug,
        name: response.data.room.name ?? cleanRoomId,
      };

      // Keep this room in the dashboard list too, so a joined
      // room (not just created ones) shows up as a card.
      const updatedRooms = [
        joinedRoom,
        ...rooms.filter((room) => room.slug !== joinedRoom.slug),
      ];

      saveRooms(updatedRooms);

      setJoinRoomId("");
      setShowJoinModal(false);
      setError("");

      toast.success("You joined the room");

      router.push(`/room/${encodeURIComponent(joinedRoom.slug)}`);
    } catch (error: unknown) {
      console.error("Join room error:", error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 404) {
          toast.error("Room doesn't exist");
          setError("Room doesn't exist");
        } else {
          toast.error(message || "Failed to join room");
          setError(message || "Failed to join room");
        }
      } else {
        toast.error("Something went wrong");
        setError("Something went wrong");
      }
    } finally {
      setJoining(false);
    }
  };

  function handleOpenRoom(room: Room) {
    router.push(`/room/${room.slug}`);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rooms"); // clear any leftover rooms from a previous account on this browser

    router.replace("/login");
  }

  const firstLetter = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <main
      className={`${inter.variable} ${caveat.variable} min-h-screen font-sans`}
      style={{
        backgroundColor: "#12172A",
        backgroundImage:
          "radial-gradient(circle, rgba(232,163,61,0.13) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#101426]/80 p-5 backdrop-blur-xl md:flex md:flex-col">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: "#E8A33D" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1B2138"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </div>

            <div>
              <p
                className="text-3xl leading-none"
                style={{
                  color: "#F8F0DC",
                  fontFamily: "var(--font-caveat)",
                }}
              >
                Sketchly
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Collaborative canvas
              </p>
            </div>
          </div>

          <nav className="mt-12 space-y-2">
            <div className="flex items-center gap-3 rounded-xl bg-[#E8A33D]/15 px-4 py-3 text-sm font-semibold text-[#E8A33D]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
              </svg>

              Dashboard
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-xl">＋</span>
              Create room
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-xl">↗</span>
              Join room
            </button>
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-medium text-zinc-500">
              YOUR WORKSPACE
            </p>

            <p className="mt-2 text-sm text-zinc-300">
              {rooms.length}{" "}
              {rooms.length === 1 ? "room" : "rooms"} created
            </p>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#E8A33D]"
                style={{
                  width: `${Math.min(rooms.length * 10, 100)}%`,
                }}
              />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="min-w-0 flex-1">
          {/* Topbar */}
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-8">
            <div>
              <p className="text-sm text-zinc-500">
                Your creative workspace
              </p>

              <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                Good to see you, {user?.name || "creator"}.
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-white">
                  {user?.name || "User"}
                </p>

                <p className="max-w-[180px] truncate text-xs text-zinc-500">
                  {user?.email || ""}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8A33D] font-bold text-[#1B2138]">
                {firstLetter}
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                Logout
              </button>
            </div>
          </header>

          <div className="px-5 py-8 sm:px-8">
            {/* Hero section */}
            <section className="relative overflow-hidden rounded-[26px] border border-[#E8A33D]/30 bg-[#F8F0DC] p-6 text-[#1B2138] shadow-2xl sm:p-8">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex rounded-full bg-[#1B2138]/10 px-3 py-1 text-xs font-semibold">
                  ✦ Your ideas, brought to life
                </span>

                <h2
                  className="mt-4 text-4xl leading-[0.95] sm:text-6xl"
                  style={{
                    fontFamily: "var(--font-caveat)",
                  }}
                >
                  Think it.
                  <br />
                  Sketch it.
                  <br />
                  Share it.
                </h2>

                <p className="mt-5 max-w-md text-sm leading-6 text-[#5B6478] sm:text-base">
                  Create a room, invite your teammates, and turn your ideas
                  into beautiful collaborative drawings.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="rounded-[14px_4px_14px_4px] bg-[#1B2138] px-5 py-3 text-sm font-semibold text-[#F8F0DC] transition hover:bg-[#2A3252]"
                  >
                    + Create new room
                  </button>

                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="rounded-[14px_4px_14px_4px] border border-[#1B2138]/20 px-5 py-3 text-sm font-semibold transition hover:bg-[#1B2138]/10"
                  >
                    Join a room ↗
                  </button>
                </div>
              </div>

              {/* Decorative sketch */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 hidden rotate-12 opacity-80 lg:block"
              >
                <svg
                  width="330"
                  height="300"
                  viewBox="0 0 330 300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="45"
                    y="45"
                    width="190"
                    height="140"
                    rx="8"
                    stroke="#1B2138"
                    strokeWidth="3"
                  />

                  <path
                    d="M70 150L115 105L150 135L190 85L215 150"
                    stroke="#E8A33D"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <circle
                    cx="105"
                    cy="80"
                    r="12"
                    stroke="#1B2138"
                    strokeWidth="3"
                  />

                  <path
                    d="M25 220C85 195 155 250 290 210"
                    stroke="#1B2138"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="8 10"
                  />

                  <path
                    d="M250 55L285 20M270 75L305 40"
                    stroke="#E8A33D"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </section>

            {/* Rooms header */}
            <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8A33D]">
                  Workspace
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Recent rooms
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Continue working on your latest ideas.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                + New room
              </button>
            </div>

            {/* Room cards / empty state */}
            {rooms.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8A33D]/15 text-3xl">
                  ✎
                </div>

                <h3 className="mt-5 text-lg font-semibold text-white">
                  Your workspace is empty
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Create your first room and start drawing, planning, and
                  collaborating with your team.
                </p>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-6 rounded-xl bg-[#E8A33D] px-5 py-3 text-sm font-bold text-[#1B2138] transition hover:bg-[#f0b45b]"
                >
                  Create your first room
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rooms.map((room) => (
                  <button
                    key={room.slug}
                    onClick={() => handleOpenRoom(room)}
                    className="group rounded-2xl border border-white/10 bg-[#1A2035] p-5 text-left transition hover:-translate-y-1 hover:border-[#E8A33D]/50 hover:bg-[#202840]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8A33D]/15 text-xl text-[#E8A33D]">
                        ▱
                      </div>

                      <span className="text-zinc-600 transition group-hover:text-[#E8A33D]">
                        ↗
                      </span>
                    </div>

                    <h3 className="mt-6 truncate text-lg font-semibold text-white">
                      {room.name}
                    </h3>

                    <p className="mt-2 truncate text-xs text-zinc-500">
                      Room ID: {room.slug}
                    </p>

                    <div className="mt-5 flex items-center justify-between text-xs text-zinc-500">
                      <span>Collaborative canvas</span>
                      <span className="text-[#E8A33D]">
                        Open room
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Helpful information */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl">✦</p>
                <h3 className="mt-4 font-semibold text-white">
                  Draw freely
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Create diagrams, wireframes, and quick ideas.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl">⌘</p>
                <h3 className="mt-4 font-semibold text-white">
                  Collaborate
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Work together inside the same room in real time.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl">↗</p>
                <h3 className="mt-4 font-semibold text-white">
                  Share ideas
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Invite others using your room ID or room link.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Create room modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#F8F0DC] p-7 text-[#1B2138] shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-4xl"
                  style={{
                    fontFamily: "var(--font-caveat)",
                  }}
                >
                  Create a new room
                </p>

                <p className="mt-1 text-sm text-[#5B6478]">
                  Give your workspace a memorable name.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError("");
                }}
                className="rounded-lg px-2 py-1 text-xl text-[#5B6478] hover:bg-black/5"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateRoom}
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="roomName"
                  className="mb-2 block text-sm font-semibold"
                >
                  Room name
                </label>

                <input
                  id="roomName"
                  value={roomName}
                  onChange={(event) =>
                    setRoomName(event.target.value)
                  }
                  placeholder="My design project"
                  className="w-full border-b-2 border-[#C9BFA1] bg-transparent px-1 py-3 text-sm outline-none placeholder:text-[#9AA0AE] focus:border-[#E8A33D]"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[14px_4px_14px_4px] bg-[#1B2138] py-3 text-sm font-semibold text-[#F8F0DC] transition hover:bg-[#2A3252] disabled:opacity-50"
              >
                {loading ? "Creating room..." : "Create room"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join room modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#F8F0DC] p-7 text-[#1B2138] shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-4xl"
                  style={{
                    fontFamily: "var(--font-caveat)",
                  }}
                >
                  Join a room
                </p>

                <p className="mt-1 text-sm text-[#5B6478]">
                  Enter the room ID shared with you.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setError("");
                }}
                className="rounded-lg px-2 py-1 text-xl text-[#5B6478] hover:bg-black/5"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleJoinRoom}
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="joinRoomId"
                  className="mb-2 block text-sm font-semibold"
                >
                  Room ID or slug
                </label>

                <input
                  id="joinRoomId"
                  value={joinRoomId}
                  onChange={(event) =>
                    setJoinRoomId(event.target.value)
                  }
                  placeholder="Enter room ID"
                  className="w-full border-b-2 border-[#C9BFA1] bg-transparent px-1 py-3 text-sm outline-none placeholder:text-[#9AA0AE] focus:border-[#E8A33D]"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={joining}
                className="w-full rounded-[14px_4px_14px_4px] bg-[#1B2138] py-3 text-sm font-semibold text-[#F8F0DC] transition hover:bg-[#2A3252] disabled:opacity-50"
              >
                {joining ? "Joining room..." : "Join room"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
