import {
  createDefaultFalProfile,
  createDefaultOpenAIProfile,
  DEFAULT_API_TIMEOUT,
  DEFAULT_FAL_BASE_URL,
  DEFAULT_FAL_MODEL,
  DEFAULT_IMAGES_MODEL,
  DEFAULT_RESPONSES_MODEL,
  normalizeSettings,
} from './apiProfiles'
import { readRuntimeEnv } from './runtimeEnv'
import type { ApiMode, ApiProfile, ApiProvider, AppSettings } from '../types'

const PRIVATE_SESSION_STORAGE_KEY = 'gpt-image-playground.private-session'

export interface PrivateAccount {
  username: string
  password: string
  name: string
  provider: ApiProvider
  baseUrl: string
  apiKey: string
  model: string
  timeout: number
  apiMode: ApiMode
  codexCli: boolean
  apiProxy: boolean
  responseFormatB64Json?: boolean
  streamImages?: boolean
  streamPartialImages?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readString(record: Record<string, unknown>, key: string, fallback = '') {
  return typeof record[key] === 'string' ? record[key] : fallback
}

function readBoolean(record: Record<string, unknown>, key: string, fallback = false) {
  return typeof record[key] === 'boolean' ? record[key] : fallback
}

function readNumber(record: Record<string, unknown>, key: string, fallback: number) {
  const value = record[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizePrivateAccount(input: unknown): PrivateAccount | null {
  if (!isRecord(input)) return null

  const username = readString(input, 'username').trim()
  const password = readString(input, 'password')
  if (!username || !password) return null

  const provider = readString(input, 'provider') === 'fal' ? 'fal' : 'openai'
  const apiMode = provider === 'openai' && readString(input, 'apiMode') === 'responses' ? 'responses' : 'images'
  const fallbackModel = provider === 'fal'
    ? DEFAULT_FAL_MODEL
    : apiMode === 'responses'
      ? DEFAULT_RESPONSES_MODEL
      : DEFAULT_IMAGES_MODEL

  return {
    username,
    password,
    name: readString(input, 'name', username).trim() || username,
    provider,
    baseUrl: readString(input, 'baseUrl', provider === 'fal' ? DEFAULT_FAL_BASE_URL : 'https://api.openai.com/v1'),
    apiKey: readString(input, 'apiKey'),
    model: readString(input, 'model', fallbackModel).trim() || fallbackModel,
    timeout: readNumber(input, 'timeout', DEFAULT_API_TIMEOUT),
    apiMode,
    codexCli: readBoolean(input, 'codexCli'),
    apiProxy: readBoolean(input, 'apiProxy'),
    responseFormatB64Json: input.responseFormatB64Json === true ? true : undefined,
    streamImages: typeof input.streamImages === 'boolean' ? input.streamImages : undefined,
    streamPartialImages: readNumber(input, 'streamPartialImages', 1),
  }
}

export function getPrivateAccounts() {
  const raw = readRuntimeEnv(import.meta.env.VITE_PRIVATE_ACCOUNTS)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => normalizePrivateAccount(item))
      .filter((item): item is PrivateAccount => Boolean(item))
  } catch (err) {
    console.warn('Failed to parse VITE_PRIVATE_ACCOUNTS:', err)
    return []
  }
}

export function isPrivateModeEnabled() {
  return getPrivateAccounts().length > 0
}

export function findPrivateAccount(username: string, password: string) {
  const normalizedUsername = username.trim()
  return getPrivateAccounts().find((account) => account.username === normalizedUsername && account.password === password) ?? null
}

export function readPrivateSessionUsername() {
  try {
    return window.localStorage.getItem(PRIVATE_SESSION_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function writePrivateSessionUsername(username: string) {
  try {
    window.localStorage.setItem(PRIVATE_SESSION_STORAGE_KEY, username)
  } catch {
    // 浏览器禁用 localStorage 时，当前页面刷新后需要重新登录。
  }
}

export function clearPrivateSessionUsername() {
  try {
    window.localStorage.removeItem(PRIVATE_SESSION_STORAGE_KEY)
  } catch {
    // 忽略存储清理失败。
  }
}

export function getPrivateSessionAccount() {
  const username = readPrivateSessionUsername()
  if (!username) return null
  return getPrivateAccounts().find((account) => account.username === username) ?? null
}

export function createPrivateAccountSettings(account: PrivateAccount, previousSettings: AppSettings): AppSettings {
  const id = `private-${account.username}`
  const profile: ApiProfile = account.provider === 'fal'
    ? createDefaultFalProfile({
        id,
        name: account.name,
        baseUrl: account.baseUrl,
        apiKey: account.apiKey,
        model: account.model,
        timeout: account.timeout,
      })
    : createDefaultOpenAIProfile({
        id,
        name: account.name,
        baseUrl: account.baseUrl,
        apiKey: account.apiKey,
        model: account.model,
        timeout: account.timeout,
        apiMode: account.apiMode,
        codexCli: account.codexCli,
        apiProxy: account.apiProxy,
        responseFormatB64Json: account.responseFormatB64Json,
        streamImages: account.streamImages,
        streamPartialImages: account.streamPartialImages,
      })

  return normalizeSettings({
    ...previousSettings,
    baseUrl: profile.baseUrl,
    apiKey: profile.apiKey,
    model: profile.model,
    timeout: profile.timeout,
    apiMode: profile.apiMode,
    codexCli: profile.codexCli,
    apiProxy: profile.apiProxy,
    streamImages: profile.streamImages,
    streamPartialImages: profile.streamPartialImages,
    profiles: [profile],
    activeProfileId: profile.id,
    agentTextProfileId: profile.apiMode === 'responses' ? profile.id : null,
    agentImageProfileId: profile.id,
  })
}
