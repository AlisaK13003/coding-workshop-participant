import { Avatar, Badge, Panel } from '../../../components/ui'
import { signedInEmployee, teammates } from '../../../data/employeeData.js'
import { findById } from '../../../utils/collections.js'
import { cx } from '../../../utils/cx.js'
import './TeamTab.css'

function TeamPerson({ name, title, badge, isManager = false }) {
  return (
    <div className={cx('team-person', isManager && 'manager')}>
      <Avatar name={name} />
      <p>
        <strong>{name}</strong>
        <span>{title}</span>
      </p>
      {badge}
    </div>
  )
}

/** The project manager and everyone assigned to the project. */
export function TeamTab({ project }) {
  const members = project.employeeIds
    .map((id) => findById(teammates, id))
    .filter(Boolean)
  return (
    <Panel title="Project team" description="People assigned to this active project.">
      <div className="team-grid">
        <TeamPerson
          name={project.manager}
          title="Engineering Manager"
          badge={<Badge tone="Manager">Project manager</Badge>}
          isManager
        />
        {members.map((person) => (
          <TeamPerson
            key={person.id}
            name={person.name}
            title={person.title}
            badge={person.id === signedInEmployee.id && <Badge>You</Badge>}
          />
        ))}
      </div>
    </Panel>
  )
}
