// Loads the projects a user can see together with their milestones and members, for
// workspaces that summarise several projects at once (manager and employee).
// The API lists milestones and members one project at a time, so this makes one
// request per project for each, in parallel.
import { listMilestonesForProjects } from './milestonesApi.js'
import { listMembersForProjects, listProjects } from './projectsApi.js'

/** { projects, milestones, members } for every project the user can see. */
export async function loadPortfolio() {
  const projects = await listProjects()
  const ids = projects.map((project) => project.id)
  const [milestones, members] = await Promise.all([
    listMilestonesForProjects(ids),
    listMembersForProjects(ids),
  ])
  return { projects, milestones, members }
}
