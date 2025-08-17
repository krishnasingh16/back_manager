import { User } from "../models/auth.model.js";
import { Task } from "../models/task.model.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "_id fullname email role"); 

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

export const getTaskCounts = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    let matchQuery = {};

    if (role !== "admin") {
      matchQuery = {
        $or: [
          { createdBy: userId },
          { assignedTo: userId }
        ]
      };
    }

    const [totalTasks, totalPending, totalInProgress, totalCompleted] = await Promise.all([
      Task.countDocuments(role === "admin" ? {} : matchQuery),
      Task.countDocuments({ ...matchQuery, status: "pending" }),
      Task.countDocuments({ ...matchQuery, status: "in-progress" }),
      Task.countDocuments({ ...matchQuery, status: "completed" }),
    ]);

    return res.status(200).json({
      success: true,
      counts: {
        totalTasks,
        totalPending,
        totalInProgress,
        totalCompleted,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const CreateTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;
    const createdBy = req.user.id;

    if (assignedTo && !assignedTo.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid assignedTo user ID",
        success: false,
      });
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      createdBy,
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllTasks = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const keyword = req.query.keyword || "";

    let baseQuery = {
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
    };

    if (role !== "admin") {
      // Show tasks either created by user OR assigned to user
      baseQuery = {
        $and: [
          baseQuery,
          {
            $or: [
              { createdBy: userId },
              { assignedTo: userId }
            ]
          }
        ]
      };
    }

    const tasks = await Task.find(baseQuery);

    if (!tasks.length) {
      return res.status(404).json({
        message: "Tasks not found",
        success: false,
      });
    }

    return res.status(200).json({ tasks, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const taskId = req.params.id;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
        success: false,
      });
    }

    if (role !== "admin" && task.createdBy.toString() !== userId) {
      return res.status(403).json({
        message: "Access denied",
        success: false,
      });
    }

    return res.status(200).json({ task, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const taskId = req.params.id;
    const { title, description, status, priority, dueDate, assignedTo, tags } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        message: "Task not found",
        success: false,
      });
    }

    if (role !== "admin" && task.createdBy.toString() !== userId) {
      return res.status(403).json({
        message: "Access denied",
        success: false,
      });
    }

    const allowedStatuses = ["pending", "in-progress", "completed"];

    if (role !== "admin") {
      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid or missing status. Only status update is allowed.",
          success: false,
        });
      }
      task.status = status;
    } else {
      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status value.",
          success: false,
        });
      }

      if (title) task.title = title;
      if (description) task.description = description;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate) task.dueDate = dueDate;
      if (assignedTo) task.assignedTo = assignedTo;
      if (tags) task.tags = tags;
    }

    task.updatedAt = new Date();
    await task.save();

    return res.status(200).json({
      message: "Task updated successfully",
      success: true,
      task,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { role } = req.user;
    const taskId = req.params.id;

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admin can delete tasks",
        success: false,
      });
    }

    const deletedTask = await Task.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({
        message: "Task not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Task deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
