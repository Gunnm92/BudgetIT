import React, { useState, useMemo } from 'react'
import { useBudget } from '../context/BudgetContext'
import { Plus, Edit, Trash2, X, Search, Filter, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const Budgets = () => {
  const {
    budgets,
    categories,
    services,
    addBudget,
    updateBudget,
    deleteBudget,
    getExpensesByBudgetId,
    getCategoryById,
    getServiceById
  } = useBudget()

  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    categoryId: '',
    serviceId: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: ''
  })
  
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    categoryId: '',
    serviceId: '',
    description: '',
    startDate: '',
    endDate: '',
    lieu: ''
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Filtrer et rechercher les budgets
  const filteredBudgets = useMemo(() => {
    return budgets.filter(budget => {
      // Recherche par nom ou description
      const matchesSearch = searchTerm === '' || 
        budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (budget.description && budget.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (budget.lieu && budget.lieu.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filtre par catégorie
      const matchesCategory = filters.categoryId === '' || budget.categoryId === parseInt(filters.categoryId)

      // Filtre par service
      const matchesService = filters.serviceId === '' || budget.serviceId === parseInt(filters.serviceId)

      // Filtre par montant minimum
      const matchesMinAmount = filters.minAmount === '' || budget.amount >= parseFloat(filters.minAmount)

      // Filtre par montant maximum
      const matchesMaxAmount = filters.maxAmount === '' || budget.amount <= parseFloat(filters.maxAmount)

      // Filtre par date de début
      const matchesDateFrom = filters.dateFrom === '' || 
        (budget.startDate && new Date(budget.startDate) >= new Date(filters.dateFrom))

      // Filtre par date de fin
      const matchesDateTo = filters.dateTo === '' || 
        (budget.endDate && new Date(budget.endDate) <= new Date(filters.dateTo))

      return matchesSearch && matchesCategory && matchesService && 
             matchesMinAmount && matchesMaxAmount && matchesDateFrom && matchesDateTo
    })
  }, [budgets, searchTerm, filters])

  const handleSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isSubmitting) {
      return
    }
    
    // Validation des données
    if (!formData.name.trim()) {
      alert('Le nom du budget est requis.')
      return
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Le montant doit être supérieur à 0.')
      return
    }
    
    if (!formData.categoryId) {
      alert('La catégorie est requise.')
      return
    }
    
    setIsSubmitting(true)
    
    const budgetData = {
      ...formData,
      amount: parseFloat(formData.amount),
      categoryId: parseInt(formData.categoryId),
      serviceId: formData.serviceId ? parseInt(formData.serviceId) : null
    }

    try {
      if (editingBudget) {
        updateBudget({ ...budgetData, id: editingBudget.id })
      } else {
        addBudget(budgetData)
      }
      
      resetForm()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du budget:', error)
      alert('Une erreur est survenue lors de la sauvegarde du budget.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (budget) => {
    setEditingBudget(budget)
    setFormData({
      name: budget.name,
      amount: budget.amount.toString(),
      categoryId: budget.categoryId.toString(),
      serviceId: budget.serviceId ? budget.serviceId.toString() : '',
      description: budget.description || '',
      startDate: budget.startDate || '',
      endDate: budget.endDate || '',
      lieu: budget.lieu || ''
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) {
      deleteBudget(id)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      categoryId: '',
      serviceId: '',
      description: '',
      startDate: '',
      endDate: '',
      lieu: ''
    })
    setEditingBudget(null)
    setShowForm(false)
    setIsSubmitting(false)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setFilters({
      categoryId: '',
      serviceId: '',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  const getBudgetProgress = (budget) => {
    const expenses = getExpensesByBudgetId(budget.id)
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const percentage = budget.amount > 0 ? (totalExpenses / budget.amount) * 100 : 0
    return { totalExpenses, percentage }
  }

  const hasActiveFilters = searchTerm || Object.values(filters).some(value => value !== '')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des budgets</h1>
          <p className="text-gray-600">Créez et gérez vos budgets par catégorie et service</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau budget
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher par nom, description ou lieu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Bouton filtres */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filtre par catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par service */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service
                </label>
                <select
                  value={filters.serviceId}
                  onChange={(e) => setFilters({ ...filters, serviceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tous les services</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par montant minimum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant minimum (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Filtre par montant maximum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant maximum (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="∞"
                />
              </div>

              {/* Filtre par date de début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtre par date de fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Statistiques des résultats */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredBudgets.length} budget(s) trouvé(s) sur {budgets.length} total
            </span>
            {hasActiveFilters && (
              <span className="text-blue-600 font-medium">
                Filtres actifs
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showForm && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingBudget ? 'Modifier le budget' : 'Nouveau budget'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du budget
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Budget serveurs 2024"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant (€)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service de rattachement
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Aucun service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu
                </label>
                <input
                  type="text"
                  value={formData.lieu}
                  onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Paris, Lyon, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  placeholder="Description optionnelle"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sauvegarde...' : (editingBudget ? 'Modifier' : 'Créer')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des budgets */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Nom</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Montant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Catégorie</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Service</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Progression</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Période</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? 'Aucun budget ne correspond aux critères de recherche' : 'Aucun budget créé'}
                  </td>
                </tr>
              ) : (
                filteredBudgets.map(budget => {
                  const category = getCategoryById(budget.categoryId)
                  const service = budget.serviceId ? getServiceById(budget.serviceId) : null
                  const progress = getBudgetProgress(budget)
                  
                  return (
                    <tr key={budget.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{budget.name}</div>
                          {budget.description && (
                            <div className="text-sm text-gray-500">{budget.description}</div>
                          )}
                          {budget.lieu && (
                            <div className="text-sm text-gray-400">📍 {budget.lieu}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(budget.amount)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {category && (
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: category.color + '20', color: category.color }}
                          >
                            {category.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {service ? (
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: service.color + '20', color: service.color }}
                          >
                            {service.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-32">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">
                              {formatCurrency(progress.totalExpenses)}
                            </span>
                            <span className="text-gray-600">
                              {progress.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                progress.percentage > 100 ? 'bg-red-500' : 
                                progress.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {budget.startDate && budget.endDate ? (
                            <>
                              <div>Du {format(new Date(budget.startDate), 'dd/MM/yyyy', { locale: fr })}</div>
                              <div>Au {format(new Date(budget.endDate), 'dd/MM/yyyy', { locale: fr })}</div>
                            </>
                          ) : (
                            <span className="text-gray-400">Non définie</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(budget)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Budgets 