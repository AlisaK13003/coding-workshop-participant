// Milestone rules shared by every role: derived state, prerequisites and dependency layout.
// A milestone looks like { id, name, prerequisiteIds: number[], status }.

export const MILESTONE_STATUS = {
  blocked: 'Blocked',
  available: 'Available',
  review: 'Awaiting review',
  completed: 'Completed',
}

function byId(milestones, id) {
  return milestones.find((item) => item.id === id)
}

/**
 * Completed and Awaiting review are stored states. Otherwise a milestone is
 * Available only when every prerequisite is Completed, else Blocked.
 */
export function getMilestoneState(milestone, milestones) {
  if (
    milestone.status === MILESTONE_STATUS.completed ||
    milestone.status === MILESTONE_STATUS.review
  ) {
    return milestone.status
  }
  const unlocked = milestone.prerequisiteIds.every(
    (id) => byId(milestones, id)?.status === MILESTONE_STATUS.completed,
  )
  return unlocked ? MILESTONE_STATUS.available : MILESTONE_STATUS.blocked
}

export function countCompleted(milestones) {
  return milestones.filter((item) => item.status === MILESTONE_STATUS.completed)
    .length
}

/** "Design system, API integration", or "None" when there are no prerequisites. */
export function getPrerequisiteNames(milestone, milestones) {
  if (!milestone.prerequisiteIds.length) return 'None'
  return milestone.prerequisiteIds
    .map((id) => byId(milestones, id)?.name)
    .filter(Boolean)
    .join(', ')
}

/**
 * Group milestones into columns by dependency depth: roots first, then each
 * milestone one column after its deepest prerequisite. Milestones in the same
 * column can run in parallel. Prerequisites outside the list are ignored.
 */
export function getDependencyColumns(milestones) {
  const depths = new Map()
  const depthOf = (milestone, visiting = new Set()) => {
    if (depths.has(milestone.id)) return depths.get(milestone.id)
    if (visiting.has(milestone.id)) return 0
    visiting.add(milestone.id)
    const prerequisites = milestone.prerequisiteIds
      .map((id) => byId(milestones, id))
      .filter(Boolean)
    const depth = prerequisites.length
      ? 1 + Math.max(...prerequisites.map((item) => depthOf(item, visiting)))
      : 0
    depths.set(milestone.id, depth)
    return depth
  }
  const columns = []
  milestones.forEach((milestone) => {
    const depth = depthOf(milestone)
    columns[depth] = [...(columns[depth] || []), milestone]
  })
  return columns.filter(Boolean)
}

/**
 * True when candidateId depends on targetId, directly or indirectly. Use it to
 * hide prerequisite choices that would create a circular dependency.
 */
export function dependsOn(candidateId, targetId, milestones, visited = new Set()) {
  if (visited.has(candidateId)) return false
  visited.add(candidateId)
  const candidate = byId(milestones, candidateId)
  if (!candidate) return false
  return (
    candidate.prerequisiteIds.includes(targetId) ||
    candidate.prerequisiteIds.some((id) =>
      dependsOn(id, targetId, milestones, visited),
    )
  )
}
