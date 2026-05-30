"use client"

import { useState, useEffect } from 'react'
import { Minus, Maximize2, Square, X } from 'lucide-react'

export default function AppTitlebar() {
  const [isMaximized, setIsMaximized] =
    useState(false)
  const [isDesktop, setIsDesktop] =
    useState(false)

  useEffect(() => {
    const inWebView = typeof window !==
        'undefined' &&
      !!(window as any).chrome?.webview
    setIsDesktop(inWebView)

    if (!inWebView) return

    const handler = (e: MessageEvent) => {
      if (e.data === 'maximized')
        setIsMaximized(true)
      if (e.data === 'restored')
        setIsMaximized(false)
    }

    const wv = (window as any).chrome.webview
    wv.addEventListener('message', handler)

    return () => {
      wv.removeEventListener('message', handler)
    }
  }, [])

  if (!isDesktop) return null

  function send(action: string) {
    try {
      (window as any).chrome.webview
        .postMessage(action)
    } catch { }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    send('drag')
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className="app-titlebar flex-shrink-0 h-10 flex items-center
        justify-between select-none
        bg-[#0B1628] border-b
        border-white/[0.06]"
      style={{ cursor: 'default' }}
    >
      <div className="flex items-center
        gap-2 px-4 pointer-events-none">
        <div className="w-5 h-5 rounded-full
          border border-blue-400/50
          flex items-center justify-center">
          <span className="text-blue-300
            text-[9px] font-bold">
            HR
          </span>
        </div>
        <span className="text-white/60 text-xs
          font-medium tracking-wide">
          HRKonek
        </span>
      </div>

      <div className="flex h-full
        pointer-events-auto">

        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => send('minimize')}
          className="w-12 h-full flex items-center
            justify-center
            text-white/40 hover:text-white
            hover:bg-white/10
            transition-all duration-150"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => send('maximize')}
          className="w-12 h-full flex items-center
            justify-center
            text-white/40 hover:text-white
            hover:bg-white/10
            transition-all duration-150"
        >
          {isMaximized
            ? <Square className="w-3 h-3" />
            : <Maximize2 className="w-3.5 h-3.5" />
          }
        </button>

        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => send('close')}
          className="w-12 h-full flex items-center
            justify-center
            text-white/40 hover:text-white
            hover:bg-red-600
            transition-all duration-150"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
