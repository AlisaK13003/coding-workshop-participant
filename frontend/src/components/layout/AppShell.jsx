import { useDisclosure } from '../../hooks/useDisclosure.js'
import { NotificationMenu } from './NotificationMenu.jsx'
import { ProfileMenu } from './ProfileMenu.jsx'
import { Sidebar } from './Sidebar.jsx'
import { TopBar } from './TopBar.jsx'
import './AppShell.css'

/**
 * Workspace layout shared by every role: sidebar navigation, top bar with
 * notifications and profile menu, and the page content as children.
 * See the prop list in Sidebar, NotificationMenu and ProfileMenu.
 */
export function AppShell({
  brandTag,
  workspaceLabel,
  title,
  navItems,
  activeNav,
  onNavigate,
  sidebarFooter,
  user,
  profileSummary,
  profileActions,
  notifications = [],
  onNotificationSelect,
  onMarkAllNotificationsRead,
  children,
}) {
  const mobileNav = useDisclosure()

  return (
    <div className="app-shell">
      <Sidebar
        brandTag={brandTag}
        items={navItems}
        active={activeNav}
        onNavigate={(name) => {
          onNavigate(name)
          mobileNav.close()
        }}
        footer={sidebarFooter}
        isOpen={mobileNav.isOpen}
      />
      <div className="main-wrap">
        <TopBar
          workspaceLabel={workspaceLabel}
          title={title}
          onMenuClick={mobileNav.toggle}
        >
          <NotificationMenu
            items={notifications}
            onSelect={onNotificationSelect}
            onMarkAllRead={onMarkAllNotificationsRead}
          />
          <ProfileMenu
            user={user}
            summary={profileSummary}
            actions={profileActions}
          />
        </TopBar>
        <main>{children}</main>
      </div>
    </div>
  )
}
