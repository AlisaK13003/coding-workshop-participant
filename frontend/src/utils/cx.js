/** Join truthy class names into one className string. */
export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}
