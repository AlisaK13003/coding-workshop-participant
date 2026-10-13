import { ChevronRight } from 'lucide-react'
import { MilestoneProgress } from '../../components/projects/MilestoneProgress.jsx'
import { Phase, Progress } from '../../components/ui'
import {
  formatDateRange,
  formatHours,
  formatMoney,
} from '../../utils/format.js'
import { getProjectMilestones } from '../../utils/milestones.js'
import { getBudgetUsage } from '../../utils/schedule.js'
import { getProjectPhase } from './managerSelectors.js'
import './ProjectCardGrid.css'

/** Card view of the manager's projects. */
export function ProjectCardGrid({ projects, milestones, onOpen }) {
  return (
    <div className="project-card-grid">
      {projects.map((project) => {
        const budget = getBudgetUsage(project.cost, project.budget)
        return (
          <button
            className="project-card"
            key={project.id}
            onClick={() => onOpen(project)}
          >
            <div>
              <Phase value={getProjectPhase(project)} />
              <ChevronRight size={17} />
            </div>
            <strong>{project.name}</strong>
            <span>{formatDateRange(project.start, project.end)}</span>
            <dl>
              <div>
                <dt>Milestones</dt>
                <dd>
                  <MilestoneProgress
                    milestones={getProjectMilestones(milestones, project.id)}
                  />
                </dd>
              </div>
              <div>
                <dt>Employees</dt>
                <dd>{project.employeeIds.length}</dd>
              </div>
              <div>
                <dt>Logged</dt>
                <dd>{formatHours(project.hours)}</dd>
              </div>
              <div>
                <dt>Labor cost</dt>
                <dd>{formatMoney(project.cost)}</dd>
              </div>
            </dl>
            <div className="card-budget">
              <span>
                Budget usage <b>{budget}%</b>
              </span>
              <Progress value={budget} danger={budget > 100} />
            </div>
          </button>
        )
      })}
    </div>
  )
}
