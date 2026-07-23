import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { RunnerProfileProvider } from "./context/RunnerProfileContext"
import RequireAuth from "./components/RequireAuth"
import RequireApprovedRunner from "./components/RequireApprovedRunner"
import AppLayout from "./components/AppLayout"

import Login from "./pages/Login"
import ApplyAsRunner from "./pages/ApplyAsRunner"
import PendingApproval from "./pages/PendingApproval"
import Dashboard from "./pages/Dashboard"
import Payouts from "./pages/Payouts"
import Profile from "./pages/Profile"

function Gated({ children }) {
  return (
    <RequireAuth>
      <RunnerProfileProvider>{children}</RunnerProfileProvider>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/apply" element={<Gated><ApplyAsRunner /></Gated>} />
          <Route path="/pending" element={<Gated><PendingApproval /></Gated>} />

          <Route
            element={
              <Gated>
                <RequireApprovedRunner>
                  <AppLayout />
                </RequireApprovedRunner>
              </Gated>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/payouts" element={<Payouts />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}