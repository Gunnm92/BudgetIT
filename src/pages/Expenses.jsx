import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useBudget } from '../context/BudgetContext'
import { Plus, Edit, Trash2, X, Filter, AlertTriangle, TrendingUp, Upload } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import * as XLSX from 'xlsx'

const Expenses = () => {
  const {
    expenses,
    budgets,
    categories,
    services,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    getCategoryById,
    getBudgetById,
    getServiceById
  } = useBudget()

  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'budgeted', 'unbudgeted'
  const [filters, setFilters] = useState({
    categoryId: '',
    budgetId: '',
    serviceId: '',
    dateFrom: '',
    dateTo: ''
  })
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    categoryId: '',
    budgetId: '',
    serviceId: '',
    date: '',
    notes: ''
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Fonction d'import spécifique pour Akto - Depenses.xlsx
  const handleImportAktoExpenses = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Demander confirmation si des dépenses existent déjà
    if (expenses.length > 0) {
      const shouldReplace = window.confirm(
        `Vous avez déjà ${expenses.length} dépense(s) existante(s).\n\n` +
        `Voulez-vous :\n` +
        `• Remplacer toutes les dépenses existantes (OK)\n` +
        `• Ajouter aux dépenses existantes (Annuler)`
      )
      
      if (shouldReplace) {
        // Vider toutes les dépenses existantes
        expenses.forEach(expense => deleteExpense(expense.id))
      }
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)
        
        // Afficher les colonnes disponibles pour le débogage
        if (jsonData.length > 0) {
          console.log('📋 Colonnes disponibles dans le fichier Excel:')
          console.log(Object.keys(jsonData[0]))
        }
        
        let expensesImported = 0
        
        // Mappage des catégories avec création automatique
        const getCategoryIdByName = (name) => {
          if (!name) return null
          const lowerName = name.toLowerCase().trim()
          
          // D'abord, chercher une correspondance exacte
          let category = categories.find(c => c.name.toLowerCase() === lowerName)
          if (category) return category.id
          
          // Mappage des catégories françaises vers les catégories existantes
          const categoryMappings = {
            'hébergement': 'services',
            'hosting': 'services',
            'serveur': 'hardware',
            'matériel': 'hardware',
            'logiciel': 'software',
            'licence': 'software',
            'formation': 'formation',
            'training': 'formation',
            'maintenance': 'maintenance',
            'support': 'maintenance',
            'télécom': 'services',
            'telecom': 'services',
            'daf': 'services',
            'production': 'services',
            'achat': 'hardware',
            'location': 'services',
            'consulting': 'services',
            'conseil': 'services',
            'dépenses': 'autres',
            'expenses': 'autres',
            'frais': 'autres',
            'costs': 'autres'
          }
          
          // Essayer le mappage
          for (const [key, mappedCategory] of Object.entries(categoryMappings)) {
            if (lowerName.includes(key)) {
              category = categories.find(c => c.name.toLowerCase() === mappedCategory)
              if (category) return category.id
            }
          }
          
          // Si aucune correspondance trouvée, créer une nouvelle catégorie
          console.log(`Création d'une nouvelle catégorie: "${name}"`)
          const newCategory = addCategory({
            name: name.charAt(0).toUpperCase() + name.slice(1), // Capitaliser la première lettre
            color: '#6B7280' // Couleur par défaut
          })
          return newCategory.id
        }

        // Mappage des services avec création automatique
        const getServiceIdByName = (name) => {
          if (!name) return null
          const lowerName = name.toLowerCase().trim()
          
          // D'abord, chercher une correspondance exacte
          let service = services.find(s => s.name.toLowerCase() === lowerName)
          if (service) return service.id
          
          // Mappage des services français vers les services existants
          const serviceMappings = {
            'daf': 'finance',
            'drh': 'ressources humaines',
            'rh': 'ressources humaines',
            'marketing': 'marketing',
            'vente': 'ventes',
            'commercial': 'ventes',
            'support': 'support client',
            'client': 'support client',
            'développement': 'développement',
            'dev': 'développement',
            'infrastructure': 'infrastructure',
            'infra': 'infrastructure',
            'direction': 'direction générale',
            'dg': 'direction générale',
            'générale': 'direction générale',
            'general': 'direction générale'
          }
          
          // Essayer le mappage
          for (const [key, mappedService] of Object.entries(serviceMappings)) {
            if (lowerName.includes(key)) {
              service = services.find(s => s.name.toLowerCase() === mappedService)
              if (service) return service.id
            }
          }
          
          // Si aucune correspondance trouvée, créer un nouveau service
          console.log(`Création d'un nouveau service: "${name}"`)
          const newService = addService({
            name: name.charAt(0).toUpperCase() + name.slice(1), // Capitaliser la première lettre
            color: '#6B7280' // Couleur par défaut
          })
          return newService.id
        }

        // Mappage des budgets par nom
        const getBudgetIdByName = (name) => {
          if (!name) return null
          const budget = budgets.find(b => 
            b.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(b.name.toLowerCase())
          )
          return budget ? budget.id : null
        }
        
        let totalRows = jsonData.length
        let skippedRows = 0
        let missingData = 0
        
        jsonData.forEach((row, index) => {
          // Adapter selon la structure du fichier Akto - Depenses.xlsx
          // Ces noms de colonnes sont des exemples, à ajuster selon le fichier réel
          const description = row['Description'] || row['Prestation'] || row['Libellé'] || row['Désignation']
          const montant = row['Montant'] || row['Prix'] || row['Coût'] || row['mt HT'] || row['Montant HT']
          const categorie = row['Catégorie'] || row['Type'] || row['Famille']
          const service = row['Service'] || row['Département'] || row['Direction']
          const date = row['Date'] || row['Date de facturation'] || row['Période']
          const fournisseur = row['Fournisseur'] || row['Prestataire'] || row['Vendeur']
          const notes = row['Notes'] || row['Remarques'] || row['Commentaires']
          const budget = row['Budget'] || row['Budget associé'] || row['Projet']

          const categoryId = getCategoryIdByName(categorie)
          const serviceId = getServiceIdByName(service)
          const budgetId = getBudgetIdByName(budget)

          if (description && montant !== undefined) {
            // Vérifier si une dépense similaire existe déjà
            const existingExpense = expenses.find(e => 
              e.description === description && 
              e.amount === parseFloat(montant) &&
              e.categoryId === categoryId
            )
            
            if (existingExpense) {
              console.warn(`Ligne ${index + 1}: Dépense similaire déjà existante "${description}" - ligne ignorée`)
              skippedRows++
              return
            }
            
            // Traiter la date
            let processedDate = new Date().toISOString().split('T')[0] // Date par défaut : aujourd'hui
            if (date) {
              try {
                // Essayer différents formats de date
                const dateObj = new Date(date)
                if (!isNaN(dateObj.getTime())) {
                  processedDate = dateObj.toISOString().split('T')[0]
                }
              } catch (error) {
                console.warn(`Ligne ${index + 1}: Format de date invalide "${date}" - utilisation de la date par défaut`)
              }
            }
            
            addExpense({
              description: description,
              amount: parseFloat(montant),
              categoryId,
              serviceId,
              budgetId,
              date: processedDate,
              notes: notes ? `${fournisseur ? `Fournisseur: ${fournisseur}. ` : ''}${notes}` : (fournisseur ? `Fournisseur: ${fournisseur}` : '')
            })
            expensesImported++
          } else {
            console.warn(`Ligne ${index + 1}: Données manquantes - ligne ignorée`, {
              description: !!description,
              montant: montant !== undefined
            })
            missingData++
          }
        })
        
        const message = `Importation Akto terminée !\n\n` +
          `📊 Résultats :\n` +
          `• ${expensesImported} dépenses importées\n` +
          `• ${totalRows} lignes totales dans le fichier\n` +
          `• ${skippedRows} lignes ignorées (doublons)\n` +
          `• ${missingData} lignes ignorées (données manquantes)\n\n` +
          `✅ Nouvelles catégories et services créés automatiquement si nécessaire.\n` +
          `💡 Conseil : Vérifiez la console pour voir les détails de l'importation.`
        
        alert(message)
        
        // Réinitialiser le champ de fichier
        e.target.value = ''
        
      } catch (error) {
        console.error('Erreur lors de l\'importation:', error)
        alert('Erreur lors de l\'importation du fichier. Vérifiez que le fichier est au format Excel valide.')
        e.target.value = ''
      }
    }
    
    reader.readAsArrayBuffer(file)
  }

  // Séparer les dépenses budgétées et non budgétées
  const { budgetedExpenses, unbudgetedExpenses } = useMemo(() => {
    const budgeted = expenses.filter(expense => expense.budgetId !== null)
    const unbudgeted = expenses.filter(expense => expense.budgetId === null)
    return { budgetedExpenses: budgeted, unbudgetedExpenses: unbudgeted }
  }, [expenses])

  // Calculer les statistiques
  const stats = useMemo(() => {
    const totalBudgeted = budgetedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalUnbudgeted = unbudgetedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalAll = totalBudgeted + totalUnbudgeted
    const percentageUnbudgeted = totalAll > 0 ? (totalUnbudgeted / totalAll) * 100 : 0

    return {
      totalBudgeted,
      totalUnbudgeted,
      totalAll,
      percentageUnbudgeted,
      budgetedCount: budgetedExpenses.length,
      unbudgetedCount: unbudgetedExpenses.length
    }
  }, [budgetedExpenses, unbudgetedExpenses])

  // Filtrer les dépenses selon l'onglet actif
  const getFilteredExpenses = () => {
    let baseExpenses = []
    
    switch (activeTab) {
      case 'budgeted':
        baseExpenses = budgetedExpenses
        break
      case 'unbudgeted':
        baseExpenses = unbudgetedExpenses
        break
      default:
        baseExpenses = expenses
    }

    return baseExpenses.filter(expense => {
      if (filters.categoryId && expense.categoryId !== parseInt(filters.categoryId)) return false
      if (filters.budgetId && expense.budgetId !== parseInt(filters.budgetId)) return false
      if (filters.serviceId && expense.serviceId !== parseInt(filters.serviceId)) return false
      if (filters.dateFrom && new Date(expense.date) < new Date(filters.dateFrom)) return false
      if (filters.dateTo && new Date(expense.date) > new Date(filters.dateTo)) return false
      return true
    })
  }

  const filteredExpenses = getFilteredExpenses()
  const totalFilteredExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      categoryId: parseInt(formData.categoryId),
      budgetId: formData.budgetId ? parseInt(formData.budgetId) : null,
      serviceId: formData.serviceId ? parseInt(formData.serviceId) : null
    }

    if (editingExpense) {
      updateExpense({ ...expenseData, id: editingExpense.id })
    } else {
      addExpense(expenseData)
    }

    resetForm()
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      categoryId: expense.categoryId.toString(),
      budgetId: expense.budgetId ? expense.budgetId.toString() : '',
      serviceId: expense.serviceId ? expense.serviceId.toString() : '',
      date: expense.date,
      notes: expense.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      deleteExpense(id)
    }
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      categoryId: '',
      budgetId: '',
      serviceId: '',
      date: '',
      notes: ''
    })
    setEditingExpense(null)
    setShowForm(false)
  }

  const resetFilters = () => {
    setFilters({
      categoryId: '',
      budgetId: '',
      serviceId: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des dépenses</h1>
          <p className="text-gray-600">Enregistrez et suivez vos dépenses IT par service</p>
        </div>
        <div className="flex gap-2">
          {/* Bouton d'import Excel */}
          <Link
            to="/import-expenses"
            className="btn-secondary flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span>Import Excel</span>
          </Link>
          
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle dépense
          </button>
        </div>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total dépenses</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.totalAll)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Dépenses budgétées</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalBudgeted)}</p>
              <p className="text-xs text-green-600">{stats.budgetedCount} dépense(s)</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm font-bold">✓</span>
            </div>
          </div>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Dépenses non budgétées</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(stats.totalUnbudgeted)}</p>
              <p className="text-xs text-orange-600">{stats.unbudgetedCount} dépense(s)</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">% Non budgétées</p>
              <p className="text-2xl font-bold text-purple-900">{stats.percentageUnbudgeted.toFixed(1)}%</p>
              <p className="text-xs text-purple-600">
                {stats.percentageUnbudgeted > 20 ? '⚠️ Élevé' : '✅ Normal'}
              </p>
            </div>
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-sm font-bold">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Toutes les dépenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('budgeted')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'budgeted'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dépenses budgétées ({stats.budgetedCount})
            </button>
            <button
              onClick={() => setActiveTab('unbudgeted')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'unbudgeted'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dépenses non budgétées ({stats.unbudgetedCount})
            </button>
          </nav>
        </div>

        {/* Filtres */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtres
            </h3>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Réinitialiser
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="input-field"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget
              </label>
              <select
                value={filters.budgetId}
                onChange={(e) => setFilters({ ...filters, budgetId: e.target.value })}
                className="input-field"
              >
                <option value="">Tous les budgets</option>
                {budgets.map(budget => (
                  <option key={budget.id} value={budget.id}>
                    {budget.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <select
                value={filters.serviceId}
                onChange={(e) => setFilters({ ...filters, serviceId: e.target.value })}
                className="input-field"
              >
                <option value="">Tous les services</option>
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
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          {/* Résumé des filtres */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {filteredExpenses.length} dépense(s) trouvée(s) - Total: {formatCurrency(totalFilteredExpenses)}
              </span>
              {activeTab === 'unbudgeted' && stats.unbudgetedCount > 0 && (
                <div className="flex items-center text-orange-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="font-medium">Attention aux dépenses non budgétées</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showForm && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}
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
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Achat serveur"
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
                  Budget associé
                </label>
                <select
                  value={formData.budgetId}
                  onChange={(e) => setFormData({ ...formData, budgetId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Aucun budget (dépense non budgétée)</option>
                  {budgets.map(budget => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name} - {formatCurrency(budget.amount)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service
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
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Notes optionnelles..."
              />
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
                className="btn-primary"
              >
                {editingExpense ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des dépenses */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Montant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Catégorie</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Budget</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Service</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    {activeTab === 'unbudgeted' ? 'Aucune dépense non budgétée' : 'Aucune dépense trouvée'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(expense => {
                  const category = getCategoryById(expense.categoryId)
                  const budget = expense.budgetId ? getBudgetById(expense.budgetId) : null
                  const service = expense.serviceId ? getServiceById(expense.serviceId) : null
                  
                  return (
                    <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{expense.description}</div>
                          {expense.notes && (
                            <div className="text-sm text-gray-500">{expense.notes}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(expense.amount)}
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
                        {budget ? (
                          <span className="text-green-600 font-medium">{budget.name}</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Non budgétée
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
                        <div className="text-sm text-gray-600">
                          {format(new Date(expense.date), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
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

export default Expenses 