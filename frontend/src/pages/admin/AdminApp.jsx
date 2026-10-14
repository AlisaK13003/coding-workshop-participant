import { useState } from 'react'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { QueryContent } from '../../components/ui'
import { WorkspaceDialogs } from '../../components/workspace/WorkspaceDialogs.jsx'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { useModal } from '../../hooks/useModal.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { useCurrentUser } from '../../hooks/useSession.js'
import { listProjects } from '../../services/projectsApi.js'
import { findById } from '../../utils/collections.js'
import { isNotArchived } from '../../utils/projects.js'
import { toShellUser } from '../../utils/users.js'
import {
  ADMIN_NAV_ITEMS,
  ADMIN_PAGES,
  ADMIN_SIDEBAR_FOOTER,
} from './adminConfig.js'
import { ActivityPage } from './ActivityPage.jsx'
import { ArchivePage } from './ArchivePage.jsx'
import { CalendarPage } from './CalendarPage.jsx'
import { DashboardPage } from './DashboardPage.jsx'
import { ProjectDetailPage } from './ProjectDetailPage.jsx'
import { ProjectsPage } from './ProjectsPage.jsx'
import { UsersPage } from './UsersPage.jsx'
import { WorkLogsPage } from './WorkLogsPage.jsx'

/**
 * Admin workspace. Sub-pages switch with in-app state (not URLs), inside the
 * shared AppShell. Loads every project once for the pages that list them;
 * pages load the rest themselves, and dialogs save through the API.
 */
export default function AdminApp() {
  const user = useCurrentUser()
  const [page, setPage] = useState(ADMIN_PAGES.dashboard)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const projects = useApiQuery(() => listProjects(), [])
  const notices = useNotifications()
  const dialog = useModal()

  const selectedProject = findById(projects.data ?? [], selectedProjectId)
  const title = selectedProject ? ADMIN_PAGES.projects : page
  const navItems = ADMIN_NAV_ITEMS.map((item) =>
    item.name === ADMIN_PAGES.projects
      ? { ...item, count: (projects.data ?? []).filter(isNotArchived).length }
      : item,
  )

  const navigate = (nextPage) => {
    setSelectedProjectId(null)
    setSelectedUserId(null)
    setPage(nextPage)
  }
  const openProject = (project) => setSelectedProjectId(project.id)
  const openUser = (person) => {
    navigate(ADMIN_PAGES.users)
    setSelectedUserId(person.id)
  }

  const selectNotification = (notice) => {
    if (!notice.read) notices.markRead(notice.id)
    if (notice.project_id) setSelectedProjectId(notice.project_id)
  }

  // Pages that list projects share the one projects query.
  const withProjects = (render) => (
    <QueryContent query={projects} loadingLabel="Loading projects…">
      {render}
    </QueryContent>
  )

  const renderPage = () => {
    if (selectedProject) {
      return (
        <ProjectDetailPage
          project={selectedProject}
          onBack={() => setSelectedProjectId(null)}
          onOpenDialog={dialog.open}
        />
      )
    }
    switch (page) {
      case ADMIN_PAGES.dashboard:
        return withProjects((items) => (
          <DashboardPage
            projects={items}
            onOpenProject={openProject}
            onOpenUser={openUser}
            onNavigate={navigate}
            onOpenDialog={dialog.open}
          />
        ))
      case ADMIN_PAGES.projects:
        return withProjects((items) => (
          <ProjectsPage projects={items} onOpenProject={openProject} onOpenDialog={dialog.open} />
        ))
      case ADMIN_PAGES.calendar:
        return withProjects((items) => <CalendarPage projects={items} onOpenProject={openProject} />)
      case ADMIN_PAGES.users:
        return (
          <UsersPage
            projects={projects.data ?? []}
            selectedId={selectedUserId}
            onSelectUser={setSelectedUserId}
            onOpenProject={openProject}
            onOpenDialog={dialog.open}
          />
        )
      case ADMIN_PAGES.workLogs:
        return <WorkLogsPage onOpenDialog={dialog.open} />
      case ADMIN_PAGES.activity:
        return <ActivityPage />
      default:
        return withProjects((items) => (
          <ArchivePage projects={items} onOpenProject={openProject} onOpenDialog={dialog.open} />
        ))
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
      user={toShellUser(user)}
      notifications={notices.items}
      onNotificationSelect={selectNotification}
      onMarkAllNotificationsRead={notices.markAllRead}
    >
      {renderPage()}
      <WorkspaceDialogs modal={dialog} />
    </AppShell>
  )
}
