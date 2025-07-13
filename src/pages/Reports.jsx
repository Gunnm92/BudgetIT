import React, { useState } from 'react'
import { useBudget } from '../context/BudgetContext'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import { fr } from 'date-fns/locale'

const Reports = () => {
  const {
    budgets,
    expenses,
    categories,
    getCategoryById,
    getBudgetById,
    getTotalBudget,
    getTotalExpenses,
    getRemainingBudget
  } = useBudget()

  const [selectedPeriod, setSelectedPeriod] = useState('6months')

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Données pour le graphique en camembert des dépenses par catégorie
  const expensesByCategory = categories.map(category => {
    const categoryExpenses = expenses.filter(expense => expense.categoryId === category.id)
    const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    return {
      name: category.name,
      value: total,
      color: category.color
    }
  }).filter(item => item.value > 0)

  // Données pour le graphique en barres des budgets vs dépenses
  const budgetVsExpenses = categories.map(category => {
    const categoryBudgets = budgets.filter(budget => budget.categoryId === category.id)
    const categoryExpenses = expenses.filter(expense => expense.categoryId === category.id)
    const totalBudget = categoryBudgets.reduce((sum, budget) => sum + budget.amount, 0)
    const totalExpenses = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    return {
      name: category.name,
      budget: totalBudget,
      expenses: totalExpenses,
      remaining: totalBudget - totalExpenses
    }
  }).filter(item => item.budget > 0 || item.expenses > 0)

  // Données pour le graphique temporel des dépenses
  const getTimeSeriesData = () => {
    const endDate = new Date()
    const startDate = subMonths(endDate, parseInt(selectedPeriod))
    const months = eachMonthOfInterval({ start: startDate, end: endDate })
    
    return months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= monthStart && expenseDate <= monthEnd
      })
      
      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      
      return {
        month: format(month, 'MMM yyyy', { locale: fr }),
        expenses: total,
        date: month
      }
    })
  }

  // Top 5 des dépenses les plus importantes
  const topExpenses = expenses
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  // Statistiques générales
  const totalBudget = getTotalBudget()
  const totalExpenses = getTotalExpenses()
  const remainingBudget = getRemainingBudget()
  const percentageUsed = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0

  // Budgets dépassés
  const overBudgetBudgets = budgets.filter(budget => {
    const budgetExpenses = expenses.filter(expense => expense.budgetId === budget.id)
    const totalBudgetExpenses = budgetExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    return totalBudgetExpenses > budget.amount
  })



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports et analyses</h1>
          <p className="text-gray-600">Analysez vos données de budget IT</p>
        </div>

      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Budget total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dépenses totales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${remainingBudget >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Budget restant</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(remainingBudget)}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taux d'utilisation</p>
              <p className="text-2xl font-bold text-gray-900">{percentageUsed.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique en camembert des dépenses par catégorie */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des dépenses par catégorie</h3>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Aucune dépense enregistrée
            </div>
          )}
        </div>

        {/* Graphique en barres budgets vs dépenses */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budgets vs Dépenses par catégorie</h3>
          {budgetVsExpenses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="budget" fill="#3B82F6" name="Budget" />
                <Bar dataKey="expenses" fill="#EF4444" name="Dépenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>

      {/* Graphique temporel */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Évolution des dépenses dans le temps</h3>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input-field w-auto"
          >
            <option value="3months">3 derniers mois</option>
            <option value="6months">6 derniers mois</option>
            <option value="12months">12 derniers mois</option>
          </select>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={getTimeSeriesData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stroke="#3B82F6" 
              fill="#3B82F6" 
              fillOpacity={0.3} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tableaux détaillés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 des dépenses */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 des dépenses les plus importantes</h3>
          {topExpenses.length > 0 ? (
            <div className="space-y-3">
              {topExpenses.map((expense, index) => {
                const category = getCategoryById(expense.categoryId)
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                        <p className="text-xs text-gray-500">
                          {category?.name} • {format(new Date(expense.date), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune dépense enregistrée
            </div>
          )}
        </div>

        {/* Budgets dépassés */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budgets dépassés</h3>
          {overBudgetBudgets.length > 0 ? (
            <div className="space-y-3">
              {overBudgetBudgets.map((budget) => {
                const category = getCategoryById(budget.categoryId)
                const budgetExpenses = expenses.filter(expense => expense.budgetId === budget.id)
                const totalBudgetExpenses = budgetExpenses.reduce((sum, expense) => sum + expense.amount, 0)
                const overAmount = totalBudgetExpenses - budget.amount
                const overPercentage = (overAmount / budget.amount) * 100
                
                return (
                  <div key={budget.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{budget.name}</p>
                        <p className="text-xs text-gray-500">{category?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">
                          +{formatCurrency(overAmount)}
                        </p>
                        <p className="text-xs text-red-500">
                          +{overPercentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucun budget dépassé
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports 