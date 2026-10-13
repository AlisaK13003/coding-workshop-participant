// Sample data for the employee workspace (signed in as Aisha Patel), ported
// from the Figma prototype. Replace with API calls once the backend exists.
// Dates are ISO strings (YYYY-MM-DD).
import {
  mergeStoredMilestones,
  readClosedProjectIds,
  readEmployeeLogs,
} from '../services/demoSync.js'
import { TODAY_KEY, referenceToday } from './demoClock.js'

export const signedInEmployee = {
  id: 1,
  employeeId: 'USR-1088',
  first: 'Aisha',
  last: 'Patel',
  username: 'aisha.p',
  email: 'aisha@northstar.co',
  title: 'Product Designer',
  manager: 'Maya Chen',
}

/** The prototype's fixed "today": a Wednesday. */
export { TODAY_KEY, referenceToday }

const projectsSeed = [
  {
    id: 1,
    name: 'Customer Portal Rebuild',
    manager: 'Maya Chen',
    start: '2025-02-03',
    end: '2025-08-29',
    employeeIds: [1, 2, 3, 4],
  },
  {
    id: 2,
    name: 'Design Operations Launch',
    manager: 'Maya Chen',
    start: '2025-04-07',
    end: '2025-10-17',
    employeeIds: [1, 2, 3, 5],
  },
  {
    id: 3,
    name: 'Developer Portal Refresh',
    manager: 'Maya Chen',
    start: '2025-01-20',
    end: '2025-07-11',
    employeeIds: [1, 2, 4],
  },
  {
    id: 4,
    name: 'Commerce Insights',
    manager: 'Maya Chen',
    start: '2025-05-12',
    end: '2025-12-12',
    employeeIds: [1, 2, 3, 5],
  },
]

const milestonesSeed = [
  {
    id: 11,
    projectId: 1,
    name: 'Research & requirements',
    start: '2025-02-03',
    end: '2025-03-07',
    prerequisiteIds: [],
    employeeIds: [],
    totalHours: 320,
    status: 'Completed',
  },
  {
    id: 12,
    projectId: 1,
    name: 'Design system',
    start: '2025-03-10',
    end: '2025-04-25',
    prerequisiteIds: [11],
    employeeIds: [1, 3],
    totalHours: 496,
    status: 'Awaiting review',
  },
  {
    id: 13,
    projectId: 1,
    name: 'API integration',
    start: '2025-03-10',
    end: '2025-06-27',
    prerequisiteIds: [11],
    employeeIds: [2],
    totalHours: 704,
    status: 'Available',
  },
  {
    id: 14,
    projectId: 1,
    name: 'Portal build',
    start: '2025-06-30',
    end: '2025-07-25',
    prerequisiteIds: [12, 13],
    employeeIds: [4],
    totalHours: 640,
    status: 'Blocked',
  },
  {
    id: 15,
    projectId: 1,
    name: 'QA & launch',
    start: '2025-07-28',
    end: '2025-08-29',
    prerequisiteIds: [14],
    employeeIds: [],
    totalHours: 320,
    status: 'Blocked',
  },
  {
    id: 21,
    projectId: 2,
    name: 'Discovery',
    start: '2025-04-07',
    end: '2025-05-02',
    prerequisiteIds: [],
    employeeIds: [],
    totalHours: 184,
    status: 'Completed',
  },
  {
    id: 22,
    projectId: 2,
    name: 'Operating model',
    start: '2025-05-05',
    end: '2025-07-18',
    prerequisiteIds: [21],
    employeeIds: [1, 3],
    totalHours: 480,
    status: 'Available',
  },
  {
    id: 23,
    projectId: 2,
    name: 'Rollout',
    start: '2025-07-21',
    end: '2025-10-17',
    prerequisiteIds: [22],
    employeeIds: [5],
    totalHours: 464,
    status: 'Blocked',
  },
  {
    id: 31,
    projectId: 3,
    name: 'Information architecture',
    start: '2025-01-20',
    end: '2025-03-07',
    prerequisiteIds: [],
    employeeIds: [],
    totalHours: 480,
    status: 'Completed',
  },
  {
    id: 32,
    projectId: 3,
    name: 'Component build',
    start: '2025-03-10',
    end: '2025-05-30',
    prerequisiteIds: [31],
    employeeIds: [],
    totalHours: 960,
    status: 'Completed',
  },
  {
    id: 33,
    projectId: 3,
    name: 'Release readiness',
    start: '2025-06-02',
    end: '2025-07-11',
    prerequisiteIds: [32],
    employeeIds: [2, 4],
    totalHours: 480,
    status: 'Completed',
  },
  {
    id: 41,
    projectId: 4,
    name: 'Metrics definition',
    start: '2025-05-12',
    end: '2025-06-13',
    prerequisiteIds: [],
    employeeIds: [],
    totalHours: 320,
    status: 'Completed',
  },
  {
    id: 42,
    projectId: 4,
    name: 'Dashboard design',
    start: '2025-06-16',
    end: '2025-08-15',
    prerequisiteIds: [41],
    employeeIds: [3],
    totalHours: 416,
    status: 'Available',
  },
  {
    id: 43,
    projectId: 4,
    name: 'Data pipeline',
    start: '2025-06-16',
    end: '2025-09-12',
    prerequisiteIds: [41],
    employeeIds: [2],
    totalHours: 480,
    status: 'Available',
  },
  {
    id: 44,
    projectId: 4,
    name: 'Insights release',
    start: '2025-09-15',
    end: '2025-12-12',
    prerequisiteIds: [42, 43],
    employeeIds: [1, 5],
    totalHours: 144,
    status: 'Blocked',
  },
]

export const teammates = [
  { id: 1, name: 'Aisha Patel', title: 'Product Designer' },
  { id: 2, name: 'Jon Bell', title: 'Senior Engineer' },
  { id: 3, name: 'Mina Park', title: 'UX Researcher' },
  { id: 4, name: 'Theo Grant', title: 'Frontend Engineer' },
  { id: 5, name: 'Leila Morgan', title: 'Business Analyst' },
]

const logsSeed = [
  {
    id: 101,
    date: '2025-06-17',
    submittedAt: 'Jun 17, 2025 · 5:12 PM',
    projectId: 1,
    milestoneId: 12,
    hours: 8,
  },
  {
    id: 102,
    date: '2025-06-16',
    submittedAt: 'Jun 16, 2025 · 4:48 PM',
    projectId: 2,
    milestoneId: 22,
    hours: 8,
  },
  {
    id: 103,
    date: '2025-06-13',
    submittedAt: 'Jun 13, 2025 · 4:56 PM',
    projectId: 2,
    milestoneId: 22,
    hours: 8,
  },
  {
    id: 104,
    date: '2025-06-12',
    submittedAt: 'Jun 12, 2025 · 5:03 PM',
    projectId: 1,
    milestoneId: 12,
    hours: 8,
  },
  {
    id: 105,
    date: '2025-06-11',
    submittedAt: 'Jun 11, 2025 · 4:41 PM',
    projectId: 1,
    milestoneId: 11,
    hours: 8,
    historical: true,
  },
  {
    id: 106,
    date: '2025-06-10',
    submittedAt: 'Jun 10, 2025 · 5:01 PM',
    projectId: 1,
    milestoneId: 11,
    hours: 8,
  },
]

const noticesSeed = [
  {
    id: 1,
    title: 'Milestone review requested',
    detail: 'Design system is awaiting Maya’s review.',
    projectId: 1,
    read: false,
  },
  {
    id: 2,
    title: 'Milestone is now available',
    detail: 'Operating model unlocked after Discovery completed.',
    projectId: 2,
    read: false,
  },
  {
    id: 3,
    title: 'Moved to a dependent milestone',
    detail:
      'You were assigned to Insights release and must wait for prerequisites.',
    projectId: 4,
    read: true,
  },
  {
    id: 4,
    title: 'Assignment needed',
    detail: 'Developer Portal Refresh has no current milestone for you.',
    projectId: 3,
    read: false,
  },
]

/** Active projects: seed projects minus those a manager closed in this browser. */
export function loadEmployeeProjects() {
  const closedIds = readClosedProjectIds()
  return projectsSeed.filter((project) => !closedIds.includes(project.id))
}

/** Seed milestones plus manager changes and pending review requests. */
export function loadEmployeeMilestones() {
  return mergeStoredMilestones(milestonesSeed)
}

/** Seed logs plus workdays logged in this browser. */
export function loadEmployeeLogs() {
  const saved = readEmployeeLogs()
  return [
    ...logsSeed,
    ...saved.filter((log) => !logsSeed.some((base) => base.id === log.id)),
  ]
}

/** Seed notifications for the given (visible) project ids. */
export function loadEmployeeNotices(projectIds) {
  return noticesSeed.filter(
    (notice) => !notice.projectId || projectIds.has(notice.projectId),
  )
}
