import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import RequireAdmin from "./components/RequireAdmin"
import DashboardLayout from "./components/DashboardLayout"
import Login from "./pages/Login"
import Overview from "./pages/Overview"
import Users from "./pages/Users"
import Orders from "./pages/Orders"
import Runners from "./pages/Runners"
import Payouts from "./pages/Payouts"
import Disputes from "./pages/Disputes"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAdmin>
                <DashboardLayout />
              </RequireAdmin>
            }
          >
            <Route path="/" element={<Overview />} />
            <Route path="/users" element={<Users />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/runners" element={<Runners />} />
            <Route path="/payouts" element={<Payouts />} />
            <Route path="/disputes" element={<Disputes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
