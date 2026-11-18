import { useState } from "react"

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Register = ({ onRegistered, onExistingAccount, onGoToLogin }) => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isLoading) return

    const normalizedEmail = email.trim().toLowerCase()
    if (!name.trim()) {
      setError("Enter your name.")
      return
    }
    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setError("")
    setIsLoading(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password }),
      })
      const responseData = await response.json()

      if (response.status === 409) {
        onExistingAccount(normalizedEmail)
        return
      }
      if (!response.ok) {
        setError(responseData.message || "Unable to create your account. Please try again.")
        return
      }

      onRegistered(normalizedEmail)
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Cannot reach the registration service. Check your connection and try again."
          : "The registration service returned an invalid response.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10">
        <p className="text-sm font-semibold text-blue-600">TASKIFY</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Register to create a private workspace for your tasks.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="register-name" className="block text-sm font-medium text-slate-700">Name</label>
            <input
              id="register-name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              disabled={isLoading}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-slate-700">Email address</label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isLoading}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-slate-700">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              disabled={isLoading}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label htmlFor="register-confirm-password" className="block text-sm font-medium text-slate-700">Confirm password</label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={isLoading}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
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
            className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{" "}
          <button type="button" onClick={onGoToLogin} className="font-semibold text-blue-600 hover:text-blue-700">
            Sign in
          </button>
        </p>
      </section>
    </main>
  )
}

export default Register
