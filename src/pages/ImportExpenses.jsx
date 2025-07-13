import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useBudget } from '../context/BudgetContext'
import { Upload, FileText, Settings, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import * as XLSX from 'xlsx'

const ImportExpenses = () => {
  const {
    expenses,
    budgets,
    categories,
    services,
    addExpense,
    addCategory,
    addService,
    getCategoryById,
    getBudgetById,
    getServiceById
  } = useBudget()

  const [file, setFile] = useState(null)
  const [fileData, setFileData] = useState(null)
  const [columnMapping, setColumnMapping] = useState({})
  const [categoryMapping, setCategoryMapping] = useState({})
  const [serviceMapping, setServiceMapping] = useState({})
  const [budgetMapping, setBudgetMapping] = useState({})
  const [importResults, setImportResults] = useState(null)
  const [isImporting, setIsImporting] = useState(false)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Gérer la sélection du fichier
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setFileData(null)
    setColumnMapping({})
    setCategoryMapping({})
    setServiceMapping({})
    setBudgetMapping({})
    setImportResults(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)
        
        if (jsonData.length > 0) {
          const columns = Object.keys(jsonData[0])
          console.log('📋 Colonnes disponibles:', columns)
          
          // Mapping automatique des colonnes
          const autoMapping = {
            description: columns.find(col => 
              col.toLowerCase().includes('description') || 
              col.toLowerCase().includes('libellé') || 
              col.toLowerCase().includes('désignation') ||
              col.toLowerCase().includes('prestation')
            ) || '',
            amount: columns.find(col => 
              col.toLowerCase().includes('montant') || 
              col.toLowerCase().includes('prix') || 
              col.toLowerCase().includes('coût') ||
              col.toLowerCase().includes('ht')
            ) || '',
            category: columns.find(col => 
              col.toLowerCase().includes('catégorie') || 
              col.toLowerCase().includes('type') || 
              col.toLowerCase().includes('famille')
            ) || '',
            service: columns.find(col => 
              col.toLowerCase().includes('service') || 
              col.toLowerCase().includes('département') || 
              col.toLowerCase().includes('direction')
            ) || '',
            date: columns.find(col => 
              col.toLowerCase().includes('date') || 
              col.toLowerCase().includes('période')
            ) || '',
            supplier: columns.find(col => 
              col.toLowerCase().includes('fournisseur') || 
              col.toLowerCase().includes('prestataire') || 
              col.toLowerCase().includes('vendeur')
            ) || '',
            notes: columns.find(col => 
              col.toLowerCase().includes('notes') || 
              col.toLowerCase().includes('remarques') || 
              col.toLowerCase().includes('commentaires')
            ) || '',
            budget: columns.find(col => 
              col.toLowerCase().includes('budget') || 
              col.toLowerCase().includes('projet')
            ) || ''
          }
          
          setColumnMapping(autoMapping)
          setFileData({ columns, data: jsonData })
        }
      } catch (error) {
        console.error('Erreur lors de la lecture du fichier:', error)
        alert('Erreur lors de la lecture du fichier Excel.')
      }
    }
    reader.readAsArrayBuffer(selectedFile)
  }

  // Obtenir les valeurs uniques d'une colonne
  const getUniqueValues = (columnName) => {
    if (!fileData || !columnName) return []
    return [...new Set(fileData.data.map(row => row[columnName]).filter(Boolean))]
  }

  // Créer ou mapper une catégorie
  const getCategoryId = (categoryName) => {
    if (!categoryName) return null
    
    // Vérifier le mapping personnalisé
    if (categoryMapping[categoryName]) {
      return categoryMapping[categoryName]
    }
    
    // Chercher une correspondance exacte
    let category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
    if (category) return category.id
    
    // Mappage automatique
    const autoMappings = {
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
      'telecom': 'services'
    }
    
    for (const [key, mappedCategory] of Object.entries(autoMappings)) {
      if (categoryName.toLowerCase().includes(key)) {
        category = categories.find(c => c.name.toLowerCase() === mappedCategory)
        if (category) return category.id
      }
    }
    
    // Créer une nouvelle catégorie
    const newCategory = addCategory({
      name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
      color: '#6B7280'
    })
    return newCategory.id
  }

  // Créer ou mapper un service
  const getServiceId = (serviceName) => {
    if (!serviceName) return null
    
    // Vérifier le mapping personnalisé
    if (serviceMapping[serviceName]) {
      return serviceMapping[serviceName]
    }
    
    // Chercher une correspondance exacte
    let service = services.find(s => s.name.toLowerCase() === serviceName.toLowerCase())
    if (service) return service.id
    
    // Mappage automatique
    const autoMappings = {
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
      'dg': 'direction générale'
    }
    
    for (const [key, mappedService] of Object.entries(autoMappings)) {
      if (serviceName.toLowerCase().includes(key)) {
        service = services.find(s => s.name.toLowerCase() === mappedService)
        if (service) return service.id
      }
    }
    
    // Créer un nouveau service
    const newService = addService({
      name: serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
      color: '#6B7280'
    })
    return newService.id
  }

  // Obtenir l'ID du budget
  const getBudgetId = (budgetName) => {
    if (!budgetName) return null
    
    // Vérifier le mapping personnalisé
    if (budgetMapping[budgetName]) {
      return budgetMapping[budgetName]
    }
    
    // Chercher une correspondance
    const budget = budgets.find(b => 
      b.name.toLowerCase().includes(budgetName.toLowerCase()) ||
      budgetName.toLowerCase().includes(b.name.toLowerCase())
    )
    return budget ? budget.id : null
  }

  // Exécuter l'import
  const executeImport = () => {
    if (!fileData) return
    
    setIsImporting(true)
    
    try {
      let imported = 0
      let skipped = 0
      let errors = 0
      
      fileData.data.forEach((row, index) => {
        try {
          const description = row[columnMapping.description]
          const amount = row[columnMapping.amount]
          const categoryName = row[columnMapping.category]
          const serviceName = row[columnMapping.service]
          const date = row[columnMapping.date]
          const supplier = row[columnMapping.supplier]
          const notes = row[columnMapping.notes]
          const budgetName = row[columnMapping.budget]
          
          // Vérifier les données obligatoires
          if (!description || amount === undefined || amount === null || amount === '') {
            console.warn(`Ligne ${index + 1}: Données manquantes`, { description, amount })
            errors++
            return
          }
          
          // Vérifier si la dépense existe déjà
          const existingExpense = expenses.find(e => 
            e.description === description && 
            e.amount === parseFloat(amount)
          )
          
          if (existingExpense) {
            console.warn(`Ligne ${index + 1}: Dépense déjà existante "${description}"`)
            skipped++
            return
          }
          
          // Traiter la date
          let processedDate = new Date().toISOString().split('T')[0]
          if (date) {
            try {
              const dateObj = new Date(date)
              if (!isNaN(dateObj.getTime())) {
                processedDate = dateObj.toISOString().split('T')[0]
              }
            } catch (error) {
              console.warn(`Ligne ${index + 1}: Date invalide "${date}"`)
            }
          }
          
          // Créer la dépense
          addExpense({
            description: description,
            amount: parseFloat(amount),
            categoryId: getCategoryId(categoryName),
            serviceId: getServiceId(serviceName),
            budgetId: getBudgetId(budgetName),
            date: processedDate,
            notes: notes ? `${supplier ? `Fournisseur: ${supplier}. ` : ''}${notes}` : (supplier ? `Fournisseur: ${supplier}` : '')
          })
          
          imported++
        } catch (error) {
          console.error(`Erreur ligne ${index + 1}:`, error)
          errors++
        }
      })
      
      setImportResults({
        imported,
        skipped,
        errors,
        total: fileData.data.length
      })
      
    } catch (error) {
      console.error('Erreur lors de l\'import:', error)
      alert('Erreur lors de l\'import du fichier.')
    } finally {
      setIsImporting(false)
    }
  }

  // Réinitialiser l'import
  const resetImport = () => {
    setFile(null)
    setFileData(null)
    setColumnMapping({})
    setCategoryMapping({})
    setServiceMapping({})
    setBudgetMapping({})
    setImportResults(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/settings"
          className="btn-secondary flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux paramètres
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import de dépenses</h1>
          <p className="text-gray-600">Importez vos dépenses depuis un fichier Excel</p>
        </div>
      </div>

      {!fileData ? (
        // Étape 1: Sélection du fichier
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sélectionnez votre fichier Excel
            </h3>
            <p className="text-gray-600 mb-4">
              Formats supportés: .xlsx, .xls
            </p>
            <label className="btn-primary cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              Choisir un fichier
            </label>
          </div>
        </div>
      ) : (
        // Étape 2: Configuration et import
        <div className="space-y-6">
          {/* Informations du fichier */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  {file.name}
                </h3>
              </div>
              <button
                onClick={resetImport}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Changer de fichier
              </button>
            </div>
            <p className="text-gray-600">
              {fileData.data.length} lignes trouvées
            </p>
          </div>

          {/* Mapping des colonnes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Mapping des colonnes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(columnMapping).map(([field, column]) => (
                <div key={field} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {field}
                  </label>
                  <select
                    value={column}
                    onChange={(e) => setColumnMapping(prev => ({
                      ...prev,
                      [field]: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Sélectionner une colonne --</option>
                    {fileData.columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Mapping des catégories */}
          {columnMapping.category && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Mapping des catégories
              </h3>
              <div className="space-y-3">
                {getUniqueValues(columnMapping.category).map(categoryName => (
                  <div key={categoryName} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{categoryName}</span>
                    <select
                      value={categoryMapping[categoryName] || ''}
                      onChange={(e) => setCategoryMapping(prev => ({
                        ...prev,
                        [categoryName]: e.target.value || null
                      }))}
                      className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Créer automatiquement --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapping des services */}
          {columnMapping.service && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Mapping des services
              </h3>
              <div className="space-y-3">
                {getUniqueValues(columnMapping.service).map(serviceName => (
                  <div key={serviceName} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{serviceName}</span>
                    <select
                      value={serviceMapping[serviceName] || ''}
                      onChange={(e) => setServiceMapping(prev => ({
                        ...prev,
                        [serviceName]: e.target.value || null
                      }))}
                      className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Créer automatiquement --</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapping des budgets */}
          {columnMapping.budget && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Mapping des budgets
              </h3>
              <div className="space-y-3">
                {getUniqueValues(columnMapping.budget).map(budgetName => (
                  <div key={budgetName} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{budgetName}</span>
                    <select
                      value={budgetMapping[budgetName] || ''}
                      onChange={(e) => setBudgetMapping(prev => ({
                        ...prev,
                        [budgetName]: e.target.value || null
                      }))}
                      className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Aucun budget --</option>
                      {budgets.map(budget => (
                        <option key={budget.id} value={budget.id}>{budget.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton d'import */}
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={executeImport}
              disabled={isImporting || !columnMapping.description || !columnMapping.amount}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Import en cours...' : 'Importer les dépenses'}
            </button>
          </div>

          {/* Résultats de l'import */}
          {importResults && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Résultats de l'import
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{importResults.imported}</div>
                  <div className="text-sm text-gray-600">Importées</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{importResults.skipped}</div>
                  <div className="text-sm text-gray-600">Ignorées</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{importResults.errors}</div>
                  <div className="text-sm text-gray-600">Erreurs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{importResults.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => window.location.href = '/expenses'}
                  className="btn-primary"
                >
                  Voir les dépenses
                </button>
                <button
                  onClick={resetImport}
                  className="btn-secondary"
                >
                  Nouvel import
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ImportExpenses 