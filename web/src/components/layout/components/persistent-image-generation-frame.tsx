/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
/* eslint-disable react/iframe-missing-sandbox -- This bundled, same-origin app needs scripts and a stable origin for the authenticated postMessage bridge. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useTheme } from '@/context/theme-provider'
import { getFreshAuthHeaders } from '@/lib/auth-session'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { Main } from './main'

type PersistentImageGenerationFrameProps = {
  active: boolean
}

export function PersistentImageGenerationFrame(
  props: PersistentImageGenerationFrameProps
) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const accessToken = useAuthStore((state) => state.auth.accessToken)
  const accessExpiresAt = useAuthStore((state) => state.auth.accessExpiresAt)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [mounted, setMounted] = useState(props.active)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Mount once on first visit, then keep in-flight generation alive across navigation.
    if (props.active) setMounted(true)
  }, [props.active])

  const syncIframeContext = useCallback(async () => {
    const target = iframeRef.current?.contentWindow
    if (!target) return

    let freshAccessToken = accessToken
    try {
      const headers = await getFreshAuthHeaders()
      freshAccessToken =
        headers.Authorization?.replace(/^Bearer\s+/i, '') ?? null
    } catch {
      freshAccessToken = null
    }

    target.postMessage(
      {
        type: 'new-api:image-playground-context',
        accessToken: freshAccessToken,
        theme: resolvedTheme,
      },
      window.location.origin
    )
  }, [accessToken, resolvedTheme])

  useEffect(() => {
    if (!props.active) return
    void syncIframeContext()
  }, [props.active, syncIframeContext])

  useEffect(() => {
    if (!accessExpiresAt) return
    const refreshAt = accessExpiresAt * 1000 - Date.now() - 60_000
    const timer = window.setTimeout(
      () => void syncIframeContext(),
      Math.max(0, refreshAt)
    )
    return () => window.clearTimeout(timer)
  }, [accessExpiresAt, syncIframeContext])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow ||
        event.data?.type !== 'new-api:image-playground-ready'
      ) {
        return
      }
      void syncIframeContext()
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [syncIframeContext])

  if (!mounted) return null

  return (
    <Main
      aria-hidden={!props.active}
      className={cn(
        'bg-background absolute inset-0 p-0',
        props.active ? 'visible' : 'pointer-events-none invisible'
      )}
    >
      <iframe
        ref={iframeRef}
        title={t('Image Generation')}
        src='/image-playground/'
        className='h-full min-h-0 w-full flex-1 border-0'
        allow='clipboard-read; clipboard-write'
        sandbox='allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts'
        onLoad={() => void syncIframeContext()}
      />
    </Main>
  )
}
