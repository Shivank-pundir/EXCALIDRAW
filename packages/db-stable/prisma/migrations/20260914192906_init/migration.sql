-- CreateTable
CREATE TABLE "chat" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room" (
    "adminId" UUID NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "room_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "drawing" (
    "id" SERIAL NOT NULL,
    "roomId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drawing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "email" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "photo" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_roomId_idx_fe51d647" ON "chat"("roomId");

-- CreateIndex
CREATE INDEX "chat_userId_idx_a489d58a" ON "chat"("userId");

-- CreateIndex
CREATE INDEX "room_adminId_idx_530179db" ON "room"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "drawing_roomId_key" ON "drawing"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "room"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drawing" ADD CONSTRAINT "drawing_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "room"("slug") ON DELETE CASCADE ON UPDATE NO ACTION;
