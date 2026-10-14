import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useFilters } from '../../hooks/useFilters.js'
import { WorkLogFilters } from './WorkLogFilters.jsx'

function Harness() {
  const { filters, setFilter } = useFilters({ from: '', to: '', project: '' })
  return (
    <>
      <WorkLogFilters
        filters={filters}
        setFilter={setFilter}
        selects={[{ name: 'project', label: 'Project', allLabel: 'All projects', options: [{ id: 1, name: 'Customer Portal' }] }]}
      />
      <output>{JSON.stringify(filters)}</output>
    </>
  )
}

describe('WorkLogFilters', () => {
  it('updates the filter values from the date range and dropdowns', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Project' }), 'Customer Portal')
    await user.type(screen.getByLabelText('From date'), '2026-10-01')
    expect(JSON.parse(screen.getByRole('status').textContent)).toEqual({ from: '2026-10-01', to: '', project: '1' })
  })
})
