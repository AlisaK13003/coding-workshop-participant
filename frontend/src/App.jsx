import { useState } from 'react';
import './App.css';

/** Display the welcome page and a login form awaiting backend integration. */
function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  /** Validate the fields without sending credentials or signing anyone in. */
  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    if (!username.trim()) nextErrors.username = 'Enter your username.';
    if (!password) nextErrors.password = 'Enter your password.';

    setErrors(nextErrors);
    setMessage('');

    if (nextErrors.username || nextErrors.password) {
      const firstInvalidField = nextErrors.username ? 'username' : 'password';
      event.currentTarget.elements.namedItem(firstInvalidField).focus();
      return;
    }

    setMessage('Account verification is not connected yet. You have not been signed in.');
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
                setUsername(event.target.value);
                setErrors((previous) => ({ ...previous, username: '' }));
                setMessage('');
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
                setPassword(event.target.value);
                setErrors((previous) => ({ ...previous, password: '' }));
                setMessage('');
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
      </section>
    </main>
  );
}

export default App;
