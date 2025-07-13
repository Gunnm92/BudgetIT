import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const savedUser = localStorage.getItem('budgetit_user')
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  // Inscription
  const signup = async (email, password, displayName) => {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUsers = JSON.parse(localStorage.getItem('budgetit_users') || '[]')
      const userExists = existingUsers.find(user => user.email === email)
      
      if (userExists) {
        throw new Error('Un compte existe déjà avec cet email.')
      }

      // Créer le nouvel utilisateur
      const newUser = {
        id: Date.now(),
        email,
        displayName,
        createdAt: new Date().toISOString()
      }

      // Sauvegarder le mot de passe (en pratique, il faudrait le hasher)
      const userWithPassword = {
        ...newUser,
        password // ⚠️ En production, il faudrait hasher le mot de passe
      }

      // Ajouter aux utilisateurs existants
      existingUsers.push(userWithPassword)
      localStorage.setItem('budgetit_users', JSON.stringify(existingUsers))

      // Connecter l'utilisateur
      setCurrentUser(newUser)
      localStorage.setItem('budgetit_user', JSON.stringify(newUser))

      return newUser
    } catch (error) {
      throw error
    }
  }

  // Connexion
  const login = async (email, password) => {
    try {
      const users = JSON.parse(localStorage.getItem('budgetit_users') || '[]')
      const user = users.find(u => u.email === email && u.password === password)
      
      if (!user) {
        throw new Error('Email ou mot de passe incorrect.')
      }

      // Créer l'objet utilisateur sans le mot de passe
      const { password: _, ...userWithoutPassword } = user
      
      setCurrentUser(userWithoutPassword)
      localStorage.setItem('budgetit_user', JSON.stringify(userWithoutPassword))

      return userWithoutPassword
    } catch (error) {
      throw error
    }
  }

  // Déconnexion
  const logout = async () => {
    try {
      setCurrentUser(null)
      localStorage.removeItem('budgetit_user')
    } catch (error) {
      throw error
    }
  }

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 