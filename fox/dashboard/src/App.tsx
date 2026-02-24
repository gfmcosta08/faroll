import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Imoveis from './pages/Imoveis'
import Colaboradores from './pages/Colaboradores'
import { ReactNode } from 'react'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/"               element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/leads"          element={<PrivateRoute><Leads /></PrivateRoute>} />
          <Route path="/imoveis"        element={<PrivateRoute><Imoveis /></PrivateRoute>} />
          <Route path="/colaboradores"  element={<PrivateRoute><Colaboradores /></PrivateRoute>} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
