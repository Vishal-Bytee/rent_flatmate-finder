import { Router } from "express";
import authRoutes from "./auth.routes";
import listingRoutes from "./listing.routes";
import compatibilityRoutes from "./compatibility.routes";
import interestRoutes from "./interest.routes";
import chatRoutes from "./chat.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/listings", listingRoutes);
router.use("/compatibility", compatibilityRoutes);
router.use("/interests", interestRoutes);
router.use("/chat", chatRoutes);
router.use("/admin", adminRoutes);

export default router;
