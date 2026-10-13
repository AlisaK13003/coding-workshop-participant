import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FolderKanban,
  Plus,
  Users,
} from 'lucide-react'
import { ActivityList } from '../../components/activity/ActivityList.jsx'
import { DeadlineList } from '../../components/projects/DeadlineList.jsx'
import {
  Badge,
  Button,
  PageHeading,
  Panel,
  StatCard,
} from '../../components/ui'
import {
  activities,
  monthlyHours,
  upcomingDeadlines,
} from '../../data/adminData.js'
import { ADMIN_DIALOGS } from './adminConfig.js'
import { HoursChart } from './HoursChart.jsx'
import { ProjectTable } from './ProjectTable.jsx'
import { isActiveProject } from './projectFilters.js'
import './DashboardPage.css'

const deadlineItems = upcomingDeadlines.map((deadline) => ({
  ...deadline,
  status: <Badge tone={deadline.tone}>{deadline.label}</Badge>,
}))

/** Admin overview: key numbers, attention items, active projects, spending and activity. */
export function DashboardPage({ projects, onOpenProject, onOpenDialog }) {
  return (
    <>
      <PageHeading
        eyebrow="Overview"
        title="Good morning, Elena"
        description="Here’s what needs your attention across the project portfolio."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => onOpenDialog(ADMIN_DIALOGS.createUser)}
            >
              <Plus size={16} />
              Create user
            </Button>
            <Button onClick={() => onOpenDialog(ADMIN_DIALOGS.createProject)}>
              <Plus size={16} />
              Create project
            </Button>
          </>
        }
      />
      <div className="stats-grid">
        <StatCard
          label="Active projects"
          value="4"
          note="2 approaching end dates"
          icon={FolderKanban}
          accent
        />
        <StatCard
          label="Awaiting assignment"
          value="1"
          note="Manager and team required"
          icon={CircleAlert}
        />
        <StatCard
          label="Total users"
          value="28"
          note="2 admins · 5 managers · 21 employees"
          icon={Users}
        />
        <StatCard
          label="Pending reviews"
          value="3"
          note="Oldest request is 2 days"
          icon={CheckCircle2}
        />
      </div>
      <Panel className="attention-panel">
        <div>
          <span className="attention-icon">
            <CircleAlert size={19} />
          </span>
          <p>
            <strong>3 items need attention</strong>
            <span>
              One project needs assignment, one is over budget, and three
              milestone reviews are pending.
            </span>
          </p>
        </div>
        <Button variant="secondary">Review items</Button>
      </Panel>
      <Panel
        title="Active projects"
        description="Schedule, milestones, hours, and budget at a glance."
        actions={
          <Button variant="ghost">
            View all <ChevronRight size={16} />
          </Button>
        }
      >
        <ProjectTable
          projects={projects.filter(isActiveProject)}
          onOpen={onOpenProject}
          compact
        />
      </Panel>
      <div className="dashboard-lower">
        <Panel
          title="Hours & labor spending"
          description="Last six months"
          actions={<Badge>18,604 total hours</Badge>}
        >
          <HoursChart data={monthlyHours} />
        </Panel>
        <Panel title="Approaching end dates" description="Within the next 60 days">
          <DeadlineList items={deadlineItems} />
        </Panel>
      </div>
      <Panel
        title="Recent activity"
        description="Administrative and manager actions"
      >
        <ActivityList items={activities.slice(0, 4)} />
      </Panel>
    </>
  )
}
