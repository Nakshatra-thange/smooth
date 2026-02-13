import api from './api'
import { STORAGE_KEYS } from '../utils/storage'

export async function verifyWallet(
  walletAddress: string,
  signature: string,
  message: string
) {
  return api.post('/api/auth/verify', {
    walletAddress,
    signature,
    message
  })
}

export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
}

export function setStoredToken(token: string) {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
}

export function clearStoredToken() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
}

export function isTokenExpired(token: string) {
  try {
    const payload = token.split('.')[1]
    const normalized = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const decoded = JSON.parse(atob(normalized))
    return decoded.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export async function getUserProfile() {
  return api.get('/api/user/profile')
}
