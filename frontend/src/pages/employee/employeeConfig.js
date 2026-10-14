// Employee workspace configuration for the shared AppShell.
import { Clock3, FolderKanban, LayoutDashboard, UserRound } from 'lucide-react'

export const EMPLOYEE_PAGES = {
  dashboard: 'Dashboard',
  projects: 'My Projects',
  workLogs: 'My Work Logs',
  profile: 'My Profile',
}

export const EMPLOYEE_NAV_ITEMS = [
  { name: EMPLOYEE_PAGES.dashboard, icon: LayoutDashboard },
  { name: EMPLOYEE_PAGES.projects, icon: FolderKanban },
  { name: EMPLOYEE_PAGES.workLogs, icon: Clock3 },
  { name: EMPLOYEE_PAGES.profile, icon: UserRound },
]

export const EMPLOYEE_SIDEBAR_FOOTER = {
  icon: UserRound,
  title: 'Employee workspace',
  subtitle: 'Your active assignments',
}

/** What the list under the dashboard's stat cards shows; each card selects one. */
export const EMPLOYEE_DASHBOARD_VIEWS = {
  projects: 'projects',
  hours: 'hours',
  reviews: 'reviews',
}

export const EMPLOYEE_WORK_LOG_COLUMNS = ['date', 'project', 'milestone', 'hours']
