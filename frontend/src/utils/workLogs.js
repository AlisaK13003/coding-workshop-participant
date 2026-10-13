// Turn id-based work logs into display rows for WorkLogTable.
import { findById } from './collections.js'
import { formatDate, fullName } from './format.js'

/**
 * logs: [{ id, date (ISO), employeeId?, projectId, milestoneId, ... }].
 * Lookups: employees ({ id, first, last }), projects and milestones ({ id, name }).
 * Unknown employees show as "Employee".
 */
export function toWorkLogRows(logs, { employees = [], projects = [], milestones = [] }) {
  return logs.map((log) => {
    const employee = findById(employees, log.employeeId)
    return {
      ...log,
      date: formatDate(log.date),
      employee: employee ? fullName(employee) : 'Employee',
      project: findById(projects, log.projectId)?.name,
      milestone: findById(milestones, log.milestoneId)?.name,
    }
  })
}
