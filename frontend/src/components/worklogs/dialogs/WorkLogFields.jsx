import { useState } from 'react'
import { Field, Input, Select } from '../../ui'
import { useApiQuery } from '../../../hooks/useApiQuery.js'
import { listMilestones } from '../../../services/milestonesApi.js'
import { listProjects } from '../../../services/projectsApi.js'
import { todayIso } from '../../../utils/calendar.js'

/**
 * Project, milestone and work date fields shared by the admin's "add" and
 * "correct" work log dialogs. The milestone list follows the chosen project.
 * log (optional) pre-fills the fields; errors are the server's field errors.
 */
export function WorkLogFields({ log, defaultProjectId, errors }) {
  const [projectId, setProjectId] = useState(String(log?.project.id ?? defaultProjectId ?? ''))
  const projects = useApiQuery(() => listProjects(), [])
  const milestones = useApiQuery(() => (projectId ? listMilestones(Number(projectId)) : []), [projectId])

  return (
    <>
      <Field label="Work date" hint="A past or current weekday." error={errors.work_date}>
        <Input name="work_date" type="date" max={todayIso()} defaultValue={log?.work_date} required />
      </Field>
      <Field label="Project" error={errors.project_id}>
        <Select name="project_id" value={projectId} onChange={setProjectId} required>
          <option value="">{projects.data ? 'Choose project' : 'Loading projects…'}</option>
          {(projects.data ?? []).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Milestone" error={errors.milestone_id}>
        <Select
          name="milestone_id"
          key={`${projectId}-${Boolean(milestones.data)}`}
          defaultValue={String(log?.project.id) === projectId ? log?.milestone.id : ''}
          required
        >
          <option value="">{projectId ? 'Choose milestone' : 'Choose a project first'}</option>
          {(milestones.data ?? []).map((milestone) => (
            <option key={milestone.id} value={milestone.id}>
              {milestone.name}
            </option>
          ))}
        </Select>
      </Field>
    </>
  )
}
