import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_user')) || null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/admin/me')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('admin_user', JSON.stringify(res.data))
      })
      .catch(() => {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await api.post('/admin/logout')
    } catch {
      // token already invalid — clear anyway
    }
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
