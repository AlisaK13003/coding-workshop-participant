import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useWorkspaceLocation } from './useWorkspaceLocation.js'

const PAGES = { dashboard: 'Dashboard', projects: 'Projects', workLogs: 'Work Logs' }

function renderAt(url) {
  const wrapper = ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  return renderHook(() => ({ ...useWorkspaceLocation('/admin', PAGES), url: useLocation() }), { wrapper })
}
const urlOf = (result) => `${result.current.url.pathname}${result.current.url.search}`

describe('useWorkspaceLocation', () => {
  it('reads the page and ids from the URL, defaulting to the first page', () => {
    expect(renderAt('/admin').result.current.page).toBe('Dashboard')
    expect(renderAt('/admin/nonsense').result.current.page).toBe('Dashboard')
    const { result } = renderAt('/admin/work-logs?project=5&user=x')
    expect(result.current.page).toBe('Work Logs')
    expect(result.current.ids).toEqual({ project: 5 })
  })

  it('starts a new page without ids, unless given', () => {
    const { result } = renderAt('/admin/projects?project=5')
    act(() => result.current.go({ page: 'Work Logs' }))
    expect(urlOf(result)).toBe('/admin/work-logs')
    act(() => result.current.go({ page: 'Projects', project: 7 }))
    expect(urlOf(result)).toBe('/admin/projects?project=7')
  })

  it('merges ids into the current page, and null removes one', () => {
    const { result } = renderAt('/admin/projects?user=3')
    act(() => result.current.go({ project: 5 }))
    expect(urlOf(result)).toBe('/admin/projects?user=3&project=5')
    act(() => result.current.go({ project: null }))
    expect(urlOf(result)).toBe('/admin/projects?user=3')
  })
})
