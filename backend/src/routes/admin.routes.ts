import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/dashboard", adminController.dashboard);
router.get("/users", adminController.listUsers);
router.delete("/users/:id", adminController.deactivateUser);
router.get("/listings", adminController.listListings);
router.delete("/listings/:id", adminController.deleteListing);

export default router;
