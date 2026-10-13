import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_USERNAMES, demoSignIn } from '../services/demoAuth.js'
import './LoginPage.css'

const demoUsernameList = DEMO_USERNAMES.join(', ')

/** Welcome page with the sign-in form. Signs in through the temporary demo auth. */
export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  /** Validate the fields, then sign in with a demo account. */
  function handleSubmit(event) {
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

    const destination = demoSignIn(username, password)
    if (!destination) {
      setMessage(`Unknown username. Use one of the demo accounts: ${demoUsernameList}.`)
      return
    }
    navigate(destination)
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
          <button className="sign-in-button" type="submit">Sign in</button>
          <p className="login-message" role="status">{message}</p>
        </form>
        <p className="login-hint">
          Demo usernames: {demoUsernameList}. Any password works.
        </p>
      </section>
    </main>
  )
}
