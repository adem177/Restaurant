import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const ClientAuthContext = createContext(null)

export function ClientAuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('client_user')) || null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('client_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('client_user', JSON.stringify(res.data))
      })
      .catch(() => {
        localStorage.removeItem('client_token')
        localStorage.removeItem('client_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const persist = (data) => {
    localStorage.setItem('client_token', data.token)
    localStorage.setItem('client_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return persist(data)
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    return persist(data)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // token already invalid — clear anyway
    }
    localStorage.removeItem('client_token')
    localStorage.removeItem('client_user')
    setUser(null)
    // Always bring the visitor back to the HappyPlate home page, whatever
    // page they signed out from (account, reservation, navbar...).
    navigate('/', { replace: true })
  }

  /**
   * Update the signed-in client's profile and refresh local state.
   * @param {{ name?: string, phone?: string, locale?: string, password?: string, password_confirmation?: string }} data
   */
  const updateProfile = async (data) => {
    const { data: updated } = await api.patch('/auth/profile', data)
    localStorage.setItem('client_user', JSON.stringify(updated))
    setUser(updated)
    return updated
  }

  return (
    <ClientAuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile }}
    >
      {children}
    </ClientAuthContext.Provider>
  )
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext)
  if (!context) {
    throw new Error('useClientAuth must be used within ClientAuthProvider')
  }
  return context
}
