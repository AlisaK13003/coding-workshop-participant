import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FolderKanban } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { StatCard } from './StatCard.jsx'

describe('StatCard', () => {
  it('is a plain card without onSelect', () => {
    render(<StatCard label="Active projects" value={4} note="note" icon={FolderKanban} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('is a toggle button with onSelect, marked when selected', async () => {
    const onSelect = vi.fn()
    render(<StatCard label="Pending reviews" value={2} note="note" icon={FolderKanban} selected onSelect={onSelect} />)
    const card = screen.getByRole('button', { name: /Pending reviews/ })
    expect(card).toHaveAttribute('aria-pressed', 'true')
    await userEvent.setup().click(card)
    expect(onSelect).toHaveBeenCalledOnce()
  })
})
