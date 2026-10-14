import { Navigate, Route, Routes } from 'react-router-dom'
import RequireRole from './components/auth/RequireRole.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import AdminApp from './pages/admin/AdminApp.jsx'
import EmployeeApp from './pages/employee/EmployeeApp.jsx'
import ManagerApp from './pages/manager/ManagerApp.jsx'

/** Route table: sign-in and first-admin sign-up, plus one workspace per role, each open only to that role. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/admin/*" element={<RequireRole role="admin"><AdminApp /></RequireRole>} />
      <Route path="/manager/*" element={<RequireRole role="manager"><ManagerApp /></RequireRole>} />
      <Route path="/employee/*" element={<RequireRole role="employee"><EmployeeApp /></RequireRole>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
