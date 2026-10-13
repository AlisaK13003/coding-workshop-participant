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

export const MANAGER_USER = { name: 'Maya Chen', subtitle: 'Engineering Manager' }

export const MANAGER_PROFILE_SUMMARY = '5 direct reports'

export const SCHEDULE_PHASE_TABLE_HINT =
  'Green: under 50% elapsed. Amber: 50–75%. Red: 75% or past the predicted end date. This reflects elapsed scheduled time, not performance.'

// Dialogs the manager workspace can open (keys for useModal).
export const MANAGER_DIALOGS = {
  editProject: 'editProject',
  addMilestone: 'addMilestone',
  editMilestone: 'editMilestone',
  review: 'review',
  completeMilestone: 'completeMilestone',
  keepOpen: 'keepOpen',
  assignEmployee: 'assignEmployee',
  removeEmployee: 'removeEmployee',
  completeProject: 'completeProject',
  abandonProject: 'abandonProject',
  editEmployee: 'editEmployee',
  resetPassword: 'resetPassword',
}
