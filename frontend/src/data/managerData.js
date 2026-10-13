// Sample data for the manager workspace (signed in as Maya Chen), ported from
// the Figma prototype. Replace with API calls once the backend endpoints exist.
// Dates are ISO strings (YYYY-MM-DD).
import {
  DEMO_EMPLOYEE_ID,
  mergeStoredMilestones,
  readClosedProjectIds,
  readEmployeeLogs,
  readReviewRequests,
} from '../services/demoSync.js'
import { referenceToday } from './demoClock.js'

/** The prototype's fixed "today", used for schedule phases and the calendar. */
export { referenceToday }

export const MANAGER_NAME = 'Maya Chen'

const projectsSeed = [
  {
    id: 1,
    name: 'Customer Portal Rebuild',
    start: '2025-02-03',
    end: '2025-08-29',
    budget: 175000,
    cost: 186400,
    hours: 2480,
    employeeIds: [1, 2, 3, 4],
  },
  {
    id: 2,
    name: 'Design Operations Launch',
    start: '2025-04-07',
    end: '2025-10-17',
    budget: 128000,
    cost: 67480,
    hours: 1128,
    employeeIds: [1, 2, 3, 5],
  },
  {
    id: 3,
    name: 'Developer Portal Refresh',
    start: '2025-01-20',
    end: '2025-07-11',
    budget: 150000,
    cost: 132600,
    hours: 1920,
    employeeIds: [1, 2, 4],
  },
  {
    id: 4,
    name: 'Commerce Insights',
    start: '2025-05-12',
    end: '2025-12-12',
    budget: 94000,
    cost: 101350,
    hours: 1360,
    employeeIds: [2, 3, 5],
  },
]

export const employeesSeed = [
  {
    id: 1,
    employeeId: 'USR-1088',
    first: 'Aisha',
    last: 'Patel',
    username: 'aisha.p',
    email: 'aisha@northstar.co',
    title: 'Product Designer',
    salary: 112000,
  },
  {
    id: 2,
    employeeId: 'USR-1092',
    first: 'Jon',
    last: 'Bell',
    username: 'jon.bell',
    email: 'jon@northstar.co',
    title: 'Senior Engineer',
    salary: 138000,
  },
  {
    id: 3,
    employeeId: 'USR-1124',
    first: 'Mina',
    last: 'Park',
    username: 'mina.park',
    email: 'mina@northstar.co',
    title: 'UX Researcher',
    salary: 108000,
  },
  {
    id: 4,
    employeeId: 'USR-1130',
    first: 'Theo',
    last: 'Grant',
    username: 'theo.grant',
    email: 'theo@northstar.co',
    title: 'Frontend Engineer',
    salary: 126000,
  },
  {
    id: 5,
    employeeId: 'USR-1142',
    first: 'Leila',
    last: 'Morgan',
    username: 'leila.m',
    email: 'leila@northstar.co',
    title: 'Business Analyst',
    salary: 98000,
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
    hours: 320,
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
    hours: 496,
    status: 'Awaiting review',
    requester: 'Aisha Patel',
    requestDate: 'Jun 16, 2025',
  },
  {
    id: 13,
    projectId: 1,
    name: 'API integration',
    start: '2025-03-10',
    end: '2025-06-27',
    prerequisiteIds: [11],
    employeeIds: [2],
    hours: 704,
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
    hours: 640,
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
    hours: 320,
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
    hours: 184,
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
    hours: 480,
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
    hours: 464,
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
    hours: 480,
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
    hours: 960,
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
    hours: 480,
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
    hours: 320,
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
    hours: 416,
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
    hours: 480,
    status: 'Available',
  },
  {
    id: 44,
    projectId: 4,
    name: 'Insights release',
    start: '2025-09-15',
    end: '2025-12-12',
    prerequisiteIds: [42, 43],
    employeeIds: [5],
    hours: 144,
    status: 'Blocked',
  },
]

const logsSeed = [
  {
    id: 1,
    date: '2025-06-17',
    employeeId: 1,
    projectId: 1,
    milestoneId: 12,
    hours: 8,
    cost: 430.8,
  },
  {
    id: 2,
    date: '2025-06-17',
    employeeId: 2,
    projectId: 4,
    milestoneId: 43,
    hours: 8,
    cost: 530.8,
  },
  {
    id: 3,
    date: '2025-06-17',
    employeeId: 3,
    projectId: 1,
    milestoneId: 12,
    hours: 8,
    cost: 415.36,
  },
  {
    id: 4,
    date: '2025-06-16',
    employeeId: 4,
    projectId: 1,
    milestoneId: 14,
    hours: 8,
    cost: 484.64,
  },
  {
    id: 5,
    date: '2025-06-16',
    employeeId: 5,
    projectId: 2,
    milestoneId: 23,
    hours: 8,
    cost: 376.96,
  },
  {
    id: 6,
    date: '2025-06-13',
    employeeId: 1,
    projectId: 2,
    milestoneId: 22,
    hours: 8,
    cost: 430.8,
  },
  {
    id: 7,
    date: '2025-06-13',
    employeeId: 2,
    projectId: 1,
    milestoneId: 13,
    hours: 8,
    cost: 530.8,
  },
  {
    id: 8,
    date: '2025-06-12',
    employeeId: 3,
    projectId: 4,
    milestoneId: 42,
    hours: 8,
    cost: 415.36,
  },
  {
    id: 9,
    date: '2025-06-12',
    employeeId: 4,
    projectId: 3,
    milestoneId: 33,
    hours: 8,
    cost: 484.64,
  },
  {
    id: 10,
    date: '2025-06-11',
    employeeId: 5,
    projectId: 4,
    milestoneId: 44,
    hours: 8,
    cost: 376.96,
  },
]

const noticesSeed = [
  {
    id: 1,
    title: 'Milestone review requested',
    detail: 'Aisha Patel · Design system',
    projectId: 1,
    milestoneId: 12,
    read: false,
  },
  {
    id: 2,
    title: 'Employee waiting on prerequisites',
    detail: 'Theo Grant · Portal build',
    projectId: 1,
    milestoneId: 14,
    read: false,
  },
  {
    id: 3,
    title: 'Project is over budget',
    detail: 'Customer Portal Rebuild · 107% used',
    projectId: 1,
    read: true,
  },
  {
    id: 4,
    title: 'Milestone assignment needed',
    detail: 'Design Operations Launch · Jon Bell',
    projectId: 2,
    read: false,
  },
]

/** Seed projects, with the ones closed in this browser marked closed. */
export function loadManagerProjects() {
  const closedIds = readClosedProjectIds()
  return projectsSeed.map((project) =>
    closedIds.includes(project.id)
      ? { ...project, closed: 'Completed' }
      : project,
  )
}

/** Seed milestones plus stored changes; pending employee requests show their requester. */
export function loadManagerMilestones() {
  const requestedIds = new Set(
    readReviewRequests().map((request) => request.milestoneId),
  )
  return mergeStoredMilestones(milestonesSeed).map((milestone) =>
    requestedIds.has(milestone.id)
      ? { ...milestone, requester: 'Aisha Patel', requestDate: 'Today' }
      : milestone,
  )
}

/**
 * Seed notifications plus one "review requested" notice for each employee
 * request made in this browser that the seed doesn't already cover.
 */
export function loadManagerNotices() {
  const requests = readReviewRequests().filter(
    (request) =>
      !noticesSeed.some((notice) => notice.milestoneId === request.milestoneId),
  )
  return [
    ...requests.map((request) => ({
      id: `review-${request.milestoneId}`,
      title: 'Milestone review requested',
      detail: `Aisha Patel · ${
        milestonesSeed.find((item) => item.id === request.milestoneId)?.name
      }`,
      projectId: request.projectId,
      milestoneId: request.milestoneId,
      read: false,
    })),
    ...noticesSeed,
  ]
}

/** Seed logs plus workdays the demo employee logged in this browser. */
export function loadManagerLogs() {
  return [
    ...logsSeed,
    ...readEmployeeLogs()
      .filter((log) => !logsSeed.some((item) => item.id === log.id))
      .map((log) => ({ ...log, employeeId: DEMO_EMPLOYEE_ID, cost: 430.8 })),
  ]
}
