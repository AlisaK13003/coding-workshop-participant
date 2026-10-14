import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession.js'
import { HOME_BY_ROLE, getSetupStatus, login } from '../services/authApi.js'
import './LoginPage.css'

/** Welcome page with the sign-in form. */
export default function LoginPage() {
  const navigate = useNavigate()
  const session = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)

  useEffect(() => {
    getSetupStatus()
      .then((status) => setSignupOpen(status.signup_open))
      .catch(() => setSignupOpen(false))
  }, [])

  if (session) return <Navigate to={HOME_BY_ROLE[session.user.role] ?? '/'} replace />

  /** Validate the fields, then sign in. */
  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (!username.trim()) nextErrors.username = 'Enter your username.'
    if (!password) nextErrors.password = 'Enter your password.'

    setErrors(nextErrors)
    setMessage('')

    if (nextErrors.username || nextErrors.password) {
      const firstInvalidField = nextErrors.username ? 'username' : 'password'
      event.currentTarget.elements.namedItem(firstInvalidField).focus()
      return
    }

    setSubmitting(true)
    try {
      const user = await login(username.trim(), password)
      navigate(HOME_BY_ROLE[user.role])
    } catch (error) {
      setMessage(error.message)
      setSubmitting(false)
    }
  }

  return (
    <main className="welcome-page">
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <span className="welcome-accent" aria-hidden="true" />
        <h1 id="welcome-title">Project Tracker</h1>
        <p>Manage projects, milestones, and your team’s time.</p>
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setErrors((previous) => ({ ...previous, username: '' }))
                setMessage('')
              }}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'username-error' : undefined}
            />
            {errors.username && (
              <p id="username-error" className="field-error" role="alert">
                {errors.username}
              </p>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setErrors((previous) => ({ ...previous, password: '' }))
                setMessage('')
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="field-error" role="alert">
                {errors.password}
              </p>
            )}
          </div>
          <button className="sign-in-button" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="login-message" role="status">{message}</p>
        </form>
        {signupOpen && (
          <p className="login-hint">
            Setting up for the first time? <Link to="/signup">Create the admin account</Link>.
          </p>
        )}
        {import.meta.env.DEV && (
          <p className="login-hint">
            Local sample accounts: aadmin1, mmanager2, eemployee3 (password Password123!).
          </p>
        )}
      </section>
    </main>
  )
}
