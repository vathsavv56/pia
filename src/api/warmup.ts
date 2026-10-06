import { IS_PROXY_MODE, PROXY_URL } from '@/config'

/**
 * Pings the reverse proxy on app load so Render's free instance spins up
 * before the user hits Send. Fire-and-forget: failures are silent because
 * a cold start just means the first real request takes longer.
 */

let warmupStarted = false

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const pingOnce = async (timeoutMs: number): Promise<boolean> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${PROXY_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export const warmupProxy = async (): Promise<void> => {
  if (!IS_PROXY_MODE || warmupStarted) return
  warmupStarted = true

  // Render sleeps after ~15 min idle and needs ~30-60s to wake.
  // First ping wakes it, retries confirm it is ready.
  const attempts = [0, 5_000, 15_000]
  for (let i = 0; i < attempts.length; i++) {
    const wait = attempts[i]
    if (wait !== undefined && wait > 0) await sleep(wait)
    const ok = await pingOnce(10_000)
    if (ok) {
      console.debug('[proxy] warmup ok')
      return
    }
  }
  console.debug('[proxy] warmup ping sent (instance may still be waking)')
}
