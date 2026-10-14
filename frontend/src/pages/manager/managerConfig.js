// Manager workspace configuration for the shared AppShell.
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  UserRound,
  Users,
} from 'lucide-react'

export const MANAGER_PAGES = {
  dashboard: 'Dashboard',
  projects: 'My Projects',
  calendar: 'Calendar',
  employees: 'My Employees',
  workLogs: 'Work Logs',
  profile: 'My Profile',
}

export const MANAGER_NAV_ITEMS = [
  { name: MANAGER_PAGES.dashboard, icon: LayoutDashboard },
  { name: MANAGER_PAGES.projects, icon: FolderKanban },
  { name: MANAGER_PAGES.calendar, icon: CalendarDays },
  { name: MANAGER_PAGES.employees, icon: Users },
  { name: MANAGER_PAGES.workLogs, icon: Clock3 },
  { name: MANAGER_PAGES.profile, icon: UserRound },
]

export const MANAGER_SIDEBAR_FOOTER = {
  icon: BriefcaseBusiness,
  title: 'Manager workspace',
  subtitle: 'Your active portfolio',
}

/** What the list under the dashboard's stat cards shows; each card selects one. */
export const MANAGER_DASHBOARD_VIEWS = {
  active: 'active',
  reviews: 'reviews',
  endingSoon: 'endingSoon',
  overBudget: 'overBudget',
}

export const MANAGER_WORK_LOG_COLUMNS = ['date', 'employee', 'project', 'milestone', 'hours', 'laborCost']
