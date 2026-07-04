import { Router } from "express";
import { compatibilityController } from "../controllers/compatibility.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post("/generate", authenticate, authorize("TENANT"), compatibilityController.generate);

export default router;
