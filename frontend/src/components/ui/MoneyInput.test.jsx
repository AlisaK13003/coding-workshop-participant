import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MoneyInput } from './MoneyInput.jsx'

describe('MoneyInput', () => {
  it('calls onEdit when the amount is typed or stepped', () => {
    const onEdit = vi.fn()
    render(<MoneyInput name="budget" defaultValue={100} step={50} onEdit={onEdit} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '200' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add $50' }))
    fireEvent.click(screen.getByRole('button', { name: 'Subtract $50' }))

    expect(onEdit).toHaveBeenCalledTimes(3)
    expect(screen.getByRole('textbox')).toHaveValue('200')
  })
})
