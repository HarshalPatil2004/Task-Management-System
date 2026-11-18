import { useEffect, useState } from "react"
import Navbar from "./Components/Navbar"
import Home from "./Components/Home"
import Login from "./Pages/Login"
import Register from "./Pages/Register"
import "./App.css"

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")

function App() {
  const [userProfile, setUserProfile] = useState(null)
  const [authPage, setAuthPage] = useState("login")
  const [authChecking, setAuthChecking] = useState(true)
  const [authError, setAuthError] = useState("")
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [registrationMessage, setRegistrationMessage] = useState("")

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
          credentials: "include",
        })
        if (response.status === 401) return
        if (!response.ok) throw new Error("Unable to verify your session.")

        const body = await response.json()
        if (!body.user?.userId || !body.user?.role) {
          throw new Error("The session service returned an invalid profile.")
        }
        if (active) setUserProfile(body.user)
      } catch {
        if (active) {
          setAuthError("Unable to verify your saved session. Please sign in.")
        }
      } finally {
        if (active) setAuthChecking(false)
      }
    }

    restoreSession()
    return () => {
      active = false
    }
  }, [])

  const handleLoginSuccess = (profile) => {
    setUserProfile(profile)
    setAuthError("")
    setRegistrationMessage("")
  }

  const handleRegistered = (email) => {
    setRegisteredEmail(email)
    setRegistrationMessage("Account created. Sign in to continue.")
    setAuthError("")
    setAuthPage("login")
  }

  const handleExistingAccount = (email) => {
    setRegisteredEmail(email)
    setRegistrationMessage("This email already has an account. Sign in with your existing password.")
    setAuthError("")
    setAuthPage("login")
  }

  const handleLogout = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
      if (!response.ok) throw new Error("Unable to sign out.")
      setUserProfile(null)
      setAuthPage("login")
      setAuthError("")
    } catch {
      setAuthError("Unable to sign out. Please try again.")
    }
  }

  const handleSessionExpired = () => {
    setUserProfile(null)
    setAuthPage("login")
    setAuthError("Your session expired. Please sign in again.")
  }

  if (authChecking) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Checking your session...
      </main>
    )
  }

  if (!userProfile) {
    return authPage === "register" ? (
      <Register
        onRegistered={handleRegistered}
        onExistingAccount={handleExistingAccount}
        onGoToLogin={() => {
          setAuthPage("login")
          setRegistrationMessage("")
        }}
      />
    ) : (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onRegister={() => {
          setAuthPage("register")
          setRegistrationMessage("")
        }}
        initialEmail={registeredEmail}
        registrationMessage={registrationMessage}
        sessionError={authError}
      />
    )
  }

  return (
    <>
      <Navbar user={userProfile} onLogout={handleLogout} />
      <Home user={userProfile} onSessionExpired={handleSessionExpired} />
    </>
  )
}

export default App
