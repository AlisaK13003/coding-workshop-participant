// Admin project list rules.

/** In progress and not archived. */
export function isActiveProject(project) {
  return !project.archived && project.status === 'In progress'
}
