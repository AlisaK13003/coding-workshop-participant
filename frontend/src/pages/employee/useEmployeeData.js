import { useState } from 'react'
import {
  TODAY_KEY,
  loadEmployeeLogs,
  loadEmployeeMilestones,
  loadEmployeeNotices,
  loadEmployeeProjects,
} from '../../data/employeeData.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { addEmployeeLog, addReviewRequest } from '../../services/demoSync.js'
import { MILESTONE_STATUS } from '../../utils/milestones.js'
import { getCurrentMilestone } from './employeeSelectors.js'

/**
 * Employee workspace state and the actions that change it. Logged work and
 * review requests are written to the demo sync storage so the manager and
 * admin workspaces see them.
 */
export function useEmployeeData() {
  const [projects] = useState(loadEmployeeProjects)
  const [milestones, setMilestones] = useState(loadEmployeeMilestones)
  const [logs, setLogs] = useState(loadEmployeeLogs)
  const notices = useNotifications(() =>
    loadEmployeeNotices(new Set(projects.map((project) => project.id))),
  )

  const projectIds = new Set(projects.map((project) => project.id))
  const inVisibleProject = (item) => projectIds.has(item.projectId)
  const hasLoggedToday = logs.some((log) => log.date === TODAY_KEY)

  /**
   * Log today's 8 hours on the project's current milestone.
   * Returns false when nothing was logged (already logged, or no milestone).
   */
  const logToday = (projectId) => {
    if (hasLoggedToday) return false
    const milestone = getCurrentMilestone(milestones, projectId)
    if (!milestone) return false
    const entry = {
      id: Date.now(),
      date: TODAY_KEY,
      submittedAt: 'Jun 18, 2025 · 5:00 PM',
      projectId,
      milestoneId: milestone.id,
      hours: 8,
    }
    addEmployeeLog(entry)
    setLogs((items) => [...items, entry])
    setMilestones((items) =>
      items.map((item) =>
        item.id === milestone.id
          ? { ...item, totalHours: item.totalHours + 8 }
          : item,
      ),
    )
    return true
  }

  /** Ask the manager to review the project's current milestone. */
  const requestReview = (projectId, note) => {
    const milestone = getCurrentMilestone(milestones, projectId)
    if (!milestone || milestone.status === MILESTONE_STATUS.review) return
    addReviewRequest({ projectId, milestoneId: milestone.id, note })
    setMilestones((items) =>
      items.map((item) =>
        item.id === milestone.id
          ? { ...item, status: MILESTONE_STATUS.review }
          : item,
      ),
    )
    notices.addNotification({
      id: Date.now(),
      title: 'Review request sent',
      detail: `${milestone.name} is awaiting Maya’s review.`,
      projectId,
      read: false,
    })
  }

  return {
    projects,
    milestones: milestones.filter(inVisibleProject),
    logs: logs.filter(inVisibleProject),
    notices,
    hasLoggedToday,
    logToday,
    requestReview,
  }
}
