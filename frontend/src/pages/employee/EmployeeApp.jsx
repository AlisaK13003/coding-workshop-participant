import { useState } from 'react'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { QueryContent } from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { WorkspaceDialogs } from '../../components/workspace/WorkspaceDialogs.jsx'
import { useModal } from '../../hooks/useModal.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { useWorkspaceLocation } from '../../hooks/useWorkspaceLocation.js'
import { useCurrentUser } from '../../hooks/useSession.js'
import { toShellUser } from '../../utils/users.js'
import { DashboardPage } from './DashboardPage.jsx'
import {
  EMPLOYEE_NAV_ITEMS,
  EMPLOYEE_PAGES,
  EMPLOYEE_SIDEBAR_FOOTER,
} from './employeeConfig.js'
import { MyProjectsPage } from './MyProjectsPage.jsx'
import { MyWorkLogsPage } from './MyWorkLogsPage.jsx'
import { ProjectDetailPage } from './ProjectDetailPage.jsx'
import { useEmployeeData } from './useEmployeeData.js'
import { MyProfilePage } from '../shared/MyProfilePage.jsx'

/**
 * Employee workspace inside the shared AppShell. The page and open project live in the URL
 * (#/employee/my-projects?project=1), so a refresh returns there; the data comes from
 * useEmployeeData and dialogs save through the API.
 */
export default function EmployeeApp() {
  const user = useCurrentUser()
  const data = useEmployeeData()
  const notices = useNotifications()
  const { page, ids, go } = useWorkspaceLocation('/employee', EMPLOYEE_PAGES)
  const selectedProjectId = ids.project ?? null
  const [loggingProjectId, setLoggingProjectId] = useState(null)
  const dialog = useModal()

  const assignments = data.data?.assignments ?? []
  const selected = assignments.find(({ project }) => project.id === selectedProjectId)
  const managerName = data.data?.profile.manager?.name
  const navItems = EMPLOYEE_NAV_ITEMS.map((item) =>
    item.name === EMPLOYEE_PAGES.dashboard ? { ...item, count: notices.unreadCount } : item,
  )

  const navigate = (nextPage) => go({ page: nextPage })
  const openProject = (project) => go({ page: EMPLOYEE_PAGES.projects, project: project.id })
  const openLog = ({ project, milestone }) => dialog.open(DIALOGS.logWork, { project, milestone })
  const openReview = ({ project, milestone }) => dialog.open(DIALOGS.requestReview, { project, milestone })

  const selectNotification = (notice) => {
    if (!notice.read) notices.markRead(notice.id)
    const target = assignments.find(({ project }) => project.id === notice.project_id)
    if (target) openProject(target.project)
  }

  const renderPage = ({ milestones, members, logs, profile }) => {
    if (selected) {
      return (
        <ProjectDetailPage
          assignment={selected}
          milestones={milestones}
          members={members}
          logs={logs}
          onBack={() => go({ project: null })}
          onLog={() => openLog(selected)}
          onReview={() => openReview(selected)}
        />
      )
    }
    switch (page) {
      case EMPLOYEE_PAGES.dashboard:
        return (
          <DashboardPage
            assignments={assignments}
            logs={logs}
            notices={notices.items}
            selectedProjectId={loggingProjectId}
            onSelectProject={setLoggingProjectId}
            onLog={openLog}
            onReview={openReview}
            onOpenProject={openProject}
            onSelectNotice={selectNotification}
            onNavigate={navigate}
          />
        )
      case EMPLOYEE_PAGES.projects:
        return <MyProjectsPage assignments={assignments} logs={logs} onOpenProject={openProject} />
      case EMPLOYEE_PAGES.workLogs:
        return <MyWorkLogsPage assignments={assignments} milestones={milestones} logs={logs} />
      default:
        return (
          <MyProfilePage
            profile={profile}
            relation={`Reports to ${profile.manager?.name ?? 'nobody'}`}
            extraDetails={[{ label: 'Assigned manager', value: profile.manager?.name ?? '—' }]}
          />
        )
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
      user={toShellUser(user)}
      profileSummary={managerName && `Reports to ${managerName}`}
      notifications={notices.items}
      onNotificationSelect={selectNotification}
      onMarkAllNotificationsRead={notices.markAllRead}
    >
      <QueryContent query={data} loadingLabel="Loading your assignments…">
        {renderPage}
      </QueryContent>
      <WorkspaceDialogs modal={dialog} />
    </AppShell>
  )
}
