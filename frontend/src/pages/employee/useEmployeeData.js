import { combineQueries, useApiQuery } from '../../hooks/useApiQuery.js'
import { useCurrentUser } from '../../hooks/useSession.js'
import { loadPortfolio } from '../../services/portfolioApi.js'
import { getUser } from '../../services/usersApi.js'
import { listWorkLogs } from '../../services/workLogsApi.js'
import { getAssignments } from './employeeSelectors.js'

/**
 * Everything the employee workspace shows, from the API: the projects they're on
 * (with milestones and teammates), their own work logs and their profile.
 * Returns a query whose data is { projects, milestones, members, logs, profile, assignments }.
 */
export function useEmployeeData() {
  const user = useCurrentUser()
  const query = combineQueries(
    useApiQuery(loadPortfolio, []),
    useApiQuery(() => listWorkLogs(), []),
    useApiQuery(() => getUser(user.id), [user.id]),
  )
  const [portfolio, logs, profile] = query.data ?? []
  return {
    ...query,
    data: query.data && {
      ...portfolio,
      logs,
      profile,
      assignments: getAssignments(portfolio, user.id),
    },
  }
}
