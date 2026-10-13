import { useState } from 'react'
import { ActivityList } from '../../components/activity/ActivityList.jsx'
import {
  Input,
  PageHeading,
  Panel,
  SearchBox,
  Select,
} from '../../components/ui'
import { activities } from '../../data/adminData.js'
import { includesText } from '../../utils/text.js'

/** Searchable audit trail of admin and manager changes. */
export function ActivityPage() {
  const [search, setSearch] = useState('')
  const visible = activities.filter((item) =>
    includesText(
      `${item.actor} ${item.action} ${item.record} ${item.summary}`,
      search,
    ),
  )

  return (
    <>
      <PageHeading
        eyebrow="Audit trail"
        title="Activity log"
        description="A searchable record of administrative and manager changes."
      />
      <Panel>
        <div className="toolbar toolbar-wrap">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search actions and records"
          />
          <div className="filters">
            <Input type="date" aria-label="From date" />
            <Input type="date" aria-label="To date" />
            <Select>
              <option>All actors</option>
              <option>Elena Vasquez</option>
              <option>Maya Chen</option>
            </Select>
            <Select>
              <option>All roles</option>
              <option>Admin</option>
              <option>Manager</option>
            </Select>
            <Select>
              <option>All action types</option>
              <option>Assignments</option>
              <option>Project changes</option>
              <option>Work log corrections</option>
            </Select>
          </div>
        </div>
        <ActivityList items={visible} />
      </Panel>
    </>
  )
}
