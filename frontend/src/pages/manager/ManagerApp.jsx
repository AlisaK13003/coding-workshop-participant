import { useState } from 'react'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { QueryContent } from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { WorkspaceDialogs } from '../../components/workspace/WorkspaceDialogs.jsx'
import { useModal } from '../../hooks/useModal.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { useCurrentUser } from '../../hooks/useSession.js'
import { findById } from '../../utils/collections.js'
import { pluralize } from '../../utils/text.js'
import { toShellUser } from '../../utils/users.js'
import { ProjectCalendar } from '../../components/calendar/ProjectCalendar.jsx'
import { DashboardPage } from './DashboardPage.jsx'
import { EmployeeDetailPage } from './EmployeeDetailPage.jsx'
import {
  MANAGER_NAV_ITEMS,
  MANAGER_PAGES,
  MANAGER_SIDEBAR_FOOTER,
} from './managerConfig.js'
import { MyEmployeesPage } from './MyEmployeesPage.jsx'
import { MyProjectsPage } from './MyProjectsPage.jsx'
import { ProjectDetailPage } from './ProjectDetailPage.jsx'
import { useManagerData } from './useManagerData.js'
import { MyProfilePage } from '../shared/MyProfilePage.jsx'
import { WorkLogsPage } from './WorkLogsPage.jsx'

/**
 * Manager workspace. Sub-pages switch with in-app state inside the shared AppShell;
 * the data comes from useManagerData and dialogs save through the API.
 * Managers only see their own projects while they're in progress.
 */
export default function ManagerApp() {
  const user = useCurrentUser()
  const data = useManagerData()
  const notices = useNotifications()
  const [page, setPage] = useState(MANAGER_PAGES.dashboard)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const dialog = useModal()

  const { projects = [], milestones = [], employees = [] } = data.data ?? {}
  const selectedProject = findById(projects, selectedProjectId)
  const navItems = MANAGER_NAV_ITEMS.map((item) =>
    item.name === MANAGER_PAGES.dashboard ? { ...item, count: notices.unreadCount } : item,
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

  /** Opens the milestone's project and its review dialog. */
  const openReview = (milestone) => {
    openProject(milestone.project_id)
    dialog.open(DIALOGS.reviewMilestone, { milestone })
  }

  const selectNotification = (notice) => {
    if (!notice.read) notices.markRead(notice.id)
    if (!findById(projects, notice.project_id)) return
    const milestone = findById(milestones, notice.milestone_id)
    if (milestone?.pending_review) openReview(milestone)
    else openProject(notice.project_id)
  }

  const renderPage = ({ logs, members, profile }) => {
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
      case MANAGER_PAGES.dashboard:
        return (
          <DashboardPage
            projects={projects}
            milestones={milestones}
            members={members}
            onOpenProject={openProject}
            onReview={openReview}
            onOpenCalendar={() => navigate(MANAGER_PAGES.calendar)}
          />
        )
      case MANAGER_PAGES.projects:
        return <MyProjectsPage projects={projects} onOpenProject={openProject} />
      case MANAGER_PAGES.calendar:
        return <ProjectCalendar projects={projects} onOpenProject={(project) => openProject(project.id)} />
      case MANAGER_PAGES.employees:
        return selectedEmployeeId ? (
          <EmployeeDetailPage
            employeeId={selectedEmployeeId}
            projects={projects}
            milestones={milestones}
            logs={logs}
            onBack={() => setSelectedEmployeeId(null)}
            onOpenProject={openProject}
            onOpenDialog={dialog.open}
          />
        ) : (
          <MyEmployeesPage
            employees={employees}
            members={members}
            logs={logs}
            onSelectEmployee={setSelectedEmployeeId}
          />
        )
      case MANAGER_PAGES.profile:
        return (
          <MyProfilePage
            profile={profile}
            relation={`${employees.length} direct ${pluralize(employees.length, 'report')}`}
            extraDetails={[{ label: 'Direct reports', value: employees.length }]}
          />
        )
      default:
        return <WorkLogsPage logs={logs} employees={employees} projects={projects} milestones={milestones} />
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
      user={toShellUser(user)}
      profileSummary={`${employees.length} direct ${pluralize(employees.length, 'report')}`}
      notifications={notices.items}
      onNotificationSelect={selectNotification}
      onMarkAllNotificationsRead={notices.markAllRead}
    >
      <QueryContent query={data} loadingLabel="Loading your portfolio…">
        {renderPage}
      </QueryContent>
      <WorkspaceDialogs modal={dialog} />
    </AppShell>
  )
}
