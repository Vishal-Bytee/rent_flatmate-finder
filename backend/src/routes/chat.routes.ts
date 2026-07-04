import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/:roomId/messages", authenticate, chatController.getMessages);

export default router;
