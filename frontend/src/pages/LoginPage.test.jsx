import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearSession, getSession } from '../services/session.js'
import { json, mockFetch } from '../test/fetchMock.js'
import LoginPage from './LoginPage.jsx'

const setup = { method: 'GET', path: '/api/auth/setup', respond: () => json(200, { signup_open: false }), repeat: true }

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/manager" element={<p>Manager workspace</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

afterEach(() => {
  clearSession()
  vi.unstubAllGlobals()
})

describe('LoginPage', () => {
  it('asks for both fields before sending anything', async () => {
    const calls = mockFetch([setup])
    const user = renderLogin()
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText('Enter your username.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    expect(calls.filter((call) => call.path === '/api/auth/login')).toHaveLength(0)
  })

  it('shows the server’s message when the sign-in is refused', async () => {
    mockFetch([
      setup,
      {
        method: 'POST',
        path: '/api/auth/login',
        respond: () => json(401, { error: { code: 'invalid_credentials', message: 'Incorrect username or password.' } }),
      },
    ])
    const user = renderLogin()
    await user.type(screen.getByLabelText('Username'), 'mmanager2')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Incorrect username or password.')).toBeInTheDocument()
  })

  it('signs in and opens the workspace for the user’s role', async () => {
    const calls = mockFetch([
      setup,
      {
        method: 'POST',
        path: '/api/auth/login',
        respond: () =>
          json(200, { user: { id: 2, role: 'manager', first_name: 'Morgan' }, access_token: 'a', refresh_token: 'r' }),
      },
    ])
    const user = renderLogin()
    await user.type(screen.getByLabelText('Username'), '  mmanager2 ')
    await user.type(screen.getByLabelText('Password'), 'Password123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Manager workspace')).toBeInTheDocument()
    expect(calls.find((call) => call.path === '/api/auth/login').body).toEqual({ username: 'mmanager2', password: 'Password123!' })
    expect(getSession().user.role).toBe('manager')
  })
})
