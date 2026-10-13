import { useState } from 'react'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Toast } from '../../components/ui'
import { useModal } from '../../hooks/useModal.js'
import { useToast } from '../../hooks/useToast.js'
import { findById } from '../../utils/collections.js'
import { DashboardPage } from './DashboardPage.jsx'
import { EmployeeDialogs } from './dialogs/EmployeeDialogs.jsx'
import {
  EMPLOYEE_DIALOGS,
  EMPLOYEE_NAV_ITEMS,
  EMPLOYEE_PAGES,
  EMPLOYEE_PROFILE_SUMMARY,
  EMPLOYEE_SIDEBAR_FOOTER,
  EMPLOYEE_USER,
} from './employeeConfig.js'
import { getCurrentMilestone, getLoggableProjects } from './employeeSelectors.js'
import { MyProfilePage } from './MyProfilePage.jsx'
import { MyProjectsPage } from './MyProjectsPage.jsx'
import { MyWorkLogsPage } from './MyWorkLogsPage.jsx'
import { ProjectDetailPage } from './ProjectDetailPage.jsx'
import { useEmployeeData } from './useEmployeeData.js'

/**
 * Employee workspace (signed in as Aisha Patel). Sub-pages switch with in-app
 * state inside the shared AppShell; data and its changes live in useEmployeeData.
 */
export default function EmployeeApp() {
  const data = useEmployeeData()
  const [page, setPage] = useState(EMPLOYEE_PAGES.dashboard)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [loggingProjectId, setLoggingProjectId] = useState(null)
  const dialog = useModal()
  const toast = useToast()

  const selectedProject = findById(data.projects, selectedProjectId)
  const loggingProject =
    findById(data.projects, loggingProjectId) || selectedProject
  const dialogProject =
    dialog.kind === EMPLOYEE_DIALOGS.logWork ? loggingProject : selectedProject
  const navItems = EMPLOYEE_NAV_ITEMS.map((item) =>
    item.name === EMPLOYEE_PAGES.dashboard
      ? { ...item, count: data.notices.unreadCount }
      : item,
  )

  const navigate = (nextPage) => {
    setPage(nextPage)
    setSelectedProjectId(null)
  }
  const openProject = (project) => {
    setSelectedProjectId(project.id)
    setPage(EMPLOYEE_PAGES.projects)
  }

  /** Open the log dialog for `project`, the picked project, or the first loggable one. */
  const openLog = (project) => {
    const target =
      project ||
      findById(data.projects, loggingProjectId) ||
      getLoggableProjects(data.projects, data.milestones)[0]
    if (!target) return
    setLoggingProjectId(target.id)
    dialog.open(EMPLOYEE_DIALOGS.logWork)
  }

  const confirmLog = () => {
    if (!loggingProject) return
    if (data.hasLoggedToday) {
      dialog.close()
      toast.showToast('Today already has a work entry.')
      return
    }
    if (!data.logToday(loggingProject.id)) return
    dialog.close()
    toast.showToast('Today’s 8-hour work entry was submitted.')
  }

  const requestReview = (note) => {
    if (!selectedProject) return
    data.requestReview(selectedProject.id, note)
    dialog.close()
    toast.showToast('Milestone review request sent to Maya Chen.')
  }

  const selectNotification = (notice) => {
    data.notices.markRead(notice.id)
    const project = findById(data.projects, notice.projectId)
    if (project) openProject(project)
  }

  const renderPage = () => {
    if (selectedProject) {
      return (
        <ProjectDetailPage
          project={selectedProject}
          milestones={data.milestones}
          logs={data.logs}
          onBack={() => setSelectedProjectId(null)}
          onLog={() => openLog(selectedProject)}
          onReview={() => dialog.open(EMPLOYEE_DIALOGS.requestReview)}
        />
      )
    }
    switch (page) {
      case EMPLOYEE_PAGES.dashboard:
        return (
          <DashboardPage
            projects={data.projects}
            milestones={data.milestones}
            logs={data.logs}
            notices={data.notices.notifications}
            selectedProjectId={loggingProjectId}
            onSelectProject={setLoggingProjectId}
            onLog={() => openLog()}
            onOpenProject={openProject}
          />
        )
      case EMPLOYEE_PAGES.projects:
        return (
          <MyProjectsPage
            projects={data.projects}
            milestones={data.milestones}
            logs={data.logs}
            onOpenProject={openProject}
          />
        )
      case EMPLOYEE_PAGES.workLogs:
        return (
          <MyWorkLogsPage
            projects={data.projects}
            milestones={data.milestones}
            logs={data.logs}
          />
        )
      default:
        return <MyProfilePage onPasswordChanged={toast.showToast} />
    }
  }

  return (
    <AppShell
      brandTag="EMPLOYEE"
      workspaceLabel="Employee workspace"
      title={page}
      navItems={navItems}
      activeNav={page}
      onNavigate={navigate}
      sidebarFooter={EMPLOYEE_SIDEBAR_FOOTER}
      user={EMPLOYEE_USER}
      profileSummary={EMPLOYEE_PROFILE_SUMMARY}
      notifications={data.notices.notifications}
      onNotificationSelect={selectNotification}
      onMarkAllNotificationsRead={data.notices.markAllRead}
    >
      {renderPage()}
      <EmployeeDialogs
        kind={dialog.kind}
        project={dialogProject}
        milestone={
          dialogProject && getCurrentMilestone(data.milestones, dialogProject.id)
        }
        onClose={dialog.close}
        onConfirmLog={confirmLog}
        onRequestReview={requestReview}
      />
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </AppShell>
  )
}
