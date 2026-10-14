import { useState } from 'react'
import { ActivityList } from '../../components/activity/ActivityList.jsx'
import {
  Button,
  PageHeading,
  Panel,
  QueryContent,
  SearchBox,
  Select,
} from '../../components/ui'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { listActivity } from '../../services/activityApi.js'
import { listUsers } from '../../services/usersApi.js'
import { ACTION_TYPES, toActivityItem } from '../../utils/activity.js'
import { includesText } from '../../utils/text.js'
import { ROLES, roleLabel } from '../../utils/users.js'

const PAGE_SIZE = 50

/** Searchable audit trail of every change, filtered by the API, 50 entries per page. */
export function ActivityPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ actor_id: '', role: '', action: '' })
  const [offset, setOffset] = useState(0)
  const activity = useApiQuery(
    () => listActivity({ ...filters, limit: PAGE_SIZE, offset }),
    [filters, offset],
  )
  const actors = useApiQuery(() => listUsers({ include_archived: 'true' }), [])
  const setFilter = (name) => (value) => {
    setFilters((current) => ({ ...current, [name]: value }))
    setOffset(0)
  }

  return (
    <>
      <PageHeading
        eyebrow="Audit trail"
        title="Activity log"
        description="A searchable record of every change to projects, milestones, people and work logs."
      />
      <Panel>
        <div className="toolbar toolbar-wrap">
          <SearchBox value={search} onChange={setSearch} placeholder="Search this page" />
          <div className="filters">
            <Select value={filters.actor_id} onChange={setFilter('actor_id')} aria-label="Actor">
              <option value="">All actors</option>
              {(actors.data ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
            <Select value={filters.role} onChange={setFilter('role')} aria-label="Role">
              <option value="">All roles</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </Select>
            <Select value={filters.action} onChange={setFilter('action')} aria-label="Action type">
              <option value="">All action types</option>
              {ACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <QueryContent query={activity} loadingLabel="Loading activity…">
          {(page) => (
            <>
              <ActivityList
                items={page.items
                  .map(toActivityItem)
                  .filter((item) =>
                    includesText(`${item.actor} ${item.action} ${item.record} ${item.summary}`, search),
                  )}
              />
              <div className="pager">
                <span>
                  {page.total ? `${page.offset + 1}–${page.offset + page.items.length} of ${page.total}` : 'No entries'}
                </span>
                {page.total > PAGE_SIZE && (
                  <>
                    <Button
                      variant="secondary"
                      disabled={page.offset === 0}
                      onClick={() => setOffset(Math.max(page.offset - PAGE_SIZE, 0))}
                    >
                      Newer
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={page.offset + page.items.length >= page.total}
                      onClick={() => setOffset(page.offset + PAGE_SIZE)}
                    >
                      Older
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </QueryContent>
      </Panel>
    </>
  )
}
