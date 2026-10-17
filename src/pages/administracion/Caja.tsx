import { useState, type FormEvent } from "react"

import { Campo, Encabezado, Estado, EstadoCarga, Panel } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { enviar, useDatos } from "@/lib/datos"
import { bs, fecha, fechaHora } from "@/lib/formato"
import type { Caja as TipoCaja } from "@/lib/tipos"

export default function Caja() {
  // 404 = el usuario no tiene caja abierta
  const actual = useDatos<TipoCaja>("/caja/actual")
  const historial = useDatos<TipoCaja[]>("/cajas")
  const [montoApertura, setMontoApertura] = useState("0")
  const [montoContado, setMontoContado] = useState("")
  const [observacion, setObservacion] = useState("")

  const cajaAbierta = actual.error ? null : actual.datos

  function recargar() {
    actual.recargar()
    historial.recargar()
  }

  async function abrir(evento: FormEvent) {
    evento.preventDefault()
    if (await enviar("/caja/abrir", { monto_apertura: Number(montoApertura) }, "Caja abierta")) recargar()
  }

  async function cerrar(evento: FormEvent) {
    evento.preventDefault()
    const cerrada = await enviar<TipoCaja>(
      "/caja/cerrar",
      { monto_contado: Number(montoContado), observacion_cierre: observacion || null },
      "Caja cerrada",
    )
    if (cerrada) {
      setMontoContado("")
      setObservacion("")
      recargar()
    }
  }

  return (
    <>
      <Encabezado
        titulo="Caja"
        descripcion="Apertura y cierre con arqueo. La fecha y la hora las pone el servidor (HU5)."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {actual.cargando ? (
          <Panel><EstadoCarga cargando error="" /></Panel>
        ) : cajaAbierta ? (
          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Caja N° {cajaAbierta.id_caja}</h2>
              <Estado valor="ABIERTA" />
            </div>
            <p className="text-sm text-muted-foreground">
              Abierta el {fechaHora(cajaAbierta.hora_apertura)} con {bs(cajaAbierta.monto_apertura)}.
            </p>
            <form onSubmit={cerrar} className="mt-4 grid gap-3">
              <Campo etiqueta="Efectivo contado (Bs)" ayuda="Se compara con apertura + cobros en efectivo">
                <Input type="number" step="0.01" min="0" value={montoContado}
                  onChange={(e) => setMontoContado(e.target.value)} required />
              </Campo>
              <Campo etiqueta="Observación de cierre" ayuda="Obligatoria si el arqueo no cuadra">
                <Textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} />
              </Campo>
              <Button type="submit" variant="destructive">Cerrar caja</Button>
            </form>
          </Panel>
        ) : (
          <Panel>
            <h2 className="mb-1 font-semibold">No tiene una caja abierta</h2>
            <p className="mb-4 text-sm text-muted-foreground">Abra la caja para poder cobrar avisos.</p>
            <form onSubmit={abrir} className="grid gap-3">
              <Campo etiqueta="Monto de apertura (Bs)">
                <Input type="number" step="0.01" min="0" value={montoApertura}
                  onChange={(e) => setMontoApertura(e.target.value)} required />
              </Campo>
              <Button type="submit">Abrir caja</Button>
            </form>
          </Panel>
        )}
      </div>

      <Panel>
        <h2 className="mb-2 font-semibold">Historial de cajas</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Apertura</TableHead>
              <TableHead>Cierre</TableHead>
              <TableHead className="text-right">Monto inicial</TableHead>
              <TableHead className="text-right">Cobrado</TableHead>
              <TableHead className="text-right">Diferencia</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historial.datos?.map((c) => (
              <TableRow key={c.id_caja}>
                <TableCell>{c.id_caja}</TableCell>
                <TableCell>{fecha(c.fecha)}</TableCell>
                <TableCell>{c.hora_apertura.slice(11, 16)}</TableCell>
                <TableCell>{c.hora_cierre ? c.hora_cierre.slice(11, 16) : "—"}</TableCell>
                <TableCell className="text-right">{bs(c.monto_apertura)}</TableCell>
                <TableCell className="text-right">{bs(c.monto_cobrado)}</TableCell>
                <TableCell className="text-right" title={c.observacion_cierre ?? ""}>
                  {bs(c.diferencia_arqueo)}
                </TableCell>
                <TableCell><Estado valor={c.estado ? "ABIERTA" : "CERRADA"} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EstadoCarga cargando={historial.cargando} error={historial.error} vacio={historial.datos?.length === 0} />
      </Panel>
    </>
  )
}
