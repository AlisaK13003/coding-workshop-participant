import { useState } from 'react'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Toast } from '../../components/ui'
import { useModal } from '../../hooks/useModal.js'
import { useToast } from '../../hooks/useToast.js'
import { findById } from '../../utils/collections.js'
import { fullName } from '../../utils/format.js'
import { MILESTONE_STATUS } from '../../utils/milestones.js'
import { CalendarPage } from './calendar/CalendarPage.jsx'
import { DashboardPage } from './DashboardPage.jsx'
import { ManagerDialogs } from './dialogs/ManagerDialogs.jsx'
import { EmployeeDetailPage } from './EmployeeDetailPage.jsx'
import {
  MANAGER_DIALOGS,
  MANAGER_NAV_ITEMS,
  MANAGER_PAGES,
  MANAGER_PROFILE_SUMMARY,
  MANAGER_SIDEBAR_FOOTER,
  MANAGER_USER,
} from './managerConfig.js'
import { MyEmployeesPage } from './MyEmployeesPage.jsx'
import { MyProjectsPage } from './MyProjectsPage.jsx'
import { ProjectDetailPage } from './ProjectDetailPage.jsx'
import { useManagerData } from './useManagerData.js'
import { WorkLogsPage } from './WorkLogsPage.jsx'

/**
 * Manager workspace (signed in as Maya Chen). Sub-pages switch with in-app
 * state inside the shared AppShell; data and its changes live in useManagerData.
 */
export default function ManagerApp() {
  const data = useManagerData()
  const [page, setPage] = useState(MANAGER_PAGES.dashboard)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const dialog = useModal()
  const toast = useToast()

  const selectedProject = findById(data.projects, selectedProjectId)
  const selectedEmployee = findById(data.employees, selectedEmployeeId)
  const dialogMilestone = findById(data.milestones, dialog.payload?.milestoneId)
  const dialogEmployee = findById(data.employees, dialog.payload?.employeeId)
  const navItems = MANAGER_NAV_ITEMS.map((item) =>
    item.name === MANAGER_PAGES.dashboard
      ? { ...item, count: data.notices.unreadCount }
      : item,
  )

  const navigate = (nextPage) => {
    setPage(nextPage)
    setSelectedProjectId(null)
    setSelectedEmployeeId(null)
  }
  const openProject = (projectId) => {
    setSelectedProjectId(projectId)
    setPage(MANAGER_PAGES.projects)
  }
  const finish = (message) => {
    dialog.close()
    toast.showToast(message)
  }

  const openReview = (milestone) => {
    if (findById(data.projects, milestone.projectId)) {
      openProject(milestone.projectId)
    }
    dialog.open(MANAGER_DIALOGS.review, { milestoneId: milestone.id })
    data.notices.markReadWhere(
      (notice) => notice.milestoneId === milestone.id,
    )
  }

  const selectNotification = (notice) => {
    data.notices.markRead(notice.id)
    if (findById(data.projects, notice.projectId)) openProject(notice.projectId)
    const milestone = findById(data.milestones, notice.milestoneId)
    if (milestone?.status === MILESTONE_STATUS.review) {
      dialog.open(MANAGER_DIALOGS.review, { milestoneId: milestone.id })
    }
  }

  const dialogActions = {
    saveProject: (updated) => {
      if (updated.end < updated.start) {
        toast.showToast('Predicted end date must be after the start date.')
        return
      }
      data.updateProject(updated)
      finish('Project details, calendar range, and schedule phase updated.')
    },
    saveMilestone: (milestone) => {
      const existed = data.saveMilestone(milestone)
      finish(
        existed
          ? 'Milestone updated without circular or self-dependencies.'
          : 'Milestone added without circular or self-dependencies.',
      )
    },
    completeMilestone: (milestoneId, destinationId) => {
      data.completeAndMove(milestoneId, destinationId)
      finish(
        destinationId
          ? 'Milestone completed and all assigned employees moved together.'
          : 'Milestone completed. Employees remain on the project without a milestone.',
      )
    },
    requestKeepOpen: (milestoneId) =>
      dialog.open(MANAGER_DIALOGS.keepOpen, { milestoneId }),
    keepOpen: (milestoneId) => {
      data.keepMilestoneOpen(milestoneId)
      finish('Milestone kept open and feedback recorded.')
    },
    addEmployee: (employeeId) => {
      data.addEmployeeToProject(selectedProject.id, employeeId)
      finish('Employee added. Assign a milestone when ready.')
    },
    removeEmployee: (employeeId) => {
      data.removeEmployeeFromProject(selectedProject.id, employeeId)
      finish('Project assignment removed. Historical records remain.')
    },
    closeProject: (status) => {
      data.closeProject(selectedProject.id, status)
      setSelectedProjectId(null)
      setPage(MANAGER_PAGES.projects)
      finish(
        `${selectedProject.name} was marked ${status.toLowerCase()} and removed from manager views. Admins retain its history.`,
      )
    },
    saveEmployee: (updated) => {
      data.updateEmployee(updated)
      setSelectedEmployeeId(updated.id)
      finish('Employee profile updated. Historical labor costs were preserved.')
    },
    resetPassword: (employee) =>
      finish(`Password reset prepared for ${fullName(employee)}.`),
  }

  const setEmployeeMilestone = (employeeId, milestoneId) => {
    data.setEmployeeMilestone(selectedProject.id, employeeId, milestoneId)
    toast.showToast(
      milestoneId
        ? 'Employee milestone assignment updated.'
        : 'Employee is now unassigned from a milestone.',
    )
  }

  const renderPage = () => {
    if (selectedProject) {
      return (
        <ProjectDetailPage
          project={selectedProject}
          milestones={data.visibleMilestones}
          employees={data.employees}
          logs={data.logs}
          onBack={() => setSelectedProjectId(null)}
          onOpenDialog={dialog.open}
          onEmployeeMilestone={setEmployeeMilestone}
        />
      )
    }
    switch (page) {
      case MANAGER_PAGES.dashboard:
        return (
          <DashboardPage
            projects={data.projects}
            milestones={data.visibleMilestones}
            employees={data.employees}
            onOpenProject={openProject}
            onReview={openReview}
          />
        )
      case MANAGER_PAGES.projects:
        return (
          <MyProjectsPage
            projects={data.projects}
            milestones={data.visibleMilestones}
            onOpenProject={openProject}
          />
        )
      case MANAGER_PAGES.calendar:
        return <CalendarPage projects={data.projects} onOpenProject={openProject} />
      case MANAGER_PAGES.employees:
        return selectedEmployee ? (
          <EmployeeDetailPage
            employee={selectedEmployee}
            projects={data.projects}
            milestones={data.visibleMilestones}
            logs={data.logs}
            onBack={() => setSelectedEmployeeId(null)}
            onEdit={() =>
              dialog.open(MANAGER_DIALOGS.editEmployee, {
                employeeId: selectedEmployee.id,
              })
            }
            onResetPassword={() =>
              dialog.open(MANAGER_DIALOGS.resetPassword, {
                employeeId: selectedEmployee.id,
              })
            }
          />
        ) : (
          <MyEmployeesPage
            employees={data.employees}
            projects={data.projects}
            milestones={data.visibleMilestones}
            logs={data.logs}
            onSelectEmployee={setSelectedEmployeeId}
          />
        )
      default:
        return (
          <WorkLogsPage
            logs={data.logs}
            employees={data.employees}
            projects={data.projects}
            milestones={data.visibleMilestones}
          />
        )
    }
  }

  return (
    <AppShell
      brandTag="MANAGER"
      workspaceLabel="Manager workspace"
      title={page}
      navItems={navItems}
      activeNav={page}
      onNavigate={navigate}
      sidebarFooter={MANAGER_SIDEBAR_FOOTER}
      user={MANAGER_USER}
      profileSummary={MANAGER_PROFILE_SUMMARY}
      notifications={data.notices.notifications}
      onNotificationSelect={selectNotification}
      onMarkAllNotificationsRead={data.notices.markAllRead}
    >
      {renderPage()}
      <ManagerDialogs
        kind={dialog.kind}
        project={selectedProject}
        milestone={dialogMilestone}
        employee={dialogEmployee}
        milestones={data.milestones}
        employees={data.employees}
        actions={dialogActions}
        onClose={dialog.close}
      />
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </AppShell>
  )
}
