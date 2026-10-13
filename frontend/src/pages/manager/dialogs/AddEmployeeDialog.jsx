import { Plus } from 'lucide-react'
import { Avatar, EmptyState, Modal } from '../../../components/ui'
import { fullName } from '../../../utils/format.js'
import './AddEmployeeDialog.css'

/** Pick a direct report who is not on the project yet. onAdd receives the employee id. */
export function AddEmployeeDialog({ project, employees, onClose, onAdd }) {
  const eligible = employees.filter(
    (employee) => !project.employeeIds.includes(employee.id),
  )
  return (
    <Modal
      title="Add employee"
      description="Only employees who report to you are eligible. Employees may belong to multiple projects."
      onClose={onClose}
    >
      {eligible.length ? (
        <div className="employee-picker">
          {eligible.map((employee) => (
            <button key={employee.id} onClick={() => onAdd(employee.id)}>
              <Avatar name={fullName(employee)} size="sm" />
              <p>
                <strong>{fullName(employee)}</strong>
                <span>{employee.title}</span>
              </p>
              <Plus size={17} />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="All employees are assigned"
          body="Every direct report is already assigned to this project."
        />
      )}
    </Modal>
  )
}
