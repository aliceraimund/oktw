'use client'

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import ReactSignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'

export interface SignatureCanvasHandle {
  isEmpty: () => boolean
  toDataURL: (type?: string) => string
  clear: () => void
}

interface SignatureCanvasProps {
  className?: string
}

const ALTURA = 176 // px

const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(
  ({ className }, ref) => {
    const sigRef = useRef<ReactSignatureCanvas>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      isEmpty: () => sigRef.current?.isEmpty() ?? true,
      toDataURL: (type = 'image/png') => sigRef.current?.toDataURL(type) ?? '',
      clear: () => sigRef.current?.clear(),
    }))

    // Ajusta a resolução real do canvas ao tamanho exibido (evita traço deslocado
    // e mantém a assinatura nítida no toque, inclusive em telas retina).
    useEffect(() => {
      const wrapper = wrapperRef.current
      const canvas = sigRef.current?.getCanvas()
      if (!wrapper || !canvas) return

      function ajustar() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        const largura = wrapper!.clientWidth
        canvas!.width = largura * ratio
        canvas!.height = ALTURA * ratio
        canvas!.style.width = `${largura}px`
        canvas!.style.height = `${ALTURA}px`
        const ctx = canvas!.getContext('2d')
        ctx?.scale(ratio, ratio)
        sigRef.current?.clear()
      }

      ajustar()
      window.addEventListener('resize', ajustar)
      window.addEventListener('orientationchange', ajustar)
      return () => {
        window.removeEventListener('resize', ajustar)
        window.removeEventListener('orientationchange', ajustar)
      }
    }, [])

    return (
      <div className={className}>
        <div
          ref={wrapperRef}
          className="border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden touch-none"
          style={{ height: ALTURA }}
        >
          <ReactSignatureCanvas
            ref={sigRef}
            penColor="#0f172a"
            canvasProps={{
              className: 'block rounded-lg',
              style: { touchAction: 'none' },
            }}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => sigRef.current?.clear()}
        >
          Limpar assinatura
        </Button>
      </div>
    )
  }
)

SignatureCanvas.displayName = 'SignatureCanvas'

export { SignatureCanvas }
