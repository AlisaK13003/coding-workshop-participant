// Activity log helpers. Entries come from the API as { id, created_at, actor: { id, name },
// actor_role, action, entity_type, entity_id, project, summary, changes }.
import { formatDateTime } from './format.js'
import { roleLabel } from './users.js'

/** Action filters: the API matches entries whose action starts with the value. */
export const ACTION_TYPES = [
  { value: 'project.', label: 'Project changes' },
  { value: 'milestone.', label: 'Milestone changes' },
  { value: 'review.', label: 'Reviews' },
  { value: 'member.', label: 'Assignments' },
  { value: 'work_log.', label: 'Work log entries' },
  { value: 'user.', label: 'User changes' },
]

const ACTION_LABELS = {
  'project.create': 'Created project',
  'project.update': 'Updated project',
  'project.complete': 'Completed project',
  'project.abandon': 'Abandoned project',
  'project.reopen': 'Reopened project',
  'project.archive': 'Archived project',
  'project.unarchive': 'Unarchived project',
  'member.add': 'Added project member',
  'member.assign': 'Changed milestone assignment',
  'member.remove': 'Removed project member',
  'milestone.create': 'Created milestone',
  'milestone.update': 'Updated milestone',
  'milestone.delete': 'Deleted milestone',
  'milestone.dependencies_update': 'Changed prerequisites',
  'milestone.complete': 'Completed milestone',
  'review.request': 'Requested review',
  'review.accept': 'Accepted review',
  'review.keep_open': 'Kept milestone open',
  'work_log.create': 'Entered historical workday',
  'work_log.correct': 'Corrected work log',
  'user.create': 'Created user',
  'user.update': 'Updated user',
  'user.archive': 'Archived user',
  'user.restore': 'Restored user',
  'user.password_reset': 'Reset password',
  'user.password_change': 'Changed password',
  'user.signup': 'Signed up',
}

/** An entry as a display-ready item for ActivityList. */
export function toActivityItem(entry) {
  return {
    id: entry.id,
    time: formatDateTime(entry.created_at),
    actor: entry.actor.name,
    role: roleLabel(entry.actor_role),
    action: ACTION_LABELS[entry.action] ?? entry.action,
    record: entry.project?.name ?? roleLabel(entry.entity_type.replace(/_/g, ' ')),
    summary: entry.summary,
  }
}
