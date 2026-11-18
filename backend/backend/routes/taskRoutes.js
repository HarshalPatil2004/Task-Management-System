import express from "express";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
  updateTaskStatus,
} from "../controllers/taskController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);
router.route("/").get(getTasks).post(createTask);
router
  .route("/:id")
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.patch("/:id/status", updateTaskStatus);

export default router;
