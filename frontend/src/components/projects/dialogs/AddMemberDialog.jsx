import { Plus } from 'lucide-react'
import { Avatar, EmptyState, Modal, QueryContent } from '../../ui'
import { combineQueries, useApiQuery } from '../../../hooks/useApiQuery.js'
import { useMutation } from '../../../hooks/useMutation.js'
import { addMember, listMembers } from '../../../services/projectsApi.js'
import { listUsers } from '../../../services/usersApi.js'
import './AddMemberDialog.css'

/**
 * Pick an employee who isn't on the project yet. The API decides who is eligible:
 * admins see every active employee, managers only their own reports.
 */
export function AddMemberDialog({ project, onClose }) {
  const query = combineQueries(
    useApiQuery(() => listUsers({ role: 'employee' }), []),
    useApiQuery(() => listMembers(project.id), [project.id]),
  )
  const add = useMutation((employee) => addMember(project.id, employee.id), {
    success: (_, employee) => `${employee.name} added. Assign a milestone when ready.`,
    onSuccess: onClose,
  })

  return (
    <Modal
      title="Add employee"
      description="Employees can belong to several projects. Managers can add only their own employees."
      onClose={onClose}
    >
      <QueryContent query={query} loadingLabel="Loading employees…">
        {([users, members]) => {
          const eligible = users.filter(
            (user) =>
              user.role === 'employee' &&
              !user.archived_at &&
              !members.some((member) => member.user.id === user.id),
          )
          return eligible.length ? (
            <div className="employee-picker">
              {eligible.map((employee) => (
                <button key={employee.id} onClick={() => add.run(employee)} disabled={add.submitting}>
                  <Avatar name={employee.name} size="sm" />
                  <p>
                    <strong>{employee.name}</strong>
                    <span>{employee.job_title}</span>
                  </p>
                  <Plus size={17} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Everyone is already on this project"
              body="Every eligible employee is already a member."
            />
          )
        }}
      </QueryContent>
    </Modal>
  )
}
