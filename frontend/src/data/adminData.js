// Sample data for the admin workspace, ported from the Figma prototype.
// Replace these with API calls (in src/services) once the backend endpoints exist.
import { formatDate } from '../utils/format.js'
import { readEmployeeLogs } from '../services/demoSync.js'

export const managerNames = ['Maya Chen', 'Noah Williams', 'Priya Shah']

export const projectsSeed = [
  {
    id: 1,
    name: 'Customer Portal Rebuild',
    manager: 'Maya Chen',
    start: 'Feb 03, 2025',
    end: 'Aug 29, 2025',
    status: 'In progress',
    phase: 'Red',
    milestones: '3 of 6',
    hours: 2480,
    cost: 186400,
    budget: 175000,
  },
  {
    id: 2,
    name: 'Finance Data Migration',
    manager: 'Noah Williams',
    start: 'Apr 14, 2025',
    end: 'Oct 10, 2025',
    status: 'In progress',
    phase: 'Amber',
    milestones: '2 of 5',
    hours: 1376,
    cost: 98420,
    budget: 240000,
  },
  {
    id: 3,
    name: 'Mobile Field Toolkit',
    manager: 'Unassigned',
    start: 'Jun 02, 2025',
    end: 'Dec 19, 2025',
    status: 'In progress',
    phase: 'Green',
    milestones: '0 of 4',
    hours: 0,
    cost: 0,
    budget: 160000,
    needsAssignment: true,
  },
  {
    id: 4,
    name: 'Support Operations Hub',
    manager: 'Priya Shah',
    start: 'Mar 10, 2025',
    end: 'Nov 14, 2025',
    status: 'In progress',
    phase: 'Amber',
    milestones: '2 of 7',
    hours: 1088,
    cost: 76880,
    budget: 210000,
  },
  {
    id: 5,
    name: 'Identity Platform Upgrade',
    manager: 'Maya Chen',
    start: 'Jan 13, 2025',
    end: 'Jun 20, 2025',
    status: 'Completed',
    phase: 'Red',
    milestones: '5 of 5',
    hours: 2048,
    cost: 151600,
    budget: 165000,
  },
  {
    id: 6,
    name: 'Legacy Billing Consolidation',
    manager: 'Noah Williams',
    start: 'Sep 04, 2024',
    end: 'Mar 28, 2025',
    status: 'Abandoned',
    phase: 'Red',
    milestones: '2 of 6',
    hours: 1840,
    cost: 136700,
    budget: 190000,
    archived: true,
    archivedDate: 'Apr 04, 2025',
    previousManager: 'Noah Williams',
  },
  {
    id: 7,
    name: 'Workplace Experience App',
    manager: 'Priya Shah',
    start: 'May 06, 2024',
    end: 'Dec 13, 2024',
    status: 'Completed',
    phase: 'Red',
    milestones: '8 of 8',
    hours: 3912,
    cost: 287100,
    budget: 300000,
    archived: true,
    archivedDate: 'Jan 10, 2025',
    previousManager: 'Priya Shah',
  },
]

export const usersSeed = [
  {
    id: 'USR-1001',
    name: 'Elena Vasquez',
    username: 'elena.v',
    email: 'elena@northstar.co',
    role: 'Admin',
    title: 'System Administrator',
    manager: '—',
    salary: '—',
  },
  {
    id: 'USR-1014',
    name: 'Maya Chen',
    username: 'maya.chen',
    email: 'maya@northstar.co',
    role: 'Manager',
    title: 'Engineering Manager',
    manager: '—',
    salary: '—',
  },
  {
    id: 'USR-1021',
    name: 'Noah Williams',
    username: 'noah.w',
    email: 'noah@northstar.co',
    role: 'Manager',
    title: 'Delivery Manager',
    manager: '—',
    salary: '—',
  },
  {
    id: 'USR-1032',
    name: 'Priya Shah',
    username: 'priya.s',
    email: 'priya@northstar.co',
    role: 'Manager',
    title: 'Program Manager',
    manager: '—',
    salary: '—',
  },
  {
    id: 'USR-1088',
    name: 'Aisha Patel',
    username: 'aisha.p',
    email: 'aisha@northstar.co',
    role: 'Employee',
    title: 'Product Designer',
    manager: 'Maya Chen',
    salary: '$112,000',
  },
  {
    id: 'USR-1092',
    name: 'Jon Bell',
    username: 'jon.bell',
    email: 'jon@northstar.co',
    role: 'Employee',
    title: 'Senior Engineer',
    manager: 'Maya Chen',
    salary: '$138,000',
  },
  {
    id: 'USR-1104',
    name: 'Sofia Reyes',
    username: 'sofia.r',
    email: 'sofia@northstar.co',
    role: 'Employee',
    title: 'Data Analyst',
    manager: 'Noah Williams',
    salary: '$96,000',
  },
  {
    id: 'USR-1117',
    name: 'Marcus Lee',
    username: 'marcus.l',
    email: 'marcus@northstar.co',
    role: 'Employee',
    title: 'QA Engineer',
    manager: 'Priya Shah',
    salary: '$102,000',
  },
]

const workLogsSeed = [
  {
    date: 'Jun 13, 2025',
    employee: 'Aisha Patel',
    project: 'Customer Portal Rebuild',
    milestone: 'Design system',
    hours: 8,
    rate: 53.85,
    cost: 430.8,
    corrected: '—',
  },
  {
    date: 'Jun 13, 2025',
    employee: 'Jon Bell',
    project: 'Customer Portal Rebuild',
    milestone: 'API integration',
    hours: 8,
    rate: 66.35,
    cost: 530.8,
    corrected: 'Jun 16, 2025',
  },
  {
    date: 'Jun 13, 2025',
    employee: 'Sofia Reyes',
    project: 'Finance Data Migration',
    milestone: 'Data validation',
    hours: 8,
    rate: 46.15,
    cost: 369.2,
    corrected: '—',
  },
  {
    date: 'Jun 12, 2025',
    employee: 'Marcus Lee',
    project: 'Support Operations Hub',
    milestone: 'Workflow testing',
    hours: 8,
    rate: 49.04,
    cost: 392.32,
    corrected: '—',
  },
  {
    date: 'Jun 12, 2025',
    employee: 'Jon Bell',
    project: 'Identity Platform Upgrade',
    milestone: 'Launch support',
    hours: 8,
    rate: 63.46,
    cost: 507.68,
    corrected: '—',
  },
]

// Names for ids used by the employee prototype's stored logs.
const employeeProjectNames = {
  1: 'Customer Portal Rebuild',
  2: 'Design Operations Launch',
  3: 'Developer Portal Refresh',
  4: 'Commerce Insights',
}
const employeeMilestoneNames = {
  12: 'Design system',
  22: 'Operating model',
  44: 'Insights release',
}

/** Seed work logs plus any workdays the employee workspace saved in this browser. */
export function loadWorkLogs() {
  try {
    const employeeLogs = readEmployeeLogs()
    return [
      ...workLogsSeed,
      ...employeeLogs.map((log) => ({
        date: formatDate(log.date),
        employee: 'Aisha Patel',
        project: employeeProjectNames[log.projectId] || 'Active project',
        milestone:
          employeeMilestoneNames[log.milestoneId] || 'Assigned milestone',
        hours: log.hours,
        rate: 53.85,
        cost: 430.8,
        corrected: '—',
      })),
    ]
  } catch {
    // Stored demo data is optional; ignore anything malformed.
    return workLogsSeed
  }
}

export const activities = [
  {
    time: 'Today, 10:42 AM',
    actor: 'Maya Chen',
    role: 'Manager',
    action: 'Requested milestone review',
    record: 'Customer Portal Rebuild',
    summary: 'Design system is ready for completion review.',
  },
  {
    time: 'Today, 9:18 AM',
    actor: 'Elena Vasquez',
    role: 'Admin',
    action: 'Corrected work log',
    record: 'Jon Bell · Jun 13',
    summary: 'Changed milestone from API foundation to API integration.',
  },
  {
    time: 'Yesterday, 4:35 PM',
    actor: 'Elena Vasquez',
    role: 'Admin',
    action: 'Updated budget',
    record: 'Finance Data Migration',
    summary: 'Estimated budget increased from $220,000 to $240,000.',
  },
  {
    time: 'Yesterday, 2:08 PM',
    actor: 'Priya Shah',
    role: 'Manager',
    action: 'Assigned employee',
    record: 'Support Operations Hub',
    summary: 'Marcus Lee assigned to Workflow testing.',
  },
  {
    time: 'Jun 12, 11:20 AM',
    actor: 'Elena Vasquez',
    role: 'Admin',
    action: 'Transferred employee',
    record: 'Sofia Reyes',
    summary: 'Reporting manager changed from Maya Chen to Noah Williams.',
  },
  {
    time: 'Jun 10, 3:44 PM',
    actor: 'Elena Vasquez',
    role: 'Admin',
    action: 'Archived project',
    record: 'Legacy Billing Consolidation',
    summary: 'Abandoned project moved to archive; history preserved.',
  },
]

// Milestones of the project shown in the admin project detail.
// prerequisiteIds drive the dependency map and the Prerequisites column.
export const milestonesSeed = [
  {
    id: 1,
    name: 'Research & requirements',
    dates: 'Feb 03 – Mar 07',
    prerequisiteIds: [],
    people: 'Aisha, Jon',
    hours: 320,
    status: 'Completed',
  },
  {
    id: 2,
    name: 'Design system',
    dates: 'Mar 10 – Apr 25',
    prerequisiteIds: [1],
    people: 'Aisha, Marcus',
    hours: 496,
    status: 'Awaiting review',
  },
  {
    id: 3,
    name: 'API integration',
    dates: 'Mar 10 – May 30',
    prerequisiteIds: [1],
    people: 'Jon',
    hours: 704,
    status: 'Available',
  },
  {
    id: 4,
    name: 'Portal build',
    dates: 'May 05 – Jul 18',
    prerequisiteIds: [2, 3],
    people: 'Aisha, Jon',
    hours: 640,
    status: 'Blocked',
  },
  {
    id: 5,
    name: 'QA & accessibility',
    dates: 'Jul 21 – Aug 15',
    prerequisiteIds: [4],
    people: 'Marcus',
    hours: 240,
    status: 'Blocked',
  },
  {
    id: 6,
    name: 'Launch',
    dates: 'Aug 18 – Aug 29',
    prerequisiteIds: [5],
    people: 'Unassigned',
    hours: 80,
    status: 'Blocked',
  },
]

export const projectPeople = [
  {
    name: 'Aisha Patel',
    title: 'Product Designer',
    manager: 'Maya Chen',
    milestone: 'Design system',
    workState: 'Waiting for review',
  },
  {
    name: 'Jon Bell',
    title: 'Senior Engineer',
    manager: 'Maya Chen',
    milestone: 'API integration',
    workState: 'Available',
  },
  {
    name: 'Marcus Lee',
    title: 'QA Engineer',
    manager: 'Maya Chen',
    milestone: 'Design system',
    workState: 'Waiting for review',
  },
]

export const adminNotifications = [
  {
    id: 1,
    title: 'Milestone review requested',
    detail: 'Design system · Customer Portal',
    read: false,
  },
  {
    id: 2,
    title: 'Project needs assignment',
    detail: 'Mobile Field Toolkit has no manager',
    read: true,
  },
]

// Dashboard: relative chart heights (percent) for the last six months.
export const monthlyHours = [
  { month: 'Jan', hours: 38, cost: 32 },
  { month: 'Feb', hours: 52, cost: 44 },
  { month: 'Mar', hours: 63, cost: 56 },
  { month: 'Apr', hours: 58, cost: 64 },
  { month: 'May', hours: 74, cost: 72 },
  { month: 'Jun', hours: 88, cost: 82 },
]

// Dashboard: projects approaching their end dates.
export const upcomingDeadlines = [
  {
    key: 'identity',
    day: 20,
    month: 'JUN',
    title: 'Identity Platform Upgrade',
    detail: '5 of 5 milestones complete',
    tone: 'Completed',
    label: 'Ready to close',
  },
  {
    key: 'portal',
    day: 18,
    month: 'JUL',
    title: 'Customer Portal Rebuild',
    detail: 'Portal build target · 35 days',
    tone: 'Red',
    label: 'High risk',
  },
  {
    key: 'finance',
    day: 15,
    month: 'AUG',
    title: 'Finance Data Migration',
    detail: 'Data validation target · 58 days',
    tone: 'Amber',
    label: 'Watch',
  },
]
