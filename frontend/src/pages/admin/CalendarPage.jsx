import { useState } from 'react'
import { ProjectCalendar } from '../../components/calendar/ProjectCalendar.jsx'
import { Select } from '../../components/ui'
import { isOpenProject } from '../../utils/projects.js'

const ALL = ''
const NO_MANAGER = 'none'

/** Every open project's deadline (the shared calendar), filterable by manager. */
export function CalendarPage({ projects, onOpenProject }) {
  const [managerId, setManagerId] = useState(ALL)
  const open = projects.filter(isOpenProject)
  const managers = [...new Map(open.filter((p) => p.manager).map((p) => [p.manager.id, p.manager])).values()]
    .sort((a, b) => a.name.localeCompare(b.name))

  const visible = open.filter((project) => {
    if (managerId === ALL) return true
    if (managerId === NO_MANAGER) return !project.manager
    return project.manager?.id === Number(managerId)
  })

  return (
    <ProjectCalendar
      projects={visible}
      onOpenProject={onOpenProject}
      filters={
        <Select value={managerId} onChange={setManagerId} aria-label="Manager">
          <option value={ALL}>All managers</option>
          {managers.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.name}
            </option>
          ))}
          <option value={NO_MANAGER}>No manager</option>
        </Select>
      }
    />
  )
}
