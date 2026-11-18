import { useState } from "react"

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Login = ({ onLoginSuccess, onRegister, initialEmail = "", registrationMessage = "", sessionError = "" }) => {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isLoading) return

    const normalizedEmail = email.trim()
    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.")
      return
    }

    if (!password) {
      setError("Enter your password.")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail, password }),
      })

      if (response.status === 401) {
        setError("Email or password is incorrect.")
        return
      }
      if (response.status === 423) {
        setError("This account is locked. Contact your administrator for help.")
        return
      }

      let responseData = {}
      if (response.headers.get("content-type")?.includes("application/json")) {
        try {
          const body = await response.json()
          responseData = body && typeof body === "object" ? body : {}
        } catch (error) {
          if (error instanceof SyntaxError) {
            setError("The login service returned an invalid response.")
            return
          }
          throw error
        }
      }

      const errorCode = String(responseData.code ?? responseData.error ?? "").toUpperCase()
      const errorMessage = String(responseData.message ?? "")
      if (
        responseData.locked === true ||
        errorCode === "ACCOUNT_LOCKED" ||
        errorCode === "LOCKED" ||
        /account.*locked|locked.*account/i.test(errorMessage)
      ) {
        setError("This account is locked. Contact your administrator for help.")
        return
      }
      if (!response.ok) {
        setError(responseData.message || "Unable to sign in. Please try again.")
        return
      }

      const profile =
        responseData.user ??
        responseData.profile ??
        responseData.data?.user ??
        responseData.data ??
        responseData
      const userId = profile.userId ?? profile.id ?? responseData.userId
      const role = profile.role ?? responseData.role

      if (!profile || userId == null || !role) {
        setError("The login response is missing your user ID or role.")
        return
      }

      onLoginSuccess({ ...profile, userId, role })
    } catch (error) {
      if (error instanceof TypeError) {
        setError("Cannot reach the login service. Check your connection and try again.")
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-81px)] items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-2">
        <section className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 to-indigo-800 p-10 text-white lg:flex">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[40px] border-white/10" aria-hidden="true" />
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full border-[40px] border-white/10" aria-hidden="true" />
          <div className="relative">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 6h11M9 12h11M9 18h11" />
                <path d="m3.5 6 .8.8L6 5M3.5 12l.8.8L6 11M3.5 18l.8.8L6 17" />
              </svg>
            </div>
            <p className="mt-8 text-sm font-medium uppercase tracking-[0.18em] text-blue-100">
              TaskiFy
            </p>
            <h1 className="mt-3 max-w-sm text-4xl font-semibold leading-tight">
              Make room for the work that matters.
            </h1>
            <p className="mt-4 max-w-sm leading-7 text-blue-100">
              Sign in to pick up where you left off and keep your projects moving.
            </p>
          </div>
          <div className="relative rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm font-medium text-blue-50">A little progress adds up.</p>
            <div className="mt-4 space-y-3">
              {["Choose your next task", "Focus on one thing", "Celebrate the finish"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-blue-100">
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-white/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-sm">
            <p className="text-sm font-semibold text-blue-600">WELCOME BACK</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Sign in to TaskiFy
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter your account details to continue to your workspace.
            </p>

            {registrationMessage && (
              <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
                {registrationMessage}
              </p>
            )}
            {sessionError && (
              <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700" role="alert">
                {sessionError}
              </p>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                </div>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                )}
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              New to TaskiFy?{" "}
              <button type="button" onClick={onRegister} className="font-semibold text-blue-600 hover:text-blue-700">
                Create an account
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login
