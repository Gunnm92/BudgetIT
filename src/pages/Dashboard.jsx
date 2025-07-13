import React from 'react'
import { useBudget } from '../context/BudgetContext'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Wallet, Receipt, TrendingUp, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const Dashboard = () => {
  const {
    budgets,
    expenses,
    categories,
    getTotalBudget,
    getTotalExpenses,
    getRemainingBudget,
    getCategoryById
  } = useBudget()

  const totalBudget = getTotalBudget()
  const totalExpenses = getTotalExpenses()
  const remainingBudget = getRemainingBudget()
  const percentageUsed = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0

  // Données pour le graphique en camembert des budgets par catégorie
  const budgetByCategory = categories.map(category => {
    const categoryBudgets = budgets.filter(budget => budget.categoryId === category.id)
    const total = categoryBudgets.reduce((sum, budget) => sum + budget.amount, 0)
    return {
      name: category.name,
      value: total,
      color: category.color
    }
  }).filter(item => item.value > 0)

  // Données pour le graphique en barres des dépenses par catégorie
  const expensesByCategory = categories.map(category => {
    const categoryExpenses = expenses.filter(expense => expense.categoryId === category.id)
    const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    return {
      name: category.name,
      amount: total,
      color: category.color
    }
  }).filter(item => item.amount > 0)

  // Dépenses récentes
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de votre budget IT</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Budget total"
          value={formatCurrency(totalBudget)}
          icon={Wallet}
          color="bg-blue-500"
        />
        <StatCard
          title="Dépenses totales"
          value={formatCurrency(totalExpenses)}
          icon={Receipt}
          color="bg-green-500"
        />
        <StatCard
          title="Budget restant"
          value={formatCurrency(remainingBudget)}
          icon={TrendingUp}
          color={remainingBudget >= 0 ? "bg-emerald-500" : "bg-red-500"}
          subtitle={`${percentageUsed.toFixed(1)}% utilisé`}
        />
        <StatCard
          title="Alertes"
          value={remainingBudget < 0 ? "Dépassement" : "OK"}
          icon={AlertTriangle}
          color={remainingBudget < 0 ? "bg-red-500" : "bg-gray-500"}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique en camembert des budgets */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition du budget par catégorie</h3>
          {budgetByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budgetByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {budgetByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Aucun budget défini
            </div>
          )}
        </div>

        {/* Graphique en barres des dépenses */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dépenses par catégorie</h3>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expensesByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Aucune dépense enregistrée
            </div>
          )}
        </div>
      </div>

      {/* Dépenses récentes */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dépenses récentes</h3>
        {recentExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentExpenses.map((expense) => {
                  const category = getCategoryById(expense.categoryId)
                  return (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: category?.color + '20', color: category?.color }}
                        >
                          {category?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(expense.date), 'dd/MM/yyyy', { locale: fr })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucune dépense récente
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard 