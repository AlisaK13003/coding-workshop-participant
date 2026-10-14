import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActionMenu } from './ActionMenu.jsx'

function renderMenu(onAbandon = vi.fn()) {
  render(
    <>
      <ActionMenu
        items={[
          { label: 'Mark completed', disabled: true, title: 'All milestones must be complete first', onClick: vi.fn() },
          { label: 'Mark abandoned', onClick: onAbandon },
          false, // e.g. `canArchive && { … }` when it can't
        ]}
      />
      <p>Elsewhere</p>
    </>,
  )
  return userEvent.setup()
}

describe('ActionMenu', () => {
  it('opens on click and stays open (it used to vanish when the mouse left)', async () => {
    const user = renderMenu()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.unhover(screen.getByRole('button', { name: 'More actions' }))
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Mark completed', 'Mark abandoned'])
  })

  it('explains disabled items and runs the chosen one, then closes', async () => {
    const onAbandon = vi.fn()
    const user = renderMenu(onAbandon)
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    expect(screen.getByRole('menuitem', { name: 'Mark completed' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Mark completed' })).toHaveAttribute('title', 'All milestones must be complete first')
    await user.click(screen.getByRole('menuitem', { name: 'Mark abandoned' }))
    expect(onAbandon).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on Escape and on a click elsewhere', async () => {
    const user = renderMenu()
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByText('Elsewhere'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('renders nothing when every item is hidden', () => {
    const { container } = render(<ActionMenu items={[false, null]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
