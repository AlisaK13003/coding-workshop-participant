import { combineQueries, useApiQuery } from '../../hooks/useApiQuery.js'
import { useCurrentUser } from '../../hooks/useSession.js'
import { loadPortfolio } from '../../services/portfolioApi.js'
import { listUsers } from '../../services/usersApi.js'
import { listWorkLogs } from '../../services/workLogsApi.js'

/**
 * Everything the manager workspace shows, from the API: their active projects with
 * milestones and members, their employees, and those employees' visible work logs.
 * Returns a query whose data is { projects, milestones, members, employees, logs, profile }.
 * It reloads after every change (see useMutation), so pages always show saved data.
 */
export function useManagerData() {
  const query = combineQueries(
    useApiQuery(loadPortfolio, []),
    // A manager's user list is themselves plus their employees.
    useApiQuery(() => listUsers(), []),
    useApiQuery(() => listWorkLogs(), []),
  )
  const user = useCurrentUser()
  const [portfolio, users, logs] = query.data ?? []
  return {
    ...query,
    data: query.data && {
      ...portfolio,
      employees: users.filter(({ role }) => role === 'employee'),
      logs,
      profile: users.find(({ id }) => id === user.id),
    },
  }
}
