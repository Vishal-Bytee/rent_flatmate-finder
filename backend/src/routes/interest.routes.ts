import { Router } from "express";
import { interestController } from "../controllers/interest.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { createInterestSchema } from "../validators/interest.validator";

const router = Router();

router.post("/", authenticate, authorize("TENANT"), validate(createInterestSchema), interestController.create);
router.get("/", authenticate, authorize("TENANT", "OWNER"), interestController.myRequests);
router.patch("/:id/accept", authenticate, authorize("OWNER"), interestController.accept);
router.patch("/:id/decline", authenticate, authorize("OWNER"), interestController.decline);

export default router;
