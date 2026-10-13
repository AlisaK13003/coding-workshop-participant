import { useState } from 'react'
import { Clock3, Plus } from 'lucide-react'
import {
  Button,
  Input,
  PageHeading,
  Panel,
  SearchBox,
  Select,
} from '../../components/ui'
import { includesText } from '../../utils/text.js'
import { ADMIN_DIALOGS } from './adminConfig.js'
import { AdminWorkLogTable } from './AdminWorkLogTable.jsx'

/** Every workday across all projects, searchable, with historical entry creation. */
export function WorkLogsPage({ workLogs, onOpenDialog }) {
  const [search, setSearch] = useState('')
  const visible = workLogs.filter((log) =>
    includesText(`${log.employee} ${log.project} ${log.milestone}`, search),
  )

  return (
    <>
      <PageHeading
        eyebrow="Time & cost"
        title="Work logs"
        description="Review employee workdays across active, closed, and archived projects."
        actions={
          <Button onClick={() => onOpenDialog(ADMIN_DIALOGS.addWorkLog)}>
            <Plus size={16} />
            Add historical workday
          </Button>
        }
      />
      <Panel>
        <div className="toolbar toolbar-wrap">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search employee, project, or milestone"
          />
          <div className="filters">
            <Input type="date" aria-label="From date" />
            <Input type="date" aria-label="To date" />
            <Select>
              <option>All managers</option>
              <option>Maya Chen</option>
            </Select>
            <Select>
              <option>All projects</option>
              <option>Customer Portal Rebuild</option>
            </Select>
          </div>
        </div>
        <div className="info-strip">
          <Clock3 size={16} />
          Work date is distinct from the date an entry was created or corrected.
          Historical rates remain unchanged after salary updates.
        </div>
        <AdminWorkLogTable logs={visible} />
      </Panel>
    </>
  )
}
