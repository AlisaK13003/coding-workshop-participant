// Runs before every test file: adds DOM matchers (toBeDisabled, toBeInTheDocument, …) and
// resets the page and browser storage between tests.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
