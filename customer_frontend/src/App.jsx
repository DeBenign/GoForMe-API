import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import RequireAuth from "./components/RequireAuth"
import AppLayout from "./components/AppLayout"
import Login from "./pages/Login"
import Register from "./pages/Register"
import VerifyOtp from "./pages/VerifyOtp"
import Home from "./pages/Home"
import NewErrand from "./pages/NewErrand"
import Orders from "./pages/Orders"
import OrderDetail from "./pages/OrderDetail"
import Wallet from "./pages/Wallet"
import Disputes from "./pages/Disputes"
import DisputeNew from "./pages/DisputeNew"
import Profile from "./pages/Profile"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          {/* Full-bleed detail routes (no bottom nav) */}
          <Route path="/new-errand" element={<RequireAuth><NewErrand /></RequireAuth>} />
          <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
          <Route path="/disputes/new" element={<RequireAuth><DisputeNew /></RequireAuth>} />

          {/* Tabbed app shell */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/" element={<Home />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
