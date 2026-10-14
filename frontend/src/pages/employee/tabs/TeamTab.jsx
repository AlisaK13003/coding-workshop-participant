import { Avatar, Badge, Panel } from '../../../components/ui'
import { useCurrentUser } from '../../../hooks/useSession.js'
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

/** The project manager and every current member. members from the project's members list. */
export function TeamTab({ project, members }) {
  const user = useCurrentUser()
  return (
    <Panel title="Project team" description="People currently on this project.">
      <div className="team-grid">
        {project.manager && (
          <TeamPerson
            name={project.manager.name}
            title="Manages this project"
            badge={<Badge tone="Manager">Project manager</Badge>}
            isManager
          />
        )}
        {members.map((member) => (
          <TeamPerson
            key={member.id}
            name={member.user.name}
            title={`${member.user.job_title} · ${member.milestone?.name ?? 'No milestone'}`}
            badge={member.user.id === user.id && <Badge>You</Badge>}
          />
        ))}
      </div>
    </Panel>
  )
}
