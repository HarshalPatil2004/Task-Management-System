import mongoose from "mongoose"
import Task from "../models/Task.js"

const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED"]
const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"]
const allowedUpdateFields = ["title", "description", "status", "priority", "dueDate"]

const handleTaskError = (error, res, next) => {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: "Invalid task details." })
  }
  return next(error)
}

const hasValidId = (id) => mongoose.isValidObjectId(id)
const isValidDate = (value) => {
  if (typeof value !== "string" || !value.trim()) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return !/^\d{4}-\d{2}-\d{2}$/.test(value) || date.toISOString().slice(0, 10) === value
}

export const createTask = async (req, res, next) => {
  const { title, description, status, priority, dueDate } = req.body
  if (typeof title !== "string" || !title.trim() || !dueDate || !isValidDate(dueDate)) {
    return res.status(400).json({ message: "A task title and valid due date are required." })
  }
  if (status !== undefined && !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid task status." })
  }
  if (priority !== undefined && !validPriorities.includes(priority)) {
    return res.status(400).json({ message: "Invalid task priority." })
  }

  try {
    const task = await Task.create({
      title: title.trim(),
      description,
      status,
      priority,
      dueDate,
      createdBy: req.user.userId,
      assignedTo: req.user.userId,
    })
    await task.populate("assignedTo", "name email role")
    return res.status(201).json({
      message: "Task created successfully",
      data: task,
    })
  } catch (error) {
    return handleTaskError(error, res, next)
  }
}

export const getTasks = async (req, res, next) => {
  const { status, priority, dueDate } = req.query
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid task status filter." })
  }
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ message: "Invalid task priority filter." })
  }

  const filter = { createdBy: req.user.userId }
  if (status) filter.status = status
  if (priority) filter.priority = priority

  if (dueDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !isValidDate(dueDate)) {
      return res.status(400).json({ message: "Invalid due date filter." })
    }
    const start = new Date(`${dueDate}T00:00:00.000Z`)
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 1)
    filter.dueDate = { $gte: start, $lt: end }
  }

  try {
    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
    return res.status(200).json({ count: tasks.length, data: tasks })
  } catch (error) {
    return handleTaskError(error, res, next)
  }
}

export const getTaskById = async (req, res, next) => {
  if (!hasValidId(req.params.id)) {
    return res.status(400).json({ message: "Invalid task ID." })
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
    }).populate("assignedTo", "name email role")

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }
    return res.status(200).json({ data: task })
  } catch (error) {
    return handleTaskError(error, res, next)
  }
}

export const updateTask = async (req, res, next) => {
  if (!hasValidId(req.params.id)) {
    return res.status(400).json({ message: "Invalid task ID." })
  }

  const updates = {}
  for (const field of allowedUpdateFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field]
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No editable task details were provided." })
  }
  if ("title" in updates && (typeof updates.title !== "string" || !updates.title.trim())) {
    return res.status(400).json({ message: "Task title cannot be empty." })
  }
  if ("status" in updates && !validStatuses.includes(updates.status)) {
    return res.status(400).json({ message: "Invalid task status." })
  }
  if ("priority" in updates && !validPriorities.includes(updates.priority)) {
    return res.status(400).json({ message: "Invalid task priority." })
  }
  if ("dueDate" in updates && !isValidDate(updates.dueDate)) {
    return res.status(400).json({ message: "Invalid due date." })
  }
  if ("title" in updates) updates.title = updates.title.trim()

  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      updates,
      { new: true, runValidators: true },
    ).populate("assignedTo", "name email")

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }
    return res.status(200).json({ message: "Task updated successfully", data: task })
  } catch (error) {
    return handleTaskError(error, res, next)
  }
}

export const updateTaskStatus = async (req, res, next) => {
  const { status } = req.body
  if (!hasValidId(req.params.id)) {
    return res.status(400).json({ message: "Invalid task ID." })
  }
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid task status." })
  }

  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      { status },
      { new: true, runValidators: true },
    )
    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }
    return res.status(200).json({ message: "Task status updated successfully", data: task })
  } catch (error) {
    return handleTaskError(error, res, next)
  }
}

export const deleteTask = async (req, res, next) => {
  if (!hasValidId(req.params.id)) {
    return res.status(400).json({ message: "Invalid task ID." })
  }

  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.userId,
    })
    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }
    return res.status(200).json({ message: "Task deleted successfully" })
  } catch (error) {
    return handleTaskError(error, res, next)
  }
}
