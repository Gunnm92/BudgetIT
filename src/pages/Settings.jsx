import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBudget } from '../context/BudgetContext'
import { useAuth } from '../context/AuthContext'
import { Settings as SettingsIcon, Trash2, AlertTriangle, Database, User, LogOut, Download, Upload, FileText, Plus, Edit, X } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import * as XLSX from 'xlsx'

const Settings = () => {
  const { 
    clearAllData, 
    budgets, 
    expenses, 
    categories, 
    services, 
    addBudget, 
    addExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    addService,
    updateService,
    deleteService,
    deleteBudget,
    getTotalBudget,
    getTotalExpenses,
    getRemainingBudget
  } = useBudget()
  const { logout, currentUser } = useAuth()
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [showImportOptions, setShowImportOptions] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingService, setEditingService] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#6B7280' })
  const [serviceForm, setServiceForm] = useState({ name: '', color: '#6B7280' })

  const handleResetData = () => {
    if (window.confirm('⚠️ ATTENTION : Cette action est irréversible !\n\nToutes vos données (budgets, dépenses, services personnalisés) seront définitivement supprimées.\n\nÊtes-vous absolument sûr de vouloir continuer ?')) {
      clearAllData()
      setShowConfirmReset(false)
      alert('Toutes les données ont été supprimées avec succès.')
    }
  }

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout()
    }
  }

  const getTotalDataCount = () => {
    return budgets.length + expenses.length
  }

  const handleImportExcel = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Demander confirmation si des budgets existent déjà
    if (budgets.length > 0) {
      const shouldReplace = window.confirm(
        `Vous avez déjà ${budgets.length} budget(s) existant(s).\n\n` +
        `Voulez-vous :\n` +
        `• Remplacer tous les budgets existants (OK)\n` +
        `• Ajouter aux budgets existants (Annuler)`
      )
      
      if (shouldReplace) {
        // Vider tous les budgets existants
        budgets.forEach(budget => deleteBudget(budget.id))
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
        
        let budgetsImported = 0
        
        // Mappage des catégories et services
        const getCategoryIdByName = (name) => {
          if (!name) return null
          const lowerName = name.toLowerCase().trim()
          
          // Mappage spécifique pour les catégories
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
            'production': 'services'
          }
          
          // Vérifier d'abord les mappings spécifiques
          for (const [key, mappedCategory] of Object.entries(categoryMappings)) {
            if (lowerName.includes(key)) {
              const category = categories.find(c => c.name.toLowerCase() === mappedCategory)
              if (category) return category.id
            }
          }
          
          // Vérifier la correspondance exacte
          const category = categories.find(c => c.name.toLowerCase() === lowerName)
          if (category) return category.id
          
          // Si aucune correspondance, utiliser "Autres" par défaut
          const autresCategory = categories.find(c => c.name.toLowerCase() === 'autres')
          return autresCategory ? autresCategory.id : null
        }

        const getServiceIdByName = (name) => {
          if (!name) return null
          const lowerName = name.toLowerCase().trim()
          
          // Mappage spécifique pour les services
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
            'dg': 'direction générale'
          }
          
          // Vérifier d'abord les mappings spécifiques
          for (const [key, mappedService] of Object.entries(serviceMappings)) {
            if (lowerName.includes(key)) {
              const service = services.find(s => s.name.toLowerCase() === mappedService)
              if (service) return service.id
            }
          }
          
          // Vérifier la correspondance exacte
          const service = services.find(s => s.name.toLowerCase() === lowerName)
          if (service) return service.id
          
          // Si aucune correspondance, retourner null (pas de service)
          return null
        }
        
        let totalRows = jsonData.length
        let skippedRows = 0
        let categoryNotFound = 0
        let missingData = 0
        
        jsonData.forEach((row, index) => {
          const categoryId = getCategoryIdByName(row['Catégorie prestation'])
          const serviceId = getServiceIdByName(row['Sous catégorie prestation'])
          
          if (!categoryId) {
            console.warn(`Ligne ${index + 1}: Catégorie non trouvée pour "${row['Catégorie prestation']}" - ligne ignorée`)
            categoryNotFound++
            return
          }

          const prestataire = row['Prestataire']
          const categoriePrestation = row['Catégorie prestation']
          const sousCategoriePrestation = row['Sous catégorie prestation']
          const mtHT = row['mt HT estimé 2025']
          const prestation = row['Prestation']
          const remarque = row['Remarque']
          const lieu = row['Lieu']

          if (
            prestataire &&
            categoriePrestation &&
            sousCategoriePrestation &&
            mtHT !== undefined &&
            prestation
          ) {
            // Vérifier si un budget similaire existe déjà
            const existingBudget = budgets.find(b => 
              b.name === prestation && 
              b.amount === parseFloat(mtHT) &&
              b.categoryId === categoryId
            )
            
            if (existingBudget) {
              console.warn(`Ligne ${index + 1}: Budget similaire déjà existant "${prestation}" - ligne ignorée`)
              skippedRows++
              return
            }
            
            addBudget({
              name: prestation,
              amount: parseFloat(mtHT),
              categoryId,
              serviceId,
              description: `Prestataire: ${prestataire}. ${
                remarque ? `Remarque: ${remarque}` : ''
              }`,
              startDate: '2025-01-01',
              endDate: '2025-12-31',
              lieu: lieu || ''
            })
            budgetsImported++
          } else {
            console.warn(`Ligne ${index + 1}: Données manquantes - ligne ignorée`, {
              prestataire: !!prestataire,
              categoriePrestation: !!categoriePrestation,
              sousCategoriePrestation: !!sousCategoriePrestation,
              mtHT: mtHT !== undefined,
              prestation: !!prestation
            })
            missingData++
          }
        })
        
        const message = `Importation terminée !\n\n` +
          `📊 Résultats :\n` +
          `• ${budgetsImported} budgets importés\n` +
          `• ${totalRows} lignes totales dans le fichier\n` +
          `• ${skippedRows} lignes ignorées (doublons)\n` +
          `• ${categoryNotFound} lignes ignorées (catégorie non reconnue)\n` +
          `• ${missingData} lignes ignorées (données manquantes)\n\n` +
          `💡 Conseil : Vérifiez la console pour voir les détails des lignes ignorées.`
        
        alert(message)
      } catch (error) {
        console.error("Erreur d'importation Excel:", error)
        alert("Une erreur est survenue lors de l'importation. Veuillez vérifier le format de votre fichier.")
      } finally {
        e.target.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const exportData = () => {
    const totalBudget = getTotalBudget()
    const totalExpenses = getTotalExpenses()
    const remainingBudget = getRemainingBudget()
    const percentageUsed = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0

    const data = {
      budgets,
      expenses,
      summary: {
        totalBudget,
        totalExpenses,
        remainingBudget,
        percentageUsed
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-it-report-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateExcelTemplate = () => {
    const data = [
      {
        Prestataire: 'OVH',
        'Catégorie prestation': 'DAF',
        'Sous catégorie prestation': 'Hébergement',
        'mt HT estimé 2025': 12000,
        Prestation: 'Serveur Web Principal',
        Remarque: 'Renouvellement annuel',
        Lieu: 'Paris'
      },
      {
        Prestataire: 'Microsoft',
        'Catégorie prestation': 'Production',
        'Sous catégorie prestation': 'Logiciels',
        'mt HT estimé 2025': 25000,
        Prestation: 'Licences Office 365',
        Remarque: 'Pour 50 utilisateurs',
        Lieu: 'Lyon'
      },
      {
        Prestataire: 'Free Pro',
        'Catégorie prestation': 'DAF',
        'Sous catégorie prestation': 'Télécom',
        'mt HT estimé 2025': 5000,
        Prestation: 'Abonnement Fibre',
        Remarque: '',
        Lieu: 'Marseille'
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget')

    // Auto-size columns
    const max_width = data.reduce((w, r) => Math.max(w, ...Object.values(r).map(v => (v || '').toString().length)), 10)
    worksheet['!cols'] = Object.keys(data[0]).map(() => ({ wch: max_width }))

    // Generate and download file
    XLSX.writeFile(workbook, 'modele_import_budgetIT.xlsx')
  }

  // Gestion des catégories
  const handleCategorySubmit = (e) => {
    e.preventDefault()
    
    if (editingCategory) {
      updateCategory({
        ...editingCategory,
        name: categoryForm.name,
        color: categoryForm.color
      })
    } else {
      addCategory({
        name: categoryForm.name,
        color: categoryForm.color
      })
    }
    
    setCategoryForm({ name: '', color: '#6B7280' })
    setEditingCategory(null)
    setShowCategoryForm(false)
  }

  const handleCategoryEdit = (category) => {
    setEditingCategory(category)
    setCategoryForm({ name: category.name, color: category.color })
    setShowCategoryForm(true)
  }

  const handleCategoryDelete = (category) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?\n\nCette action supprimera également tous les budgets et dépenses associés à cette catégorie.`)) {
      deleteCategory(category.id)
    }
  }

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', color: '#6B7280' })
    setEditingCategory(null)
    setShowCategoryForm(false)
  }

  // Gestion des services
  const handleServiceSubmit = (e) => {
    e.preventDefault()
    
    if (editingService) {
      updateService({
        ...editingService,
        name: serviceForm.name,
        color: serviceForm.color
      })
    } else {
      addService({
        name: serviceForm.name,
        color: serviceForm.color
      })
    }
    
    setServiceForm({ name: '', color: '#6B7280' })
    setEditingService(null)
    setShowServiceForm(false)
  }

  const handleServiceEdit = (service) => {
    setEditingService(service)
    setServiceForm({ name: service.name, color: service.color })
    setShowServiceForm(true)
  }

  const handleServiceDelete = (service) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.name}" ?\n\nCette action supprimera également tous les budgets et dépenses associés à ce service.`)) {
      deleteService(service.id)
    }
  }

  const resetServiceForm = () => {
    setServiceForm({ name: '', color: '#6B7280' })
    setEditingService(null)
    setShowServiceForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-8 w-8 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600">Gérez les paramètres de votre application</p>
        </div>
      </div>

      {/* Informations utilisateur */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <User className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Informations utilisateur</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Nom d'affichage</span>
            <span className="text-sm text-gray-900">{currentUser?.displayName || 'Non défini'}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <span className="text-sm text-gray-900">{currentUser?.email}</span>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-700">Membre depuis</span>
            <span className="text-sm text-gray-900">
              {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('fr-FR') : 'Non défini'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="btn-secondary flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* Statistiques des données */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Statistiques des données</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{budgets.length}</div>
            <div className="text-sm text-blue-700">Budgets</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{expenses.length}</div>
            <div className="text-sm text-green-700">Dépenses</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{getTotalDataCount()}</div>
            <div className="text-sm text-purple-700">Total</div>
          </div>
        </div>
      </div>

      {/* Import/Export des données */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <Download className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Import/Export des données</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Importer des budgets Excel</h4>
              <p className="text-sm text-gray-600">
                Importez des budgets depuis un fichier Excel (.xlsx, .xls)
              </p>
            </div>
            
            <label className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
              <Upload className="h-4 w-4 mr-2" />
              <span>Importer</span>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Importer des dépenses Excel</h4>
              <p className="text-sm text-gray-600">
                Importez des dépenses avec mapping flexible des colonnes et catégories
              </p>
            </div>
            
            <Link
              to="/settings/import-expenses"
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span>Importer dépenses</span>
            </Link>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Exporter les données</h4>
              <p className="text-sm text-gray-600">
                Téléchargez toutes vos données au format JSON
              </p>
            </div>
            
            <button
              onClick={exportData}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              <span>Exporter</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Télécharger le modèle Excel</h4>
              <p className="text-sm text-gray-600">
                Téléchargez le modèle Excel pour préparer vos données d'import
              </p>
            </div>
            
            <button
              onClick={generateExcelTemplate}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              <span>Télécharger modèle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gestion des catégories */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-full bg-blue-500"></div>
            <h3 className="text-lg font-semibold text-gray-900">Gestion des catégories</h3>
          </div>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une catégorie</span>
          </button>
        </div>
        
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="h-4 w-4 rounded-full" 
                  style={{ backgroundColor: category.color }}
                ></div>
                <span className="font-medium text-gray-900">{category.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCategoryEdit(category)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleCategoryDelete(category)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gestion des services */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-full bg-green-500"></div>
            <h3 className="text-lg font-semibold text-gray-900">Gestion des services</h3>
          </div>
          <button
            onClick={() => setShowServiceForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un service</span>
          </button>
        </div>
        
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="h-4 w-4 rounded-full" 
                  style={{ backgroundColor: service.color }}
                ></div>
                <span className="font-medium text-gray-900">{service.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleServiceEdit(service)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleServiceDelete(service)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gestion des données */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Gestion des données</h3>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Zone dangereuse</h4>
              <p className="text-sm text-red-700 mt-1">
                Les actions ci-dessous sont irréversibles. Assurez-vous d'avoir sauvegardé vos données importantes avant de procéder.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Supprimer toutes les données</h4>
              <p className="text-sm text-gray-600">
                Supprime définitivement tous les budgets, dépenses et services personnalisés.
              </p>
            </div>
            
            <button
              onClick={() => setShowConfirmReset(true)}
              className="btn-danger flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Supprimer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirmation de suppression</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              Êtes-vous absolument sûr de vouloir supprimer toutes les données ? Cette action est irréversible.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleResetData}
                className="btn-danger flex-1"
              >
                Supprimer tout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour ajouter/modifier une catégorie */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
              </h3>
              <button
                onClick={resetCategoryForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la catégorie
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Hardware, Software, Services..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingCategory ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour ajouter/modifier un service */}
      {showServiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingService ? 'Modifier le service' : 'Ajouter un service'}
              </h3>
              <button
                onClick={resetServiceForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du service
                </label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Direction Générale, Finance, Marketing..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <input
                  type="color"
                  value={serviceForm.color}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetServiceForm}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingService ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings 