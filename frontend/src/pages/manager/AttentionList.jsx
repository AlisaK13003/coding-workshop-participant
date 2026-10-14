import { ChevronRight } from 'lucide-react'
import { Avatar, Badge } from '../../components/ui'
import { findById } from '../../utils/collections.js'
import './AttentionList.css'

/** Members waiting or without a milestone; each row opens the project. items from getAssignmentAttention. */
export function AttentionList({ items, projects, onOpenProject }) {
  return (
    <div className="attention-list">
      {items.map(({ member, state }) => (
        <button key={`${member.project_id}-${member.id}`} onClick={() => onOpenProject(member.project_id)}>
          <Avatar name={member.user.name} size="sm" />
          <p>
            <strong>{member.user.name}</strong>
            <span>
              {findById(projects, member.project_id)?.name} · {member.milestone?.name ?? 'No milestone'}
            </span>
          </p>
          <Badge tone="Amber">{state}</Badge>
          <ChevronRight size={16} />
        </button>
      ))}
    </div>
  )
}
