'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'
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

const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(
  ({ className }, ref) => {
    const sigRef = useRef<ReactSignatureCanvas>(null)

    useImperativeHandle(ref, () => ({
      isEmpty: () => sigRef.current?.isEmpty() ?? true,
      toDataURL: (type = 'image/png') => sigRef.current?.toDataURL(type) ?? '',
      clear: () => sigRef.current?.clear(),
    }))

    return (
      <div className={className}>
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white touch-none">
          <ReactSignatureCanvas
            ref={sigRef}
            penColor="#0f172a"
            canvasProps={{
              className: 'w-full h-40 rounded-lg',
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
