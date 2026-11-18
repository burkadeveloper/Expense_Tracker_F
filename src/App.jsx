import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import PhoneLogin from './pages/PhoneLogin'
import GoogleSuccess from './pages/GoogleSuccess'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import Budgets from './pages/Budgets'
import Reports from './pages/Reports'
import Equbs from './pages/Equbs'
import SmsParser from './pages/SmsParser'
import Settings from './pages/Settings'
import Admin from './pages/Admin'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function Spinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/phone-login" element={<PhoneLogin />} />
      <Route path="/auth/google/success" element={<GoogleSuccess />} />
      <Route path="/verify-email" element={<Protected><VerifyEmail /></Protected>} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/accounts" element={<Protected><Accounts /></Protected>} />
      <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
      <Route path="/categories" element={<Protected><Categories /></Protected>} />
      <Route path="/budgets" element={<Protected><Budgets /></Protected>} />
      <Route path="/reports" element={<Protected><Reports /></Protected>} />
      <Route path="/equbs" element={<Protected><Equbs /></Protected>} />
      <Route path="/sms-parser" element={<Protected><SmsParser /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="/admin" element={<Protected><Admin /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
