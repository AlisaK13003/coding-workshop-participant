import { useState } from 'react'
import {
  employeesSeed,
  loadManagerLogs,
  loadManagerMilestones,
  loadManagerProjects,
  noticesSeed,
} from '../../data/managerData.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import {
  DEMO_EMPLOYEE_ID,
  addClosedProjectId,
  removeReviewRequest,
  saveEmployeeAssignment,
  saveMilestoneUpdates,
} from '../../services/demoSync.js'
import { findById } from '../../utils/collections.js'
import {
  MILESTONE_STATUS,
  assignEmployeeMilestone,
  completeMilestone,
  reopenMilestone,
} from '../../utils/milestones.js'

const KEEP_OPEN_FEEDBACK =
  'Please address the remaining review notes before requesting another review.'

function updateById(items, id, update) {
  return items.map((item) => (item.id === id ? update(item) : item))
}

/**
 * Manager workspace state and the actions that change it. Changes that affect
 * the employee workspace are also written to the demo sync storage.
 * Closed projects (and their milestones, logs and notices) are hidden.
 */
export function useManagerData() {
  const [projects, setProjects] = useState(loadManagerProjects)
  const [milestones, setMilestones] = useState(loadManagerMilestones)
  const [logs] = useState(loadManagerLogs)
  const [employees, setEmployees] = useState(employeesSeed)
  const notices = useNotifications(noticesSeed)

  const visibleProjects = projects.filter((project) => !project.closed)
  const visibleIds = new Set(visibleProjects.map((project) => project.id))
  const inVisibleProject = (item) => visibleIds.has(item.projectId)

  const updateProject = (updated) =>
    setProjects((items) => updateById(items, updated.id, () => updated))

  /** Adds or replaces a milestone. Returns true when it already existed. */
  const saveMilestone = (milestone) => {
    const exists = milestones.some((item) => item.id === milestone.id)
    setMilestones((items) =>
      exists
        ? updateById(items, milestone.id, () => milestone)
        : [...items, milestone],
    )
    return exists
  }

  const completeAndMove = (milestoneId, destinationId) => {
    const current = findById(milestones, milestoneId)
    if (!current) return
    const updated = completeMilestone(milestones, milestoneId, destinationId)
    setMilestones(updated)
    const destination = findById(updated, destinationId)
    saveMilestoneUpdates({
      [milestoneId]: { status: MILESTONE_STATUS.completed, employeeIds: [] },
      ...(destination && {
        [destination.id]: {
          status: destination.status,
          employeeIds: destination.employeeIds,
        },
      }),
    })
    removeReviewRequest(milestoneId)
    if (current.employeeIds.includes(DEMO_EMPLOYEE_ID)) {
      saveEmployeeAssignment(current.projectId, destinationId)
    }
    notices.removeNotifications((notice) => notice.milestoneId === milestoneId)
  }

  const keepMilestoneOpen = (milestoneId) => {
    setMilestones((items) => reopenMilestone(items, milestoneId))
    notices.removeNotifications((notice) => notice.milestoneId === milestoneId)
    saveMilestoneUpdates({
      [milestoneId]: {
        status: MILESTONE_STATUS.available,
        feedback: KEEP_OPEN_FEEDBACK,
      },
    })
    removeReviewRequest(milestoneId)
  }

  const setEmployeeMilestone = (projectId, employeeId, milestoneId) => {
    setMilestones((items) =>
      assignEmployeeMilestone(items, projectId, employeeId, milestoneId),
    )
    if (employeeId === DEMO_EMPLOYEE_ID) {
      saveEmployeeAssignment(projectId, milestoneId)
    }
  }

  const addEmployeeToProject = (projectId, employeeId) =>
    setProjects((items) =>
      updateById(items, projectId, (project) => ({
        ...project,
        employeeIds: [...project.employeeIds, employeeId],
      })),
    )

  const removeEmployeeFromProject = (projectId, employeeId) => {
    setProjects((items) =>
      updateById(items, projectId, (project) => ({
        ...project,
        employeeIds: project.employeeIds.filter((id) => id !== employeeId),
      })),
    )
    setMilestones((items) =>
      assignEmployeeMilestone(items, projectId, employeeId, null),
    )
  }

  /** status: 'Completed' | 'Abandoned'. The project leaves every manager view. */
  const closeProject = (projectId, status) => {
    setProjects((items) =>
      updateById(items, projectId, (project) => ({ ...project, closed: status })),
    )
    notices.removeNotifications((notice) => notice.projectId === projectId)
    addClosedProjectId(projectId)
  }

  const updateEmployee = (updated) =>
    setEmployees((items) => updateById(items, updated.id, () => updated))

  const visibleNotices = notices.notifications.filter(inVisibleProject)

  return {
    projects: visibleProjects,
    milestones,
    visibleMilestones: milestones.filter(inVisibleProject),
    logs: logs.filter(inVisibleProject),
    employees,
    notices: {
      ...notices,
      notifications: visibleNotices,
      unreadCount: visibleNotices.filter((notice) => !notice.read).length,
    },
    updateProject,
    saveMilestone,
    completeAndMove,
    keepMilestoneOpen,
    setEmployeeMilestone,
    addEmployeeToProject,
    removeEmployeeFromProject,
    closeProject,
    updateEmployee,
  }
}
