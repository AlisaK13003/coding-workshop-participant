// Admin workspace configuration for the shared AppShell.
import {
  Activity,
  Archive,
  FileClock,
  FolderKanban,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react'

export const ADMIN_PAGES = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  users: 'Users',
  workLogs: 'Work Logs',
  activity: 'Activity Log',
  archive: 'Archive',
}

export const ADMIN_NAV_ITEMS = [
  { name: ADMIN_PAGES.dashboard, icon: LayoutDashboard },
  { name: ADMIN_PAGES.projects, icon: FolderKanban },
  { name: ADMIN_PAGES.users, icon: Users },
  { name: ADMIN_PAGES.workLogs, icon: FileClock },
  { name: ADMIN_PAGES.activity, icon: Activity },
  { name: ADMIN_PAGES.archive, icon: Archive },
]

export const ADMIN_SIDEBAR_FOOTER = {
  icon: ShieldCheck,
  title: 'Admin workspace',
  subtitle: 'Full system access',
}

export const ADMIN_USER = { name: 'Elena Vasquez', subtitle: 'Administrator' }

export const ADMIN_PROFILE_ACTIONS = [
  { label: 'Profile settings', icon: Settings2 },
  { label: 'Admin permissions', icon: ShieldCheck },
]

// Dialogs the admin workspace can open (keys for useModal).
export const ADMIN_DIALOGS = {
  createProject: 'createProject',
  createUser: 'createUser',
  addMilestone: 'addMilestone',
  addWorkLog: 'addWorkLog',
  completeMilestone: 'completeMilestone',
  archiveProject: 'archiveProject',
  unarchiveProject: 'unarchiveProject',
  transferEmployee: 'transferEmployee',
}
