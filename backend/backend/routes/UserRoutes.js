import express from "express";
import {
    createUser,
    getUserById,
    getUsers
} from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);
router.post("/", requireRole("ADMIN"), createUser);
router.get("/", requireRole("ADMIN"), getUsers);
router.get("/:id", getUserById);

export default router;


