import { Input, Select } from '../ui'

/**
 * The date range and dropdowns above a work log table.
 * filters / setFilter: from useFilters, with `from` and `to` dates plus one value per select.
 * selects: [{ name, label, allLabel, options: [{ id, name }] }] in display order.
 */
export function WorkLogFilters({ filters, setFilter, selects }) {
  return (
    <div className="filters">
      <Input
        type="date"
        value={filters.from}
        onChange={(event) => setFilter('from')(event.target.value)}
        aria-label="From date"
      />
      <Input
        type="date"
        value={filters.to}
        onChange={(event) => setFilter('to')(event.target.value)}
        aria-label="To date"
      />
      {selects.map(({ name, label, allLabel, options }) => (
        <Select key={name} value={filters[name]} onChange={setFilter(name)} aria-label={label}>
          <option value="">{allLabel}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </Select>
      ))}
    </div>
  )
}
