import { z } from "zod";

export const createInterestSchema = z.object({
  listingId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  chatRoomId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export type CreateInterestInput = z.infer<typeof createInterestSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
