// User helpers. Users come from the API as { id, display_id, username, first_name,
// last_name, name, email, job_title, role, manager, archived_at, annual_salary? }.

/** The three roles; compare with these rather than typing the strings. */
export const ROLE = { admin: 'admin', manager: 'manager', employee: 'employee' }

export const ROLES = Object.values(ROLE)

/** 'manager' → 'Manager'. */
export function roleLabel(role) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

/** What the profile menu shows: { name, subtitle }. user is the signed-in user from the session. */
export function toShellUser(user) {
  return { name: `${user.first_name} ${user.last_name}`, subtitle: user.job_title }
}


