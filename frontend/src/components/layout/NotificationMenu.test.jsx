import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NotificationMenu } from './NotificationMenu.jsx'

const NOTICE = { id: 1, title: 'Review accepted by an admin', detail: 'Priya accepted it on your behalf.', read: false }

describe('NotificationMenu', () => {
  it('shows the unread count and lists notifications; choosing one closes the menu', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<NotificationMenu items={[NOTICE]} onSelect={onSelect} onMarkAllRead={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '1 unread notifications' }))
    await user.click(screen.getByRole('button', { name: /Review accepted by an admin/ }))
    expect(onSelect).toHaveBeenCalledWith(NOTICE)
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
  })

  it('disables "Mark all read" when nothing is unread', async () => {
    const user = userEvent.setup()
    render(<NotificationMenu items={[]} onMarkAllRead={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '0 unread notifications' }))
    expect(screen.getByRole('button', { name: 'Mark all read' })).toBeDisabled()
    expect(screen.getByText('You’re all caught up.')).toBeInTheDocument()
  })
})
