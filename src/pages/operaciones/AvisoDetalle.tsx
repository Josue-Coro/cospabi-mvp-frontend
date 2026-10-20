import { useState, type FormEvent } from "react"
import { Link, useParams } from "react-router-dom"
import { HandCoinsIcon, ReceiptIcon } from "lucide-react"

import { BotonImprimir, Campo, Encabezado, Estado, EstadoCarga, Panel } from "@/components/comunes"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { enviar, useDatos } from "@/lib/datos"
import { bs, fecha, fechaHora } from "@/lib/formato"
import type { AvisoDetalle as TipoAviso } from "@/lib/tipos"

/** Aviso de cobranza listo para imprimir (HU15). */
export default function AvisoDetalle() {
  const { id } = useParams()
  const aviso = useDatos<TipoAviso>(`/avisos/${id}/detalle`)
  const [anulando, setAnulando] = useState(false)
  const [motivo, setMotivo] = useState("")
  const a = aviso.datos

  if (!a) return <EstadoCarga cargando={aviso.cargando} error={aviso.error} />

  const abierto = a.estado === "PENDIENTE" || a.estado === "VENCIDO"

  async function anular(evento: FormEvent) {
    evento.preventDefault()
    if (await enviar(`/avisos/${id}/anular`, { motivo }, "Aviso anulado")) {
      setAnulando(false)
      aviso.recargar()
    }
  }

  return (
    <>
      <Encabezado titulo={`Aviso N° ${a.id_aviso}`} descripcion={`${a.socio.codigo_fijo} · ${a.socio.nombre_socio} · ${a.periodo}`}>
        <BotonImprimir />
        {abierto && (
          <Link to={`/cobrar?q=${a.socio.codigo_fijo}`} className={buttonVariants()}><HandCoinsIcon /> Cobrar</Link>
        )}
        {a.pago?.id_factura && (
          <Link to={`/facturas/${a.pago.id_factura}`} className={buttonVariants({ variant: "outline" })}>
            <ReceiptIcon /> Ver factura
          </Link>
        )}
        {a.pago?.factura_url && (
          <a href={a.pago.factura_url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>
            <ReceiptIcon /> Factura de Libélula
          </a>
        )}
        {abierto && <Button variant="destructive" onClick={() => setAnulando(true)}>Anular</Button>}
      </Encabezado>

      <Panel className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-start justify-between border-b pb-3">
          <div>
            <p className="font-semibold">COOPERATIVA DE AGUA POTABLE COSPABI R.L.</p>
            <p className="text-xs text-muted-foreground">Comunidad El Bisito, Cotoca – Santa Cruz, Bolivia</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">AVISO DE COBRANZA N° {a.id_aviso}</p>
            <Estado valor={a.estado} />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Dato nombre="Código fijo" valor={a.socio.codigo_fijo} />
          <Dato nombre="Socio" valor={a.socio.nombre_socio} />
          <Dato nombre="Categoría" valor={a.socio.categoria} />
          <Dato nombre="Ruta / casa" valor={`${a.socio.ruta} / ${a.socio.num_casa ?? "—"}`} />
          <Dato nombre="Periodo" valor={a.periodo} />
          <Dato nombre="Emisión" valor={fecha(a.fecha_emision)} />
          <Dato nombre="Vencimiento" valor={fecha(a.fecha_vencimiento)} />
          <Dato nombre="Fecha de lectura" valor={fecha(a.lectura?.fecha_lectura)} />
        </div>

        {a.lectura && (
          <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 text-center text-sm">
            <Dato nombre="Lectura anterior" valor={`${a.lectura.lectura_anterior} m³`} />
            <Dato nombre="Lectura actual" valor={`${a.lectura.lectura_actual} m³`} />
            <Dato nombre="Consumo" valor={`${a.lectura.consumo_m3} m³`} />
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground"><th className="py-1.5">Concepto</th><th className="py-1.5 text-right">Importe</th></tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-1.5">
                Consumo de agua
                {a.tarifa && (
                  <span className="block text-xs text-muted-foreground">
                    Mínimo {bs(a.tarifa.monto_minimo)} hasta {a.tarifa.consumo_minimo_m3} m³, luego {bs(a.tarifa.precio_m3)} por m³
                  </span>
                )}
              </td>
              <td className="py-1.5 text-right">{bs(a.total_consumo)}</td>
            </tr>
            {a.cargos.map((c) => (
              <tr key={c.id_cargo_extra} className="border-b">
                <td className="py-1.5">{c.descripcion}<span className="block text-xs text-muted-foreground">{c.tipo}</span></td>
                <td className="py-1.5 text-right">{bs(c.monto)}</td>
              </tr>
            ))}
            {a.cuotas_inscripcion.map((c) => (
              <tr key={c.num_cuota} className="border-b">
                <td className="py-1.5">Cuota {c.num_cuota} de 4 del crédito de inscripción</td>
                <td className="py-1.5 text-right">{bs(c.monto)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td className="pt-2 text-base font-semibold">TOTAL A PAGAR</td><td className="pt-2 text-right text-base font-semibold">{bs(a.total_aviso)}</td></tr>
          </tfoot>
        </table>

        {a.pago && (
          <p className="mt-4 rounded-lg bg-emerald-50 p-2.5 text-sm dark:bg-emerald-950/60">
            Pagado el {fechaHora(a.pago.fecha_pago)} con {a.pago.metodo}
            {a.pago.forma_pago === "PORTAL" ? " desde el portal del socio" : " en ventanilla"} · pago N° {a.pago.id_pago}
          </p>
        )}
        {a.estado === "ANULADO" && (
          <p className="mt-4 rounded-lg bg-zinc-100 p-2.5 text-sm dark:bg-zinc-800">Anulado: {a.motivo_anulacion}</p>
        )}
      </Panel>

      <Dialog open={anulando} onOpenChange={setAnulando}>
        <DialogContent>
          <DialogHeader><DialogTitle>Anular aviso N° {a.id_aviso}</DialogTitle></DialogHeader>
          <form onSubmit={anular} className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Después se puede volver a generar desde la misma lectura (por ejemplo, si la lectura estaba mal tomada).
            </p>
            <Campo etiqueta="Motivo">
              <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} minLength={3} required />
            </Campo>
            <DialogFooter><Button type="submit" variant="destructive">Anular aviso</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Dato({ nombre, valor }: { nombre: string; valor: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{nombre}</p>
      <p className="font-medium">{valor}</p>
    </div>
  )
}
