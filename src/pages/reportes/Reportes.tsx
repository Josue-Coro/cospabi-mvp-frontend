import { useState, type ReactNode } from "react"
import { cn } from "cn"

import { BotonImprimir, Campo, Encabezado, EstadoCarga, Panel, Seleccion } from "@/components/comunes"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSesion } from "@/lib/auth"
import { consulta, useDatos } from "@/lib/datos"
import { bs, fecha, fechaHora, hoyISO, primerDiaMesISO } from "@/lib/formato"
import type { FilaPagoReporte, Ruta, UsuarioDetalle } from "@/lib/tipos"

/** Encabezado común de los reportes: título, filtros y botón de imprimir. */
function Reporte({
  titulo, descripcion, filtros, children,
}: { titulo: string; descripcion: string; filtros: ReactNode; children: ReactNode }) {
  return (
    <>
      <Encabezado titulo={titulo} descripcion={descripcion}><BotonImprimir /></Encabezado>
      <p className="mb-2 hidden text-sm print:block">
        COOPERATIVA DE AGUA POTABLE COSPABI R.L. · generado el {fecha(hoyISO())}
      </p>
      <Panel className="mb-4 print:hidden"><div className="grid gap-3 sm:grid-cols-4">{filtros}</div></Panel>
      {children}
    </>
  )
}

function RangoFechas({ valor, cambiar }: { valor: { desde: string; hasta: string }; cambiar: (v: { desde: string; hasta: string }) => void }) {
  return (
    <>
      <Campo etiqueta="Desde"><Input type="date" value={valor.desde} onChange={(e) => cambiar({ ...valor, desde: e.target.value })} /></Campo>
      <Campo etiqueta="Hasta"><Input type="date" value={valor.hasta} onChange={(e) => cambiar({ ...valor, hasta: e.target.value })} /></Campo>
    </>
  )
}

function TablaPagos({ pagos, conTransaccion }: { pagos: FilaPagoReporte[]; conTransaccion?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Aviso</TableHead>
          <TableHead>Socio</TableHead>
          <TableHead>Periodo</TableHead>
          <TableHead>Método</TableHead>
          {conTransaccion ? <TableHead>Transacción</TableHead> : <TableHead>Cajero</TableHead>}
          <TableHead>Factura</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagos.map((p) => (
          <TableRow key={p.id_pago}>
            <TableCell>{fechaHora(p.fecha_pago)}</TableCell>
            <TableCell>{p.id_aviso}</TableCell>
            <TableCell>{p.codigo_fijo} · {p.nombre_socio}</TableCell>
            <TableCell>{p.periodo}</TableCell>
            <TableCell>{p.metodo}</TableCell>
            <TableCell className="font-mono text-xs">{conTransaccion ? p.id_transaccion : p.cajero}</TableCell>
            <TableCell>
              {p.factura_url ? (
                <a href={p.factura_url} target="_blank" rel="noreferrer" className="text-primary underline">Libélula</a>
              ) : (p.numero_factura ?? "—")}
            </TableCell>
            <TableCell className="text-right">{bs(p.monto)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

type ReportePagos = { pagos: FilaPagoReporte[]; total: number; cantidad: number }

export function ReporteCaja() {
  const { usuario } = useSesion()
  const esAdmin = usuario?.rol === "Administrador"
  const [rango, setRango] = useState({ desde: primerDiaMesISO(), hasta: hoyISO() })
  const [idUsuario, setIdUsuario] = useState("")
  const usuarios = useDatos<UsuarioDetalle[]>(esAdmin ? "/usuarios" : null)
  const reporte = useDatos<ReportePagos & { total_por_metodo: Record<string, number> }>(
    `/reportes/caja${consulta({ ...rango, id_usuario: idUsuario })}`,
  )
  const r = reporte.datos

  return (
    <Reporte
      titulo="Reporte de caja"
      descripcion="Cobros en ventanilla del periodo, por cajero y por método de pago (HU21)."
      filtros={
        <>
          <RangoFechas valor={rango} cambiar={setRango} />
          {esAdmin && (
            <Campo etiqueta="Cajero">
              <Seleccion value={idUsuario} onChange={(e) => setIdUsuario(e.target.value)}>
                <option value="">Todos</option>
                {usuarios.datos?.filter((u) => u.rol.nombre !== "Plomero").map((u) => (
                  <option key={u.id_usuario_admin} value={u.id_usuario_admin}>{u.nombre} {u.apellido}</option>
                ))}
              </Seleccion>
            </Campo>
          )}
        </>
      }
    >
      {r && (
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Total titulo="Total recaudado" valor={bs(r.total)} />
          {Object.entries(r.total_por_metodo).map(([metodo, monto]) => <Total key={metodo} titulo={metodo} valor={bs(monto)} />)}
        </div>
      )}
      <Panel>
        {r && <TablaPagos pagos={r.pagos} />}
        <EstadoCarga cargando={reporte.cargando} error={reporte.error} vacio={r?.cantidad === 0} textoVacio="No hay cobros en ese rango." />
      </Panel>
    </Reporte>
  )
}

export function ReportePortal() {
  const [rango, setRango] = useState({ desde: primerDiaMesISO(), hasta: hoyISO() })
  const reporte = useDatos<ReportePagos>(`/reportes/pagos-portal${consulta(rango)}`)
  const r = reporte.datos

  return (
    <Reporte
      titulo="Pagos del portal"
      descripcion="Pagos hechos por los socios desde el portal con QR, sin pasar por caja (HU23)."
      filtros={<RangoFechas valor={rango} cambiar={setRango} />}
    >
      {r && <div className="mb-4 grid gap-3 sm:grid-cols-4"><Total titulo="Total del portal" valor={bs(r.total)} /><Total titulo="Pagos" valor={String(r.cantidad)} /></div>}
      <Panel>
        {r && <TablaPagos pagos={r.pagos} conTransaccion />}
        <EstadoCarga cargando={reporte.cargando} error={reporte.error} vacio={r?.cantidad === 0} textoVacio="No hay pagos del portal en ese rango." />
      </Panel>
    </Reporte>
  )
}

type FilaMorosidad = {
  id_socio: number; codigo_fijo: number; nombre_socio: string; ruta: number
  periodos: string[]; monto_adeudado: number; dias_mora: number; meses_adeudados: number
}

export function ReporteMorosidad() {
  const rutas = useDatos<Ruta[]>("/rutas")
  const [idRuta, setIdRuta] = useState("")
  const reporte = useDatos<{ socios: FilaMorosidad[]; total_adeudado: number; cantidad_socios: number }>(
    `/reportes/morosidad${consulta({ id_ruta: idRuta })}`,
  )
  const r = reporte.datos

  return (
    <Reporte
      titulo="Reporte de morosidad"
      descripcion="Socios con avisos vencidos, monto adeudado y días de mora (HU22)."
      filtros={
        <Campo etiqueta="Ruta">
          <Seleccion value={idRuta} onChange={(e) => setIdRuta(e.target.value)}>
            <option value="">Todas</option>
            {rutas.datos?.map((ruta) => <option key={ruta.id_ruta} value={ruta.id_ruta}>Ruta {ruta.ruta}</option>)}
          </Seleccion>
        </Campo>
      }
    >
      {r && <div className="mb-4 grid gap-3 sm:grid-cols-4"><Total titulo="Total adeudado" valor={bs(r.total_adeudado)} /><Total titulo="Socios en mora" valor={String(r.cantidad_socios)} /></div>}
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código fijo</TableHead>
              <TableHead>Socio</TableHead>
              <TableHead>Ruta</TableHead>
              <TableHead>Periodos vencidos</TableHead>
              <TableHead className="text-right">Días de mora</TableHead>
              <TableHead className="text-right">Adeudado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r?.socios.map((s) => (
              <TableRow key={s.id_socio}>
                <TableCell>{s.codigo_fijo}</TableCell>
                <TableCell>{s.nombre_socio}</TableCell>
                <TableCell>{s.ruta}</TableCell>
                <TableCell>{s.periodos.join(", ")} ({s.meses_adeudados})</TableCell>
                <TableCell className="text-right">{s.dias_mora}</TableCell>
                <TableCell className="text-right font-medium">{bs(s.monto_adeudado)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EstadoCarga cargando={reporte.cargando} error={reporte.error} vacio={r?.cantidad_socios === 0} textoVacio="No hay socios en mora." />
      </Panel>
    </Reporte>
  )
}

type FilaInscripcion = {
  id_socio: number; codigo_fijo: number; nombre_socio: string; monto_credito: number
  cuotas: { num_cuota: number; periodo: string; monto: number; estado: string; fecha_pago: string | null }[]
  pagado: number; saldo_pendiente: number; completo: boolean
}

export function ReporteInscripcion() {
  const [soloPendientes, setSoloPendientes] = useState(false)
  const reporte = useDatos<{ socios: FilaInscripcion[]; completos: number; con_cuotas_pendientes: number }>(
    `/reportes/inscripcion${consulta({ solo_pendientes: soloPendientes || null })}`,
  )
  const r = reporte.datos

  return (
    <Reporte
      titulo="Pagos de inscripción"
      descripcion="Cuotas del crédito de inscripción (1.700 Bs en 4 cuotas) pagadas y pendientes por socio (HU24)."
      filtros={
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} />
          Solo socios con cuotas pendientes
        </label>
      }
    >
      {r && <div className="mb-4 grid gap-3 sm:grid-cols-4"><Total titulo="Créditos completos" valor={String(r.completos)} /><Total titulo="Con cuotas pendientes" valor={String(r.con_cuotas_pendientes)} /></div>}
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código fijo</TableHead>
              <TableHead>Socio</TableHead>
              <TableHead>Cuotas</TableHead>
              <TableHead className="text-right">Pagado</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r?.socios.map((s) => (
              <TableRow key={s.id_socio}>
                <TableCell>{s.codigo_fijo}</TableCell>
                <TableCell>{s.nombre_socio}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {s.cuotas.map((c) => (
                      <span
                        key={c.num_cuota}
                        title={c.fecha_pago ? `Pagada el ${fechaHora(c.fecha_pago)}` : "Pendiente"}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs",
                          c.estado === "PAGADA"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                        )}
                      >
                        {c.num_cuota}ª {c.periodo} · {c.estado === "PAGADA" ? "pagada" : "pendiente"}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">{bs(s.pagado)}</TableCell>
                <TableCell className="text-right font-medium">{bs(s.saldo_pendiente)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EstadoCarga cargando={reporte.cargando} error={reporte.error} vacio={r?.socios.length === 0} textoVacio="No hay créditos de inscripción." />
      </Panel>
    </Reporte>
  )
}

function Total({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Panel className="print:border print:p-2">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="text-xl font-semibold">{valor}</p>
    </Panel>
  )
}
