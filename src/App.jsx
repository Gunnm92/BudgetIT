import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Budgets from './pages/Budgets'
import Expenses from './pages/Expenses'
import ImportExpenses from './pages/ImportExpenses'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import { BudgetProvider } from './context/BudgetContext'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <AuthProvider>
      <BudgetProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/budgets" element={<Budgets />} />
                      <Route path="/expenses" element={<Expenses />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/settings/import-expenses" element={<ImportExpenses />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </BudgetProvider>
    </AuthProvider>
  )
}

export default App 