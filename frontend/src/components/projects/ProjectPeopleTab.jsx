import { Plus } from 'lucide-react'
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Panel,
  PersonCell,
  QueryContent,
  Select,
} from '../ui'
import { DIALOGS } from '../workspace/dialogKinds.js'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { useMutation } from '../../hooks/useMutation.js'
import { assignMember, listMembers } from '../../services/projectsApi.js'
import {
  getAssignmentState,
  getAssignmentTone,
  openMilestones,
} from '../../utils/milestones.js'

/**
 * The project's current members and their milestone. With canManage (an open
 * project the user manages) each member gets a milestone picker and Remove, and
 * the panel an "Add employee" button.
 */
export function ProjectPeopleTab({ project, milestones, canManage, onOpenDialog }) {
  const members = useApiQuery(() => listMembers(project.id), [project.id])
  const assign = useMutation(
    (member, milestoneId) => assignMember(project.id, member.id, milestoneId),
    {
      success: (_, member, milestoneId) =>
        milestoneId
          ? `${member.user.name}’s milestone assignment was updated.`
          : `${member.user.name} is now unassigned from a milestone.`,
    },
  )
  const choices = openMilestones(milestones)

  const columns = [
    { key: 'name', header: 'Employee', render: (member) => <PersonCell name={member.user.name} /> },
    { key: 'title', header: 'Job title', render: (member) => member.user.job_title },
    {
      key: 'milestone',
      header: 'Current milestone',
      render: (member) =>
        canManage ? (
          <Select
            className="inline-select"
            value={member.milestone?.id ?? ''}
            disabled={assign.submitting}
            onChange={(value) => assign.run(member, value ? Number(value) : null)}
            aria-label={`Milestone for ${member.user.name}`}
          >
            <option value="">Unassigned</option>
            {choices.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.name}
              </option>
            ))}
          </Select>
        ) : (
          member.milestone?.name ?? 'Unassigned'
        ),
    },
    {
      key: 'state',
      header: 'Work state',
      render: (member) => {
        const state = getAssignmentState(member.milestone)
        return <Badge tone={getAssignmentTone(state)}>{state}</Badge>
      },
    },
    canManage && {
      key: 'actions',
      header: '',
      render: (member) => (
        <Button variant="ghost" onClick={() => onOpenDialog(DIALOGS.removeMember, { project, member })}>
          Remove
        </Button>
      ),
    },
  ].filter(Boolean)

  return (
    <Panel
      title="Project people"
      description="One current milestone per employee in this project. Employees can only log work on an available milestone."
      actions={
        canManage && (
          <Button onClick={() => onOpenDialog(DIALOGS.addMember, { project })}>
            <Plus size={16} />
            Add employee
          </Button>
        )
      }
    >
      <QueryContent query={members} loadingLabel="Loading people…">
        {(rows) =>
          rows.length ? (
            <DataTable columns={columns} rows={rows} getRowKey={(member) => member.id} />
          ) : (
            <EmptyState title="No employees yet" body="Employees added to this project appear here." />
          )
        }
      </QueryContent>
    </Panel>
  )
}
