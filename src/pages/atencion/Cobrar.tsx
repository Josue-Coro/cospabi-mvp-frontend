import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ExternalLinkIcon, HandCoinsIcon, Loader2Icon, QrCodeIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { Campo, Encabezado, Estado, EstadoCarga, Panel, Seleccion } from "@/components/comunes"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { consulta, enviar, useDatos } from "@/lib/datos"
import { bs, fecha, ordenarPeriodos } from "@/lib/formato"
import type { Aviso, AvisoDetalle, Caja, MetodoPago, Pago, PagoQr } from "@/lib/tipos"

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
        <Panel className="mb-4 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/60">
          <p className="text-sm">
            Debe abrir una caja antes de cobrar. <Link to="/caja" className="font-medium text-primary underline">Ir a Caja</Link>
          </p>
        </Panel>
      )}

      {ultimoPago && (
        <Panel className="mb-4 border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/60">
          <p className="text-sm">
            Pago N° {ultimoPago.id_pago} registrado por {bs(ultimoPago.monto_pagado)}
            {ultimoPago.vuelto ? `, vuelto ${bs(ultimoPago.vuelto)}` : ""}.{" "}
            <Link to={`/avisos/${ultimoPago.aviso_id_aviso}`} className="font-medium text-primary underline">Ver aviso</Link>
            {ultimoPago.id_factura && (
              <> · <Link to={`/facturas/${ultimoPago.id_factura}`} className="font-medium text-primary underline">Ver factura</Link></>
            )}
            {ultimoPago.factura_url && (
              <> · <a href={ultimoPago.factura_url} target="_blank" rel="noreferrer" className="font-medium text-primary underline">Factura de Libélula</a></>
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
  const [tipoDocumento, setTipoDocumento] = useState<"CI" | "NIT">("CI")
  const [nit, setNit] = useState("")
  const [razon, setRazon] = useState(aviso.nombre_socio)
  const [enviando, setEnviando] = useState(false)
  const [qr, setQr] = useState<PagoQr | null>(null)

  const nombreMetodo = metodos.datos?.find((m) => String(m.id_metodo_pago) === metodo)?.metodo
  const esEfectivo = nombreMetodo === "Efectivo"
  const esQr = nombreMetodo === "QR"
  const vuelto = Number(recibido) - aviso.total_aviso
  const d = detalle.datos

  // Con QR, el cobro se registra cuando Libélula confirma el pago: se consulta cada 5 s
  const avisarPago = useRef(alPagar)
  useEffect(() => {
    avisarPago.current = alPagar
  })
  useEffect(() => {
    if (qr?.estado !== "PENDIENTE") return
    const id = qr.id_pago
    const temporizador = window.setInterval(async () => {
      try {
        const actual = await api<PagoQr>(`/pagos/qr/${id}`)
        if (actual.estado === "APROBADO") {
          toast.success("Pago con QR confirmado por Libélula")
          avisarPago.current({
            id_pago: actual.id_pago, monto_pagado: actual.monto, vuelto: 0, aviso_id_aviso: actual.id_aviso,
            id_factura: null, factura_url: actual.factura_url,
          } as Pago)
        } else if (actual.estado === "EXPIRADO") {
          setQr(actual)
        }
      } catch {
        // Si falla una consulta se reintenta en la siguiente vuelta
      }
    }, 5000)
    return () => window.clearInterval(temporizador)
  }, [qr])

  async function cobrar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    const factura = {
      con_factura: conFactura,
      nit_ci: conFactura ? nit : null,
      razon_social: conFactura ? razon : null,
    }
    if (esQr) {
      // Libélula genera el QR (y la factura, si se pide) para que el socio pague en ventanilla
      const nuevo = await enviar<PagoQr>("/pagos/qr", {
        aviso_id_aviso: aviso.id_aviso, tipo_documento: tipoDocumento, ...factura,
      }, "QR generado: pida al socio que lo escanee")
      setEnviando(false)
      if (nuevo) setQr(nuevo)
      return
    }
    const pago = await enviar<Pago>("/pagos", {
      aviso_id_aviso: aviso.id_aviso,
      metodo_pago_id_metodo_pago: Number(metodo),
      monto_recibido: esEfectivo ? Number(recibido) : null,
      ...factura,
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

        {qr?.estado === "PENDIENTE" ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">
              Pida al socio que escanee el QR con la app de su banco. El cobro se registra solo al confirmarse.
            </p>
            {qr.qr_url && (
              <img src={qr.qr_url} alt="Código QR de Libélula para pagar el aviso"
                className="aspect-square w-full max-w-[320px] rounded-lg border bg-white p-2" />
            )}
            <p className="text-lg">Total: <b>{bs(qr.monto)}</b></p>
            {qr.codigo_recaudacion && (
              <p className="text-sm">Código de recaudación: <b className="font-mono">{qr.codigo_recaudacion}</b></p>
            )}
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" /> Esperando la confirmación del pago...
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {qr.url_pasarela && (
                <a href={qr.url_pasarela} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Pasarela de Libélula <ExternalLinkIcon />
                </a>
              )}
              <Button variant="ghost" size="sm" onClick={() => setQr(null)}>Generar otro QR</Button>
            </div>
          </div>
        ) : (
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

            {qr?.estado === "EXPIRADO" && <p className="text-sm text-amber-700 dark:text-amber-400">El QR venció. Genere uno nuevo.</p>}

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
            {esQr && (
              <p className="rounded-lg bg-sky-50 p-2.5 text-xs text-sky-900 dark:bg-sky-950 dark:text-sky-200">
                Se genera un QR de Libélula para que el socio pague desde su banco. Si pide factura, la emite Libélula.
              </p>
            )}

            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={conFactura} onChange={(e) => setConFactura(e.target.checked)} />
              ¿Desea factura?
            </label>
            {conFactura && (
              <div className={esQr ? "grid grid-cols-[auto_1fr_2fr] gap-3" : "grid grid-cols-[1fr_2fr] gap-3"}>
                {esQr && (
                  <Campo etiqueta="Documento">
                    <Seleccion value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value as "CI" | "NIT")}>
                      <option value="CI">CI</option>
                      <option value="NIT">NIT</option>
                    </Seleccion>
                  </Campo>
                )}
                <Campo etiqueta={esQr ? tipoDocumento : "NIT / CI"}>
                  <Input value={nit} onChange={(e) => setNit(e.target.value)} pattern="[0-9A-Za-z\-]{3,20}" required />
                </Campo>
                <Campo etiqueta="Razón social">
                  <Input value={razon} onChange={(e) => setRazon(e.target.value)} minLength={2} required />
                </Campo>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={enviando || !d}>
                {esQr && <QrCodeIcon />}
                {enviando
                  ? (esQr ? "Generando QR..." : "Registrando...")
                  : esQr ? `Generar QR de ${bs(aviso.total_aviso)}` : `Cobrar ${bs(aviso.total_aviso)}`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
