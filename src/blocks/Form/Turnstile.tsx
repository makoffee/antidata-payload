'use client'
import React, { useEffect, useRef } from 'react'

type TurnstileApi = {
  remove: (widgetId: string) => void
  render: (
    element: HTMLElement,
    options: {
      'error-callback': () => void
      'expired-callback': () => void
      callback: (token: string) => void
      sitekey: string
    },
  ) => string
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// Cloudflare Turnstile widget (the bot check). `resetKey` forces a fresh challenge, because
// a token works only once.
export const Turnstile: React.FC<{
  onToken: (token: string | null) => void
  resetKey: number
  siteKey: string
}> = ({ onToken, resetKey, siteKey }) => {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let widgetId: string | undefined
    let cancelled = false

    const render = (): void => {
      if (cancelled || !container.current || !window.turnstile) return
      widgetId = window.turnstile.render(container.current, {
        'error-callback': () => onToken(null),
        'expired-callback': () => onToken(null),
        callback: (token) => onToken(token),
        sitekey: siteKey,
      })
    }

    if (window.turnstile) {
      render()
    } else {
      let script = document.querySelector<HTMLScriptElement>('script[data-turnstile]')
      if (!script) {
        script = document.createElement('script')
        script.src = SCRIPT_SRC
        script.async = true
        script.dataset.turnstile = 'true'
        document.head.appendChild(script)
      }
      script.addEventListener('load', render)
    }

    return () => {
      cancelled = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [onToken, resetKey, siteKey])

  return <div className="mt-6" ref={container} />
}
