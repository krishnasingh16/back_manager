import express from "express";
import {
  CreateTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskCounts,
  getAllUsers,
} from "../controllers/task.controller.js";
import isAuth from "../middleware/isAuthenticated.js";

const router = express.Router();
router.route("/user").get(isAuth, getAllUsers);
router.route("/counts").get(isAuth, getTaskCounts);
router.route("/create-task").post(isAuth, CreateTask);
router.route("/all-task").get(isAuth, getAllTasks);
router.route("/task/:id").get(isAuth, getTaskById);
router.route("/update/:id").put(isAuth, updateTask);
router.route("/delete/:id").delete(isAuth, deleteTask);

export default router;
