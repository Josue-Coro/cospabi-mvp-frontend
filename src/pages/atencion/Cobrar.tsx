import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { HandCoinsIcon, SearchIcon } from "lucide-react"

import { Campo, Encabezado, Estado, EstadoCarga, Panel, Seleccion } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { consulta, enviar, useDatos } from "@/lib/datos"
import { bs, fecha, ordenarPeriodos } from "@/lib/formato"
import type { Aviso, AvisoDetalle, Caja, MetodoPago, Pago } from "@/lib/tipos"

export default function Cobrar() {
  const caja = useDatos<Caja>("/caja/actual")
  const [parametros] = useSearchParams()
  const [busqueda, setBusqueda] = useState(parametros.get("q") ?? "")
  const [q, setQ] = useState(parametros.get("q") ?? "")
  const avisos = useDatos<Aviso[]>(q ? `/avisos${consulta({ q })}` : null)
  const [cobrando, setCobrando] = useState<Aviso | null>(null)
  const [ultimoPago, setUltimoPago] = useState<Pago | null>(null)

  // Pendientes y vencidos, del más antiguo al más reciente (se cobra primero la deuda más antigua)
  const porCobrar = ordenarPeriodos(
    avisos.datos?.filter((a) => a.estado === "PENDIENTE" || a.estado === "VENCIDO") ?? [],
  ).reverse()

  return (
    <>
      <Encabezado titulo="Cobrar avisos" descripcion="Cobro en ventanilla con efectivo, QR o transferencia (HU13)." />

      {!caja.cargando && caja.error && (
        <Panel className="mb-4 border-amber-300 bg-amber-50">
          <p className="text-sm">
            Debe abrir una caja antes de cobrar. <Link to="/caja" className="font-medium text-primary underline">Ir a Caja</Link>
          </p>
        </Panel>
      )}

      {ultimoPago && (
        <Panel className="mb-4 border-emerald-300 bg-emerald-50">
          <p className="text-sm">
            Pago N° {ultimoPago.id_pago} registrado por {bs(ultimoPago.monto_pagado)}
            {ultimoPago.vuelto ? `, vuelto ${bs(ultimoPago.vuelto)}` : ""}.{" "}
            <Link to={`/avisos/${ultimoPago.aviso_id_aviso}`} className="font-medium text-primary underline">Ver aviso</Link>
            {ultimoPago.id_factura && (
              <> · <Link to={`/facturas/${ultimoPago.id_factura}`} className="font-medium text-primary underline">Ver factura</Link></>
            )}
          </p>
        </Panel>
      )}

      <form onSubmit={(e) => { e.preventDefault(); setQ(busqueda.trim()) }} className="mb-4 flex max-w-md gap-2">
        <Input placeholder="Código fijo o nombre del socio" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} autoFocus />
        <Button type="submit"><SearchIcon /> Buscar</Button>
      </form>

      {q && (
        <Panel>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aviso</TableHead>
                <TableHead>Socio</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {porCobrar.map((a, indice) => (
                <TableRow key={a.id_aviso}>
                  <TableCell>{a.id_aviso}</TableCell>
                  <TableCell>{a.codigo_fijo} · {a.nombre_socio}</TableCell>
                  <TableCell>{a.periodo}</TableCell>
                  <TableCell>{fecha(a.fecha_vencimiento)}</TableCell>
                  <TableCell className="text-right font-medium">{bs(a.total_aviso)}</TableCell>
                  <TableCell><Estado valor={a.estado} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" disabled={!!caja.error} onClick={() => setCobrando(a)}
                      variant={indice === 0 ? "default" : "outline"}>
                      <HandCoinsIcon /> Cobrar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <EstadoCarga cargando={avisos.cargando} error={avisos.error} vacio={porCobrar.length === 0}
            textoVacio="El socio no tiene avisos pendientes." />
        </Panel>
      )}

      {cobrando && (
        <DialogoCobro
          aviso={cobrando}
          alCerrar={() => setCobrando(null)}
          alPagar={(pago) => {
            setCobrando(null)
            setUltimoPago(pago)
            avisos.recargar()
          }}
        />
      )}
    </>
  )
}

function DialogoCobro({
  aviso, alCerrar, alPagar,
}: { aviso: Aviso; alCerrar: () => void; alPagar: (pago: Pago) => void }) {
  const detalle = useDatos<AvisoDetalle>(`/avisos/${aviso.id_aviso}/detalle`)
  const metodos = useDatos<MetodoPago[]>("/metodos-pago")
  const [metodo, setMetodo] = useState("1")
  const [recibido, setRecibido] = useState("")
  const [conFactura, setConFactura] = useState(false)
  const [nit, setNit] = useState("")
  const [razon, setRazon] = useState(aviso.nombre_socio)
  const [enviando, setEnviando] = useState(false)

  const esEfectivo = metodos.datos?.find((m) => String(m.id_metodo_pago) === metodo)?.metodo === "Efectivo"
  const vuelto = Number(recibido) - aviso.total_aviso
  const d = detalle.datos

  async function cobrar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    const pago = await enviar<Pago>("/pagos", {
      aviso_id_aviso: aviso.id_aviso,
      metodo_pago_id_metodo_pago: Number(metodo),
      monto_recibido: esEfectivo ? Number(recibido) : null,
      con_factura: conFactura,
      nit_ci: conFactura ? nit : null,
      razon_social: conFactura ? razon : null,
    }, "Pago registrado")
    setEnviando(false)
    if (pago) alPagar(pago)
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cobrar aviso N° {aviso.id_aviso} · {aviso.periodo}</DialogTitle>
        </DialogHeader>
        <form onSubmit={cobrar} className="grid gap-3">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{aviso.codigo_fijo} · {aviso.nombre_socio}</p>
            {d ? (
              <ul className="mt-2 space-y-1">
                <li className="flex justify-between"><span>Consumo {d.lectura?.consumo_m3 ?? 0} m³</span><span>{bs(d.total_consumo)}</span></li>
                {d.cargos.map((c) => (
                  <li key={c.id_cargo_extra} className="flex justify-between"><span>{c.descripcion}</span><span>{bs(c.monto)}</span></li>
                ))}
                {d.cuotas_inscripcion.map((c) => (
                  <li key={c.num_cuota} className="flex justify-between"><span>Cuota {c.num_cuota}/4 de inscripción</span><span>{bs(c.monto)}</span></li>
                ))}
                <li className="flex justify-between border-t pt-1 text-base font-semibold"><span>Total</span><span>{bs(d.total_aviso)}</span></li>
              </ul>
            ) : <EstadoCarga cargando={detalle.cargando} error={detalle.error} />}
          </div>

          <Campo etiqueta="Método de pago">
            <Seleccion value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {metodos.datos?.map((m) => <option key={m.id_metodo_pago} value={m.id_metodo_pago}>{m.metodo}</option>)}
            </Seleccion>
          </Campo>
          {esEfectivo && (
            <Campo etiqueta="Monto recibido (Bs)" ayuda={recibido && vuelto >= 0 ? `Vuelto: ${bs(vuelto)}` : "No se aceptan pagos parciales"}>
              <Input type="number" step="0.01" min={aviso.total_aviso} value={recibido}
                onChange={(e) => setRecibido(e.target.value)} required />
            </Campo>
          )}

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={conFactura} onChange={(e) => setConFactura(e.target.checked)} />
            ¿Desea factura?
          </label>
          {conFactura && (
            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <Campo etiqueta="NIT / CI">
                <Input value={nit} onChange={(e) => setNit(e.target.value)} pattern="[0-9A-Za-z\-]{3,20}" required />
              </Campo>
              <Campo etiqueta="Razón social">
                <Input value={razon} onChange={(e) => setRazon(e.target.value)} minLength={2} required />
              </Campo>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={enviando || !d}>
              {enviando ? "Registrando..." : `Cobrar ${bs(aviso.total_aviso)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
