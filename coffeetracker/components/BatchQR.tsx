'use client'

import { useEffect, useState } from 'react'
import { QrCode, Download, X } from 'lucide-react'
import QRCode from 'qrcode'

interface BatchQRProps {
  codigo: string
}

export default function BatchQR({ codigo }: BatchQRProps) {
  const [open, setOpen] = useState(false)
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open || dataUrl) return
    const url = `${window.location.origin}/trazabilidad/${encodeURIComponent(codigo)}`
    QRCode.toDataURL(url, {
      width: 520,
      margin: 2,
      color: { dark: '#2a1608', light: '#ffffff' },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null))
  }, [open, dataUrl, codigo])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="QR code for this batch"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '8px 14px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.25)',
          background: 'rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.9)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        <QrCode size={15} /> QR code
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(42,22,8,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--white)',
              borderRadius: 18,
              boxShadow: 'var(--shadow-lg)',
              padding: '28px 30px',
              width: '100%',
              maxWidth: 360,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              position: 'relative',
            }}
          >
            <button
              onClick={() => setOpen(false)}
              title="Close"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-mid)',
                cursor: 'pointer',
                padding: 6,
              }}
            >
              <X size={18} />
            </button>

            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-dark)' }}>
              Batch QR code
            </div>

            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl}
                alt={`QR code for batch ${codigo}`}
                style={{
                  width: 240,
                  height: 240,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 240,
                  height: 240,
                  borderRadius: 12,
                  background: 'var(--cream-mid)',
                }}
              />
            )}

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text-dark)',
                }}
              >
                {codigo}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-mid)', marginTop: 4 }}>
                Print it on the bag — scanning opens this batch&apos;s full traceability.
              </div>
            </div>

            {dataUrl && (
              <a
                href={dataUrl}
                download={`${codigo}-qr.png`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 10,
                  background: 'var(--brown)',
                  color: 'var(--white)',
                  fontSize: 13.5,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Download size={15} /> Download PNG
              </a>
            )}
          </div>
        </div>
      )}
    </>
  )
}
