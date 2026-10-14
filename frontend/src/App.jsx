import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RequireRole from './components/auth/RequireRole.jsx'
import { LoadingState } from './components/ui'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import { ROLE } from './utils/users.js'

// Each workspace is its own download, fetched on sign-in, so the sign-in page stays small
// and people only load the screens for their role.
const AdminApp = lazy(() => import('./pages/admin/AdminApp.jsx'))
const ManagerApp = lazy(() => import('./pages/manager/ManagerApp.jsx'))
const EmployeeApp = lazy(() => import('./pages/employee/EmployeeApp.jsx'))

/** Route table: sign-in and first-admin sign-up, plus one workspace per role, each open only to that role. */
export default function App() {
  return (
    <Suspense fallback={<LoadingState label="Loading your workspace…" />}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin/*" element={<RequireRole role={ROLE.admin}><AdminApp /></RequireRole>} />
        <Route path="/manager/*" element={<RequireRole role={ROLE.manager}><ManagerApp /></RequireRole>} />
        <Route path="/employee/*" element={<RequireRole role={ROLE.employee}><EmployeeApp /></RequireRole>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
