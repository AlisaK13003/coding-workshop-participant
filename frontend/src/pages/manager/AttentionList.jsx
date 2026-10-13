import { ChevronRight } from 'lucide-react'
import { Avatar, Badge } from '../../components/ui'
import { fullName } from '../../utils/format.js'
import { getProjectName } from './managerSelectors.js'
import './AttentionList.css'

/** Employees waiting or without a milestone; each row opens the project. items from getAssignmentAttention. */
export function AttentionList({ items, projects, onOpenProject }) {
  return (
    <div className="attention-list">
      {items.map((item) => (
        <button
          key={`${item.employee.id}-${item.projectId}`}
          onClick={() => onOpenProject(item.projectId)}
        >
          <Avatar name={fullName(item.employee)} size="sm" />
          <p>
            <strong>{fullName(item.employee)}</strong>
            <span>
              {getProjectName(projects, item.projectId)} · {item.label}
            </span>
          </p>
          <Badge tone="Amber">{item.state}</Badge>
          <ChevronRight size={16} />
        </button>
      ))}
    </div>
  )
}
