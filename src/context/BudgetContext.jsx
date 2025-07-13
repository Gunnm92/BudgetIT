import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'

const BudgetContext = createContext()

// Fonction pour générer des IDs uniques
const generateUniqueId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9)
}

const initialState = {
  budgets: [],
  expenses: [],
  categories: [
    { id: 1, name: 'Hardware', color: '#3B82F6' },
    { id: 2, name: 'Software', color: '#10B981' },
    { id: 3, name: 'Services', color: '#F59E0B' },
    { id: 4, name: 'Formation', color: '#8B5CF6' },
    { id: 5, name: 'Maintenance', color: '#EF4444' },
    { id: 6, name: 'Autres', color: '#6B7280' }
  ],
  services: [
    { id: 1, name: 'Direction Générale', color: '#1F2937' },
    { id: 2, name: 'Ressources Humaines', color: '#059669' },
    { id: 3, name: 'Finance', color: '#DC2626' },
    { id: 4, name: 'Marketing', color: '#7C3AED' },
    { id: 5, name: 'Ventes', color: '#EA580C' },
    { id: 6, name: 'Support Client', color: '#0891B2' },
    { id: 7, name: 'Développement', color: '#059669' },
    { id: 8, name: 'Infrastructure', color: '#6B7280' }
  ]
}

const budgetReducer = (state, action) => {
  console.log('Reducer action:', action.type, action.payload)
  
  switch (action.type) {
    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload }
    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets, action.payload] }
    case 'UPDATE_BUDGET':
      const updatedBudgets = state.budgets.map(budget => 
        budget.id === action.payload.id ? action.payload : budget
      )
      console.log('Updated budgets:', updatedBudgets)
      return { ...state, budgets: updatedBudgets }
    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(budget => budget.id !== action.payload)
      }
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload }
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] }
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(expense =>
          expense.id === action.payload.id ? action.payload : expense
        )
      }
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(expense => expense.id !== action.payload)
      }
    case 'ADD_SERVICE':
      return { ...state, services: [...state.services, action.payload] }
    case 'UPDATE_SERVICE':
      return {
        ...state,
        services: state.services.map(service =>
          service.id === action.payload.id ? action.payload : service
        )
      }
    case 'DELETE_SERVICE':
      return {
        ...state,
        services: state.services.filter(service => service.id !== action.payload)
      }
    case 'SET_SERVICES':
      return { ...state, services: action.payload }
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] }
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        )
      }
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload)
      }
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload }
    case 'RESET_ALL_DATA':
      return {
        ...initialState,
        categories: state.categories,
        services: state.services
      }
    default:
      return state
  }
}

export const BudgetProvider = ({ children }) => {
  const [state, dispatch] = useReducer(budgetReducer, initialState)
  const isInitialized = useRef(false)

  // Charger les données depuis localStorage au démarrage
  useEffect(() => {
    if (isInitialized.current) return
    
    const savedBudgets = localStorage.getItem('budgets')
    const savedExpenses = localStorage.getItem('expenses')
    const savedServices = localStorage.getItem('services')
    
    if (savedBudgets) {
      try {
        const budgets = JSON.parse(savedBudgets)
        // Nettoyer les doublons basés sur l'ID
        const uniqueBudgets = budgets.filter((budget, index, self) => 
          index === self.findIndex(b => b.id === budget.id)
        )
        console.log(`Chargement: ${budgets.length} budgets trouvés, ${uniqueBudgets.length} uniques`)
        dispatch({ type: 'SET_BUDGETS', payload: uniqueBudgets })
      } catch (error) {
        console.error('Erreur lors du chargement des budgets:', error)
        dispatch({ type: 'SET_BUDGETS', payload: [] })
      }
    }
    
    if (savedExpenses) {
      try {
        const expenses = JSON.parse(savedExpenses)
        const uniqueExpenses = expenses.filter((expense, index, self) => 
          index === self.findIndex(e => e.id === expense.id)
        )
        dispatch({ type: 'SET_EXPENSES', payload: uniqueExpenses })
      } catch (error) {
        console.error('Erreur lors du chargement des dépenses:', error)
        dispatch({ type: 'SET_EXPENSES', payload: [] })
      }
    }
    
    if (savedServices) {
      try {
        const services = JSON.parse(savedServices)
        const uniqueServices = services.filter((service, index, self) => 
          index === self.findIndex(s => s.id === service.id)
        )
        dispatch({ type: 'SET_SERVICES', payload: uniqueServices })
      } catch (error) {
        console.error('Erreur lors du chargement des services:', error)
        dispatch({ type: 'SET_SERVICES', payload: initialState.services })
      }
    }
    
    isInitialized.current = true
  }, [])

  // Sauvegarder les données dans localStorage à chaque changement
  useEffect(() => {
    if (!isInitialized.current) return
    console.log('Saving budgets to localStorage:', state.budgets.length)
    localStorage.setItem('budgets', JSON.stringify(state.budgets))
  }, [state.budgets])

  useEffect(() => {
    if (!isInitialized.current) return
    localStorage.setItem('expenses', JSON.stringify(state.expenses))
  }, [state.expenses])

  useEffect(() => {
    if (!isInitialized.current) return
    localStorage.setItem('services', JSON.stringify(state.services))
  }, [state.services])

  const addBudget = useCallback((budget) => {
    console.log('Adding budget:', budget)
    const newBudget = {
      ...budget,
      id: generateUniqueId(),
      createdAt: new Date().toISOString()
    }
    dispatch({ type: 'ADD_BUDGET', payload: newBudget })
  }, [])

  const updateBudget = useCallback((budget) => {
    console.log('Updating budget:', budget)
    
    // S'assurer que le budget existe avant de le mettre à jour
    const existingBudget = state.budgets.find(b => b.id === budget.id)
    if (!existingBudget) {
      console.log('Budget not found:', budget.id)
      return
    }
    
    // Créer le budget mis à jour en préservant seulement les propriétés nécessaires
    const updatedBudget = {
      id: budget.id,
      name: budget.name,
      amount: budget.amount,
      categoryId: budget.categoryId,
      serviceId: budget.serviceId,
      description: budget.description,
      startDate: budget.startDate,
      endDate: budget.endDate,
      lieu: budget.lieu,
      createdAt: existingBudget.createdAt, // Préserver la date de création
      updatedAt: new Date().toISOString()
    }
    
    console.log('Dispatching UPDATE_BUDGET with:', updatedBudget)
    dispatch({ type: 'UPDATE_BUDGET', payload: updatedBudget })
  }, [state.budgets])

  const deleteBudget = useCallback((id) => {
    dispatch({ type: 'DELETE_BUDGET', payload: id })
  }, [])

  const addExpense = useCallback((expense) => {
    const newExpense = {
      ...expense,
      id: generateUniqueId(),
      createdAt: new Date().toISOString()
    }
    dispatch({ type: 'ADD_EXPENSE', payload: newExpense })
  }, [])

  const updateExpense = useCallback((expense) => {
    dispatch({ type: 'UPDATE_EXPENSE', payload: expense })
  }, [])

  const deleteExpense = useCallback((id) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: id })
  }, [])

  const addService = useCallback((service) => {
    const newService = {
      ...service,
      id: generateUniqueId()
    }
    dispatch({ type: 'ADD_SERVICE', payload: newService })
  }, [])

  const updateService = useCallback((service) => {
    dispatch({ type: 'UPDATE_SERVICE', payload: service })
  }, [])

  const deleteService = useCallback((id) => {
    dispatch({ type: 'DELETE_SERVICE', payload: id })
  }, [])

  const addCategory = useCallback((category) => {
    const newCategory = {
      ...category,
      id: generateUniqueId(),
      color: category.color || '#6B7280' // Couleur par défaut
    }
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory })
    return newCategory
  }, [])

  const updateCategory = useCallback((category) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: category })
  }, [])

  const deleteCategory = useCallback((id) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id })
  }, [])

  const getBudgetById = useCallback((id) => {
    return state.budgets.find(budget => budget.id === id)
  }, [state.budgets])

  const getExpensesByBudgetId = useCallback((budgetId) => {
    return state.expenses.filter(expense => expense.budgetId === budgetId)
  }, [state.expenses])

  const getCategoryById = useCallback((id) => {
    return state.categories.find(category => category.id === id)
  }, [state.categories])

  const getServiceById = useCallback((id) => {
    return state.services.find(service => service.id === id)
  }, [state.services])

  const getTotalBudget = useCallback(() => {
    return state.budgets.reduce((total, budget) => total + budget.amount, 0)
  }, [state.budgets])

  const getTotalExpenses = useCallback(() => {
    return state.expenses.reduce((total, expense) => total + expense.amount, 0)
  }, [state.expenses])

  const getRemainingBudget = useCallback(() => {
    return getTotalBudget() - getTotalExpenses()
  }, [getTotalBudget, getTotalExpenses])

  const getBudgetByService = useCallback((serviceId) => {
    return state.budgets.filter(budget => budget.serviceId === serviceId)
  }, [state.budgets])

  const getExpensesByService = useCallback((serviceId) => {
    return state.expenses.filter(expense => expense.serviceId === serviceId)
  }, [state.expenses])

  const clearAllData = useCallback(() => {
    localStorage.removeItem('budgets')
    localStorage.removeItem('expenses')
    localStorage.removeItem('services')
    
    dispatch({ type: 'RESET_ALL_DATA' })
  }, [])

  const value = {
    ...state,
    addBudget,
    updateBudget,
    deleteBudget,
    addExpense,
    updateExpense,
    deleteExpense,
    addService,
    updateService,
    deleteService,
    addCategory,
    updateCategory,
    deleteCategory,
    getBudgetById,
    getExpensesByBudgetId,
    getCategoryById,
    getServiceById,
    getTotalBudget,
    getTotalExpenses,
    getRemainingBudget,
    getBudgetByService,
    getExpensesByService,
    clearAllData
  }

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  )
}

export const useBudget = () => {
  const context = useContext(BudgetContext)
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider')
  }
  return context
} 