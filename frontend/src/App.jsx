import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import AdminApp from './pages/admin/AdminApp.jsx'
import EmployeeApp from './pages/employee/EmployeeApp.jsx'
import ManagerApp from './pages/manager/ManagerApp.jsx'

/** Route table: sign-in page plus one workspace per role. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/manager/*" element={<ManagerApp />} />
      <Route path="/employee/*" element={<EmployeeApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
