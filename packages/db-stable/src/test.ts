import { randomUUID } from "node:crypto";
import { prisma } from "./client.js";

async function main() {
  await prisma.$connect();

  console.log("Connected to Neon successfully");

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      password: "temporary-password",
    },
  });

  console.log("User created:", user.id);

  const room = await prisma.room.create({
    data: {
      slug: `test-room-${Date.now()}`,
      adminId: user.id,
    },
  });

  console.log("Room created:", room.slug);

  const drawing = await prisma.drawing.create({
    data: {
      roomId: room.slug,
      data: {
        elements: [
          {
            id: "rectangle-1",
            type: "rectangle",
            x: 100,
            y: 100,
            width: 200,
            height: 100,
          },
        ],
        appState: {},
        files: {},
      },
    },
  });

  console.log("Drawing saved:", drawing);

  const savedDrawing = await prisma.drawing.findUnique({
    where: {
      roomId: room.slug,
    },
  });

  console.log("Drawing retrieved:", savedDrawing);
}

main()
  .catch((error) => {
    console.error("Drawing test failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });