import { formatCents, formatMoney } from '../../utils/format.js'
import { DataTable } from '../ui'

// Reusable columns. Each expects display-ready log fields (names, formatted dates).
const PRESET_COLUMNS = {
  date: {
    header: 'Work date',
    render: (log) => (
      <>
        <strong>{log.date}</strong>
        {log.note && <small className="table-note">{log.note}</small>}
      </>
    ),
  },
  employee: { header: 'Employee', render: (log) => log.employee },
  project: { header: 'Project', render: (log) => log.project },
  milestone: { header: 'Milestone', render: (log) => log.milestone },
  hours: { header: 'Hours', render: (log) => `${log.hours} h` },
  rate: { header: 'Historical rate', render: (log) => `${formatCents(log.rate)}/h` },
  cost: { header: 'Recorded cost', render: (log) => formatCents(log.cost) },
  laborCost: { header: 'Recorded labor cost', render: (log) => formatMoney(log.cost) },
  corrected: { header: 'Last correction', render: (log) => log.corrected },
  submitted: { header: 'Submitted', render: (log) => log.submittedAt },
}

function resolveColumn(column) {
  return typeof column === 'string'
    ? { key: column, ...PRESET_COLUMNS[column] }
    : column
}

/**
 * Work log table shared by every role.
 *
 * logs: display-ready rows, e.g. { id, date: 'Jun 13, 2025', note?, employee,
 *   project, milestone, hours, rate, cost, corrected, submittedAt }.
 * columns: preset names ('date', 'employee', 'project', 'milestone', 'hours',
 *   'rate', 'cost', 'laborCost', 'corrected', 'submitted') and/or custom
 *   column objects { key, header, render } (e.g. a trailing action button).
 */
export function WorkLogTable({ logs, columns, getRowKey = (log) => log.id }) {
  return (
    <DataTable
      columns={columns.map(resolveColumn)}
      rows={logs}
      getRowKey={getRowKey}
    />
  )
}
