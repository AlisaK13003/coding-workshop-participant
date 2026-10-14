import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession.js'
import { HOME_BY_ROLE, getSetupStatus, signup } from '../services/authApi.js'
import './LoginPage.css'

const FIELDS = [
  { name: 'first_name', label: 'First name', autoComplete: 'given-name' },
  { name: 'last_name', label: 'Last name', autoComplete: 'family-name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'job_title', label: 'Job title', autoComplete: 'organization-title' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  { name: 'confirm_password', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
]

/** Validates the form in the browser before sending; the server checks again. */
function validate(values) {
  const errors = {}
  FIELDS.forEach(({ name, label }) => {
    if (!values[name]?.trim()) errors[name] = `Enter your ${label.toLowerCase()}.`
  })
  if (values.password && values.password.length < 8) errors.password = 'Use at least 8 characters.'
  if (values.confirm_password && values.confirm_password !== values.password) {
    errors.confirm_password = "Passwords don't match."
  }
  return errors
}

/** Creates the first admin account. Only works while no accounts exist. */
export default function SignupPage() {
  const navigate = useNavigate()
  const session = useSession()
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signupOpen, setSignupOpen] = useState(null)

  useEffect(() => {
    getSetupStatus()
      .then((status) => setSignupOpen(status.signup_open))
      .catch((error) => setMessage(error.message))
  }, [])

  if (session) return <Navigate to={HOME_BY_ROLE[session.user.role] ?? '/'} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setMessage('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      const { confirm_password: _confirm, ...details } = values
      const user = await signup(details)
      navigate(HOME_BY_ROLE[user.role])
    } catch (error) {
      setErrors(error.fields ?? {})
      setMessage(error.message)
      setSubmitting(false)
    }
  }

  function update(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
  }

  return (
    <main className="welcome-page">
      <section className="welcome-panel" aria-labelledby="signup-title">
        <span className="welcome-accent" aria-hidden="true" />
        <h1 id="signup-title">Set up Project Tracker</h1>
        {signupOpen === false ? (
          <p>
            This workspace is already set up. Ask an admin for an account, or{' '}
            <Link to="/">sign in</Link>.
          </p>
        ) : (
          <>
            <p>Create the first admin account for your business.</p>
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {FIELDS.map(({ name, label, type = 'text', autoComplete }) => (
                <div className="form-field" key={name}>
                  <label htmlFor={name}>{label}</label>
                  <input
                    id={name}
                    name={name}
                    type={type}
                    autoComplete={autoComplete}
                    required
                    value={values[name] ?? ''}
                    onChange={(event) => update(name, event.target.value)}
                    aria-invalid={Boolean(errors[name])}
                    aria-describedby={errors[name] ? `${name}-error` : undefined}
                  />
                  {errors[name] && (
                    <p id={`${name}-error`} className="field-error" role="alert">
                      {errors[name]}
                    </p>
                  )}
                </div>
              ))}
              <button className="sign-in-button" type="submit" disabled={submitting || signupOpen === null}>
                {submitting ? 'Creating account…' : 'Create admin account'}
              </button>
              <p className="login-message" role="status">{message}</p>
            </form>
            <p className="login-hint">
              Already have an account? <Link to="/">Sign in</Link>.
            </p>
          </>
        )}
      </section>
    </main>
  )
}
