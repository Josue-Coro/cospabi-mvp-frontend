import { QRCodeSVG } from "qrcode.react"

import { bs, fechaHora } from "@/lib/formato"
import type { FacturaDetalle } from "@/lib/tipos"

/** Factura imprimible con los campos de una factura del SIAT. Es simulada y lo dice en el documento. */
export default function VistaFactura({ f }: { f: FacturaDetalle }) {
  // El QR describe la factura, pero no apunta al verificador real del SIAT
  const textoQr = [
    `COSPABI R.L. - FACTURA SIMULADA N° ${f.numero_factura}`,
    `NIT emisor: ${f.emisor.nit}`,
    `Cliente: ${f.nit_ci} ${f.razon_social}`,
    `Monto: ${f.monto_total.toFixed(2)} Bs`,
    `CUF: ${f.cuf}`,
    "SIN VALIDEZ FISCAL",
  ].join("\n")

  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden rounded-xl border bg-background p-6 text-sm print:border-0">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="-rotate-30 text-5xl font-bold text-red-500/10 select-none">SIN VALIDEZ FISCAL</span>
      </div>

      <div className="mb-4 flex items-start justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-base font-semibold">{f.emisor.razon_social}</p>
          <p className="text-xs text-muted-foreground">Comunidad El Bisito, Cotoca – Santa Cruz, Bolivia</p>
          <p className="text-xs text-muted-foreground">Servicio de agua potable</p>
        </div>
        <div className="text-right text-xs">
          <p className="text-base font-semibold">FACTURA</p>
          <p>NIT: {f.emisor.nit}</p>
          <p>N° de factura: <b>{f.numero_factura}</b></p>
          <p className="max-w-56 break-all">CUF: {f.cuf}</p>
          <p className="mt-1 rounded bg-red-50 px-1.5 py-0.5 font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">{f.modalidad}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <p><span className="text-muted-foreground">Fecha:</span> {fechaHora(f.fecha_emision)}</p>
        <p><span className="text-muted-foreground">NIT/CI:</span> {f.nit_ci}</p>
        <p className="col-span-2"><span className="text-muted-foreground">Nombre / razón social:</span> {f.razon_social}</p>
        {f.codigo_fijo && (
          <p><span className="text-muted-foreground">Código fijo:</span> {f.codigo_fijo} · periodo {f.periodo}</p>
        )}
        <p><span className="text-muted-foreground">Método de pago:</span> {f.metodo_pago}</p>
      </div>

      <table className="mb-4 w-full">
        <thead>
          <tr className="border-b text-left text-muted-foreground"><th className="py-1.5">Detalle</th><th className="py-1.5 text-right">Subtotal</th></tr>
        </thead>
        <tbody>
          {f.lineas.map((linea, i) => (
            <tr key={i} className="border-b"><td className="py-1.5">{linea.concepto}</td><td className="py-1.5 text-right">{bs(linea.monto)}</td></tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td className="pt-2 font-semibold">TOTAL</td><td className="pt-2 text-right text-base font-semibold">{bs(f.monto_total)}</td></tr>
        </tfoot>
      </table>

      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1 text-xs">
          <p>Código de control: <b className="font-mono">{f.codigo_control}</b></p>
          <p className="font-medium">ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY</p>
          <p className="text-muted-foreground">{f.leyenda}</p>
          <p className="text-muted-foreground">Documento generado por el MVP académico de COSPABI R.L.; no fue enviado al SIAT.</p>
        </div>
        <QRCodeSVG value={textoQr} size={96} className="shrink-0" />
      </div>
    </div>
  )
}
