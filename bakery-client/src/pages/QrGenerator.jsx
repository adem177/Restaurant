import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Printer } from 'react-bootstrap-icons'

const TABLE_COUNT = 12

/**
 * QR code generator for table cards.
 * The manager opens /qr-generator, picks the number of tables,
 * and prints the page to place one code on each table.
 */
export default function QrGenerator() {
  const [tables, setTables] = useState(TABLE_COUNT)
  const [baseUrl, setBaseUrl] = useState(() => window.location.origin)

  return (
    <div className="min-h-screen bg-ivory px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display mb-2 text-center text-3xl font-bold italic text-ink">
          QR Codes des tables
        </h1>
        <p className="mb-8 text-center text-sm text-ink/60">
          Générez et imprimez les QR codes à placer sur chaque table.
        </p>

        {/* Controls (hidden on print) */}
        <div className="no-print mb-10 flex flex-wrap items-end justify-center gap-6 rounded-xl bg-surface p-6">
          <div>
            <label className="mb-1 block text-sm text-ink/70">Nombre de tables</label>
            <input
              type="number"
              min="1"
              max="50"
              value={tables}
              onChange={(e) => setTables(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className="w-28 rounded-lg border border-ink/20 bg-ivory px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1 min-w-[280px]">
            <label className="mb-1 block text-sm text-ink/70">URL du menu</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-ivory px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            <span className="inline-flex items-center gap-2">
              <Printer className="h-4 w-4" /> Imprimer
            </span>
          </button>
        </div>

        {/* QR grid */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: tables }, (_, i) => i + 1).map((table) => (
            <div
              key={table}
              className="flex flex-col items-center gap-3 rounded-xl border border-ink/10 bg-white p-5 text-center"
            >
              <QRCodeSVG
                value={`${baseUrl}/qr?table=${table}`}
                size={140}
                level="M"
              />
              <div>
                <p className="font-display text-lg font-bold text-ink">
                  Table {table}
                </p>
                <p className="text-[10px] text-ink/50">Scannez pour voir la carte</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
