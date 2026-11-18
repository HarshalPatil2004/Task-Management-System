import { useEffect, useState } from "react"
import TaskModel from "./TaskModel"

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")
const requestApi = async (path, options, onSessionExpired) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: "include",
  })
  if (response.status === 401) {
    onSessionExpired()
    throw new Error("Your session expired. Please sign in again.")
  }

  const contentType = response.headers.get("content-type") ?? ""
  const body = contentType.includes("application/json") ? await response.json() : {}
  if (!response.ok) {
    throw new Error(body.message || "The task service could not complete your request.")
  }
  return body
}

const getDateInDays = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDueDate = (dueDate) => {
  if (dueDate === getDateInDays(0)) return "Today"
  if (dueDate === getDateInDays(1)) return "Tomorrow"
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dueDate}T00:00:00`))
}

const statusFromApi = {
  PENDING: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Done",
}

const priorityFromApi = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
}

const statusToApi = {
  "To do": "PENDING",
  "In progress": "IN_PROGRESS",
  Done: "COMPLETED",
}

const mapApiTask = (task) => ({
  id: task._id,
  title: task.title,
  project: "Personal",
  dueDate: String(task.dueDate).slice(0, 10),
  priority: priorityFromApi[task.priority] ?? "Medium",
  status: statusFromApi[task.status] ?? "To do",
})

const iconContent = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
}

const Icon = ({ name, className = "h-5 w-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {iconContent[name]}
  </svg>
)

const statusStyles = {
  "To do": "bg-slate-100 text-slate-600",
  "In progress": "bg-blue-50 text-blue-700",
  Done: "bg-emerald-50 text-emerald-700",
}

const priorityStyles = {
  High: "bg-rose-50 text-rose-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
  Urgent: "bg-rose-100 text-rose-800",
}

const filters = ["All tasks", "To do", "In progress", "Done"]

const Home = ({ user, onSessionExpired }) => {
  const [tasks, setTasks] = useState([])
  const [activeFilter, setActiveFilter] = useState("All tasks")
  const [search, setSearch] = useState("")
  const [isTaskModelOpen, setIsTaskModelOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [error, setError] = useState("")
  const [deletingTaskId, setDeletingTaskId] = useState(null)

  useEffect(() => {
    let active = true
    const loadTasks = async () => {
      try {
        const body = await requestApi("/api/tasks", undefined, onSessionExpired)
        if (active) setTasks(body.data.map(mapApiTask))
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof TypeError
              ? "Cannot reach the task service. Check your connection and try again."
              : requestError.message,
          )
        }
      } finally {
        if (active) setIsLoadingTasks(false)
      }
    }

    loadTasks()
    return () => {
      active = false
    }
  }, [onSessionExpired])

  const completedCount = tasks.filter((task) => task.status === "Done").length
  const inProgressCount = tasks.filter((task) => task.status === "In progress").length
  const dueTodayCount = tasks.filter(
    (task) => task.dueDate === getDateInDays(0) && task.status !== "Done",
  ).length
  const completionPercent = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0
  const visibleTasks = tasks.filter((task) => {
    const matchesFilter = activeFilter === "All tasks" || task.status === activeFilter
    const matchesSearch = `${task.title} ${task.project}`
      .toLowerCase()
      .includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const saveTask = async (taskDetails) => {
    const isEditing = Boolean(selectedTask)
    const payload = {
      title: taskDetails.title,
      status: statusToApi[taskDetails.status],
      priority: taskDetails.priority.toUpperCase(),
      dueDate: taskDetails.dueDate,
    }
    const body = await requestApi(
      isEditing ? `/api/tasks/${selectedTask.id}` : "/api/tasks",
      {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      onSessionExpired,
    )
    const savedTask = mapApiTask(body.data)
    setTasks((currentTasks) =>
      isEditing
        ? currentTasks.map((task) => (task.id === savedTask.id ? savedTask : task))
        : [savedTask, ...currentTasks],
    )
    setError("")
    setIsTaskModelOpen(false)
    setSelectedTask(null)
  }

  const openNewTaskForm = () => {
    setSelectedTask(null)
    setIsTaskModelOpen(true)
  }

  const openEditTaskForm = (task) => {
    setSelectedTask(task)
    setIsTaskModelOpen(true)
  }

  const deleteTask = async (taskId) => {
    setDeletingTaskId(taskId)
    setError("")
    try {
      await requestApi(`/api/tasks/${taskId}`, { method: "DELETE" }, onSessionExpired)
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Cannot reach the task service. Check your connection and try again."
          : requestError.message,
      )
    } finally {
      setDeletingTaskId(null)
    }
  }

  const stats = [
    { label: "Total tasks", value: tasks.length, detail: "Across your workspace", icon: "grid", tone: "blue" },
    { label: "In progress", value: inProgressCount, detail: "Keep the momentum", icon: "clock", tone: "violet" },
    { label: "Completed", value: completedCount, detail: "Nice work so far", icon: "check", tone: "green" },
    { label: "Due today", value: dueTodayCount, detail: "On your plate today", icon: "calendar", tone: "orange" },
  ]

  const toneStyles = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
  }

  return (
    <main id="home" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Your workspace{user?.name || user?.email ? ` · ${user.name ?? user.email}` : ""}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Make today count.
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              A clear view of what matters, and what comes next.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewTaskForm}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:self-auto"
          >
            <Icon name="plus" className="h-4 w-4" />
            New task
          </button>
        </section>

        {error && (
          <p className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {error}
          </p>
        )}

        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-6 py-7 text-white shadow-lg shadow-blue-900/10 sm:px-9 sm:py-9">
          <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[36px] border-white/10" aria-hidden="true" />
          <div className="absolute -bottom-28 right-40 h-64 w-64 rounded-full border-[28px] border-white/10" aria-hidden="true" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-blue-50">
                YOUR FOCUS, AT A GLANCE
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                Big goals are just small tasks in a good order.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-blue-100">
                Keep your priorities close, make progress one step at a time,
                and celebrate what you finish.
              </p>
              <a
                href="#tasks"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-blue-100"
              >
                Go to my tasks <Icon name="arrow" className="h-4 w-4" />
              </a>
            </div>
            <div className="w-full max-w-xs rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-50">Your progress</p>
                  <p className="mt-1 text-xs text-blue-100">Tasks completed</p>
                </div>
                <span className="text-2xl font-semibold">{completionPercent}%</span>
              </div>
              <div
                className="mt-5 h-2 overflow-hidden rounded-full bg-blue-950/25"
                role="progressbar"
                aria-label="Task completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completionPercent}
              >
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-blue-100">
                <span>{completedCount} completed</span>
                <span>{tasks.length - completedCount} remaining</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Task summary">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">{stat.value}</p>
                </div>
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${toneStyles[stat.tone]}`}>
                  <Icon name={stat.icon} className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">{stat.detail}</p>
            </article>
          ))}
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section id="tasks" className="scroll-mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold">My tasks</h2>
                <p className="mt-1 text-sm text-slate-500">A little progress adds up.</p>
              </div>
              <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 px-3 text-slate-400 sm:max-w-56">
                <Icon name="search" className="h-4 w-4 shrink-0" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tasks"
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-100 pb-3">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    activeFilter === filter
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  {filter}
                  {filter === "All tasks" && (
                    <span className="ml-2 text-xs text-slate-400">{tasks.length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="divide-y divide-slate-100">
              {isLoadingTasks ? (
                <p className="py-12 text-center text-sm text-slate-500">Loading your tasks...</p>
              ) : visibleTasks.length > 0 ? (
                visibleTasks.map((task) => (
                  <article key={task.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {task.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span>{task.project}</span>
                        <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                        <span>{formatDueDate(task.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-8 sm:pl-0">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${priorityStyles[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[task.status]}`}>
                        {task.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditTaskForm(task)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        aria-label={`Edit ${task.title}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        disabled={deletingTaskId === task.id}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        aria-label={`Delete ${task.title}`}
                      >
                        {deletingTaskId === task.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-slate-700">No tasks found</p>
                  <p className="mt-1 text-sm text-slate-400">Try a different search or filter.</p>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            {/* <section id="projects" className="scroll-mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Projects</h2>
                  <p className="mt-1 text-xs text-slate-500">Keep the bigger picture in view.</p>
                </div>
                <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50" aria-label="More project options">
                  <Icon name="more" className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  { name: "Product launch", color: "bg-blue-500", progress: 68, count: "4 tasks" },
                  { name: "Website redesign", color: "bg-violet-500", progress: 42, count: "6 tasks" },
                  { name: "Team operations", color: "bg-amber-500", progress: 83, count: "3 tasks" },
                ].map((project) => (
                  <div key={project.name}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${project.color}`} />
                        <span className="truncate text-sm font-medium text-slate-700">{project.name}</span>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{project.count}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${project.color}`} style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <a href="#tasks" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
                View all projects <Icon name="arrow" className="h-4 w-4" />
              </a>
            </section> */}

            <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                <Icon name="calendar" className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-slate-800">One thing at a time.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose a task, give it your attention, and let the rest wait its turn.
              </p>
            </section>
          </aside>
        </div>
      </div>

      {isTaskModelOpen && (
        <TaskModel
          key={selectedTask?.id ?? "new"}
          task={selectedTask}
          onClose={() => {
            setIsTaskModelOpen(false)
            setSelectedTask(null)
          }}
          onSave={saveTask}
        />
      )}
    </main>
  )
}

export default Home
