import { cx } from '../../utils/cx.js'
import { Avatar } from './Avatar.jsx'
import './DetailHero.css'

/**
 * Header of a detail page (project, user, employee): badges, big title,
 * subtitle and actions. Pass `avatarName` to show an avatar beside the title.
 */
export function DetailHero({
  avatarName,
  badges,
  title,
  subtitle,
  actions,
  className,
}) {
  const heading = (
    <div>
      {badges && <div className="detail-badges">{badges}</div>}
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
  return (
    <div className={cx('detail-hero', className)}>
      {avatarName ? (
        <div className="user-hero">
          <Avatar name={avatarName} />
          {heading}
        </div>
      ) : (
        heading
      )}
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  )
}
