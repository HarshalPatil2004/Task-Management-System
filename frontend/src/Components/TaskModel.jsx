import { useState } from "react"

const getTodayDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const TaskModel = ({ task, onClose, onSave }) => {
  const [form, setForm] = useState(() => ({
    title: task?.title ?? "",
    status: task?.status ?? "To do",
    priority: task?.priority ?? "Medium",
    dueDate: task?.dueDate ?? getTodayDate(),
  }))
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setError("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSaving) return
    const title = form.title.trim()
    if (!title) {
      setError("Enter a task name.")
      return
    }

    setError("")
    setIsSaving(true)
    try {
      await onSave({ ...form, title })
    } catch (saveError) {
      setError(
        saveError instanceof TypeError
          ? "Cannot reach the task service. Check your connection and try again."
          : saveError.message || "Unable to save this task.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (!isSaving && event.target === event.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-model-title"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              {task ? "Update your task" : "Add to your list"}
            </p>
            <h2 id="task-model-title" className="mt-1 text-xl font-semibold">
              {task ? "Edit task" : "New task"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close form"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <label htmlFor="task-title" className="mt-6 block text-sm font-medium text-slate-700">
          Task
        </label>
        <input
          id="task-title"
          name="title"
          type="text"
          value={form.title}
          onChange={updateField}
          placeholder="What needs to get done?"
          required
          autoFocus
          disabled={isSaving}
          className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {error && <p className="mt-2 text-sm text-rose-600" role="alert">{error}</p>}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-status" className="block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="task-status"
              name="status"
              value={form.status}
              onChange={updateField}
              disabled={isSaving}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option>To do</option>
              <option>In progress</option>
              <option>Done</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-priority" className="block text-sm font-medium text-slate-700">
              Priority
            </label>
            <select
              id="task-priority"
              name="priority"
              value={form.priority}
              onChange={updateField}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>

        <label htmlFor="task-due-date" className="mt-4 block text-sm font-medium text-slate-700">
          Due date
        </label>
        <input
          id="task-due-date"
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={updateField}
          disabled={isSaving}
          required
          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : task ? "Save changes" : "Add task"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaskModel
