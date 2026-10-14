import { useLocation, useNavigate } from 'react-router-dom'

/** 'workLogs' → 'work-logs', for the URL. */
const toSlug = (key) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

/**
 * Where the user is in a workspace, kept in the URL so a refresh (or the Back button)
 * returns there: #/<base>/<page>?project=5&user=3.
 * base: the workspace's route, e.g. '/admin'. pages: its { key: label } map (e.g. ADMIN_PAGES);
 * the URL uses the key ('work-logs') and an unknown or missing one means the first page.
 * Returns { page, ids, go }:
 * - page: the current page's label;
 * - ids: the numeric ids in the query, e.g. { project: 5 };
 * - go({ page, ...ids }): moves there. A page starts without ids (pass any it needs);
 *   without a page the ids are merged into the current ones, and null removes one.
 */
export function useWorkspaceLocation(base, pages) {
  const location = useLocation()
  const navigate = useNavigate()
  const keys = Object.keys(pages)
  const slug = location.pathname.slice(base.length).split('/')[1]
  const pageKey = keys.find((key) => toSlug(key) === slug) ?? keys[0]
  const ids = {}
  new URLSearchParams(location.search).forEach((value, name) => {
    if (/^\d+$/.test(value)) ids[name] = Number(value)
  })

  const go = ({ page, ...changes }) => {
    const nextKey = page ? keys.find((key) => pages[key] === page) : pageKey
    const query = new URLSearchParams()
    Object.entries({ ...(page ? {} : ids), ...changes }).forEach(([name, value]) => {
      if (value != null) query.set(name, value)
    })
    const search = query.toString()
    navigate(`${base}/${toSlug(nextKey)}${search ? `?${search}` : ''}`)
  }

  return { page: pages[pageKey], ids, go }
}
