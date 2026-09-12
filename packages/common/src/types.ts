import { z } from "zod";

export const CreateUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  name: z.string().min(2)
});

export const siginSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string()
});

export const createRoomSchema = z.object({
  name: z.string().min(3).max(20)
});