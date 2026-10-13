import { useState } from 'react'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Button, Toast } from '../../components/ui'
import {
  adminNotifications,
  loadWorkLogs,
  milestonesSeed,
  projectsSeed,
} from '../../data/adminData.js'
import { useModal } from '../../hooks/useModal.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { useToast } from '../../hooks/useToast.js'
import { MILESTONE_STATUS } from '../../utils/milestones.js'
import {
  ADMIN_DIALOGS,
  ADMIN_NAV_ITEMS,
  ADMIN_PAGES,
  ADMIN_PROFILE_ACTIONS,
  ADMIN_SIDEBAR_FOOTER,
  ADMIN_USER,
} from './adminConfig.js'
import { ActivityPage } from './ActivityPage.jsx'
import { ArchivePage } from './ArchivePage.jsx'
import { DashboardPage } from './DashboardPage.jsx'
import { AdminDialogs } from './dialogs/AdminDialogs.jsx'
import { ProjectDetailPage } from './ProjectDetailPage.jsx'
import { ProjectsPage } from './ProjectsPage.jsx'
import { isActiveProject } from './projectFilters.js'
import { UsersPage } from './UsersPage.jsx'
import { WorkLogsPage } from './WorkLogsPage.jsx'

const SUCCESS_MESSAGES = {
  [ADMIN_DIALOGS.createProject]: 'Project created and ready for assignment.',
  [ADMIN_DIALOGS.createUser]: 'User created. A generated ID has been assigned.',
  [ADMIN_DIALOGS.addMilestone]: 'Milestone added to the project plan.',
  [ADMIN_DIALOGS.addWorkLog]: 'Historical workday added with an audit record.',
  [ADMIN_DIALOGS.completeMilestone]:
    'Milestone completed. Employee destinations updated.',
  [ADMIN_DIALOGS.archiveProject]:
    'Project archived. Historical records remain available.',
  [ADMIN_DIALOGS.unarchiveProject]:
    'Project restored and marked as needing reassignment.',
}

/**
 * Admin workspace. Sub-pages switch with in-app state (not URLs), inside the
 * shared AppShell. Owns the sample data, the open dialog and the toast.
 */
export default function AdminApp() {
  const [page, setPage] = useState(ADMIN_PAGES.dashboard)
  const [projects, setProjects] = useState(projectsSeed)
  const [milestones, setMilestones] = useState(milestonesSeed)
  const [workLogs] = useState(loadWorkLogs)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const { notifications } = useNotifications(adminNotifications)
  const dialog = useModal()
  const toast = useToast()

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  )
  const title = selectedProject ? ADMIN_PAGES.projects : page
  const activeProjectCount = projects.filter(isActiveProject).length
  const navItems = ADMIN_NAV_ITEMS.map((item) =>
    item.name === ADMIN_PAGES.projects
      ? { ...item, count: activeProjectCount }
      : item,
  )

  const navigate = (nextPage) => {
    setSelectedProjectId(null)
    setPage(nextPage)
  }
  const openProject = (project) => setSelectedProjectId(project.id)

  const completeMilestoneUnderReview = () =>
    setMilestones((items) =>
      items.map((item) =>
        item.status === MILESTONE_STATUS.review
          ? { ...item, status: MILESTONE_STATUS.completed }
          : item,
      ),
    )

  const restoreProject = (restored) =>
    setProjects((items) =>
      items.map((project) =>
        project.id === restored.id
          ? {
              ...project,
              archived: false,
              manager: 'Unassigned',
              needsAssignment: true,
            }
          : project,
      ),
    )

  const handleDialogSubmit = () => {
    if (dialog.kind === ADMIN_DIALOGS.completeMilestone) {
      completeMilestoneUnderReview()
    }
    if (dialog.kind === ADMIN_DIALOGS.unarchiveProject) {
      restoreProject(dialog.payload)
    }
    toast.showToast(SUCCESS_MESSAGES[dialog.kind] || 'Changes saved.')
    dialog.close()
  }

  const renderPage = () => {
    if (selectedProject) {
      return (
        <ProjectDetailPage
          project={selectedProject}
          milestones={milestones}
          workLogs={workLogs}
          onBack={() => setSelectedProjectId(null)}
          onOpenDialog={dialog.open}
        />
      )
    }
    switch (page) {
      case ADMIN_PAGES.dashboard:
        return (
          <DashboardPage
            projects={projects}
            onOpenProject={openProject}
            onOpenDialog={dialog.open}
          />
        )
      case ADMIN_PAGES.projects:
        return (
          <ProjectsPage
            projects={projects}
            onOpenProject={openProject}
            onOpenDialog={dialog.open}
          />
        )
      case ADMIN_PAGES.users:
        return <UsersPage onOpenDialog={dialog.open} />
      case ADMIN_PAGES.workLogs:
        return <WorkLogsPage workLogs={workLogs} onOpenDialog={dialog.open} />
      case ADMIN_PAGES.activity:
        return <ActivityPage />
      default:
        return (
          <ArchivePage
            projects={projects}
            onOpenProject={openProject}
            onUnarchive={(project) =>
              dialog.open(ADMIN_DIALOGS.unarchiveProject, project)
            }
          />
        )
    }
  }

  return (
    <AppShell
      brandTag="ADMIN"
      workspaceLabel="Admin console"
      title={title}
      navItems={navItems}
      activeNav={title}
      onNavigate={navigate}
      sidebarFooter={ADMIN_SIDEBAR_FOOTER}
      user={ADMIN_USER}
      profileActions={ADMIN_PROFILE_ACTIONS}
      notifications={notifications}
      notificationsFooter={
        <Button variant="ghost">View all notifications</Button>
      }
    >
      {renderPage()}
      <AdminDialogs
        kind={dialog.kind}
        payload={dialog.payload}
        onClose={dialog.close}
        onSubmit={handleDialogSubmit}
      />
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </AppShell>
  )
}
