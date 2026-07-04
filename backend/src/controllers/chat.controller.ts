import { Request, Response } from "express";
import { chatService } from "../services/chat.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/apiResponse";

export const chatController = {
  getMessages: asyncHandler(async (req: Request, res: Response) => {
    const messages = await chatService.getMessages(req.params.roomId, req.user!.id);
    success(res, messages, "Messages");
  }),
};
