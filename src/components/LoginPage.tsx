import { useState, type FormEvent } from 'react'
import { findPrivateAccount, getPrivateAccounts } from '../lib/privateAccounts'
import type { PrivateAccount } from '../lib/privateAccounts'

interface LoginPageProps {
  onLogin: (account: PrivateAccount) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const accountsConfigured = getPrivateAccounts().length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const account = findPrivateAccount(username, password)
    if (!account) {
      setError(accountsConfigured ? '账号或密码不正确' : '还没有配置登录账号')
      return
    }

    onLogin(account)
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="safe-area-x mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-12">
        <div className="mb-8">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-lg font-black text-white shadow-sm">
            AI
          </div>
          <h1 className="text-2xl font-bold tracking-tight">image2工作台</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            请使用管理员分配的账号登录。登录后会自动加载该账号对应的 API 配置。
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-gray-900"
        >
          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">账号</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-white/[0.08] dark:bg-gray-950 dark:text-gray-100"
              placeholder="请输入账号"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">密码</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-white/[0.08] dark:bg-gray-950 dark:text-gray-100"
              placeholder="请输入密码"
            />
          </label>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          {!accountsConfigured && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              请在 Vercel 环境变量中配置 VITE_PRIVATE_ACCOUNTS，重新部署后即可登录。
            </div>
          )}

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!username.trim() || !password}
          >
            登录
          </button>
        </form>
      </div>
    </main>
  )
}
