import { formatCents, formatMoney } from '../../utils/format.js'
import { toWorkLogRow } from '../../utils/workLogs.js'
import { DataTable, EmptyState, PagedList } from '../ui'

// Reusable columns. Each reads a display row made by toWorkLogRow.
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
  // A manager sees other managers' employees on their projects, but not their pay.
  laborCost: {
    header: 'Recorded labor cost',
    render: (log) =>
      log.cost == null ? <span title="Pay is shown only to this person’s own manager and admins">—</span> : formatMoney(log.cost),
  },
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
 * logs: work logs from the API.
 * columns: preset names ('date', 'employee', 'project', 'milestone', 'hours',
 *   'rate', 'cost', 'laborCost', 'submitted') and/or custom column objects
 *   { key, header, render(row) } (e.g. a trailing action button).
 * pageSize: rows per page. Pages with filters give the table a `key` that changes with
 *   them, so a new result starts again on page 1.
 */
export function WorkLogTable({ logs, columns, emptyBody = 'No work logs match these filters.', pageSize = 10 }) {
  if (!logs.length) {
    return <EmptyState title="No work logs" body={emptyBody} />
  }
  return (
    <PagedList items={logs} pageSize={pageSize}>
      {(pageLogs) => (
        <DataTable
          columns={columns.map(resolveColumn)}
          rows={pageLogs.map(toWorkLogRow)}
          getRowKey={(log) => log.id}
        />
      )}
    </PagedList>
  )
}
