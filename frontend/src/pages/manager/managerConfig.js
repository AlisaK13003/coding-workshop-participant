// Manager workspace configuration for the shared AppShell.
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  Users,
} from 'lucide-react'

export const MANAGER_PAGES = {
  dashboard: 'Dashboard',
  projects: 'My Projects',
  calendar: 'Calendar',
  employees: 'My Employees',
  workLogs: 'Work Logs',
}

export const MANAGER_NAV_ITEMS = [
  { name: MANAGER_PAGES.dashboard, icon: LayoutDashboard },
  { name: MANAGER_PAGES.projects, icon: FolderKanban },
  { name: MANAGER_PAGES.calendar, icon: CalendarDays },
  { name: MANAGER_PAGES.employees, icon: Users },
  { name: MANAGER_PAGES.workLogs, icon: Clock3 },
]

export const MANAGER_SIDEBAR_FOOTER = {
  icon: BriefcaseBusiness,
  title: 'Manager workspace',
  subtitle: 'Your active portfolio',
}

export const SCHEDULE_PHASE_TABLE_HINT =
  'Based only on how much of the schedule has passed, not on progress. On track: under 50%. ' +
  'Needs attention: 50–75%. Urgent: the last 25%, or past the predicted end date.'

export const MANAGER_WORK_LOG_COLUMNS = ['date', 'employee', 'project', 'milestone', 'hours', 'laborCost']
