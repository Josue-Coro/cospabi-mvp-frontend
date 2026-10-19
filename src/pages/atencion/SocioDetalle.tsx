import { useState, type FormEvent, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { PencilIcon } from "lucide-react"

import { Campo, Encabezado, Estado, EstadoCarga, Panel, Seleccion } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CATEGORIAS } from "@/lib/catalogos"
import { enviar, useDatos } from "@/lib/datos"
import { bs, fecha, fechaHora, horaDesbloqueo } from "@/lib/formato"
import type { Aviso, CuentaSocio, Cuota, Medidor, Persona, Ruta, Socio } from "@/lib/tipos"

export default function SocioDetalle() {
  const { id } = useParams()
  const socio = useDatos<Socio>(`/socios/${id}`)
  const rutas = useDatos<Ruta[]>("/rutas")
  const medidores = useDatos<Medidor[]>("/medidores")
  const s = socio.datos

  if (!s) return <EstadoCarga cargando={socio.cargando} error={socio.error} />

  const ruta = rutas.datos?.find((r) => r.id_ruta === s.ruta_id_ruta)
  const medidor = medidores.datos?.find((m) => m.id_medidor === s.medidor_id_medidor)

  return (
    <>
      <Encabezado titulo={`${s.codigo_fijo} · ${s.nombre_socio}`} descripcion="Ficha del socio">
        <Estado valor={s.estado ? "ACTIVO" : "INACTIVO"} />
        <EditarSocio socio={s} rutas={rutas.datos ?? []} medidores={medidores.datos ?? []} alGuardar={socio.recargar} />
        {s.estado && <DarBaja socio={s} alGuardar={socio.recargar} />}
      </Encabezado>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-3 font-semibold">Datos de la conexión</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Dato nombre="Titular"><Titular id={s.persona_id_persona} /></Dato>
            <Dato nombre="Categoría">{s.rol_socio_id_rol_socio === 1 ? "Socio" : "Usuario"} · {s.categoria}</Dato>
            <Dato nombre="Ruta">{ruta ? `Ruta ${ruta.ruta} - ${ruta.descripcion ?? ""}` : "—"}</Dato>
            <Dato nombre="Medidor">{medidor?.serie ?? "Sin medidor"}</Dato>
            <Dato nombre="Ubicación / casa">{s.ubicacion ?? "—"} / {s.num_casa ?? "—"}</Dato>
            <Dato nombre="Actividad">{s.actividad}</Dato>
            <Dato nombre="Correo">{s.correo}</Dato>
            <Dato nombre="Registro">{fecha(s.fecha_registro)}</Dato>
            {!s.estado && <Dato nombre="Baja">{fecha(s.fecha_baja)}: {s.motivo_baja}</Dato>}
          </dl>
        </Panel>
        <CuentaPortal socio={s} />
        <CreditoInscripcion socio={s} />
        <AvisosDelSocio socio={s} />
      </div>
    </>
  )
}

function Dato({ nombre, children }: { nombre: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{nombre}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function Titular({ id }: { id: number }) {
  const persona = useDatos<Persona>(`/personas/${id}`)
  return <>{persona.datos ? `${persona.datos.nombre_completo} (CI ${persona.datos.ci})` : "..."}</>
}

function EditarSocio({
  socio, rutas, medidores, alGuardar,
}: { socio: Socio; rutas: Ruta[]; medidores: Medidor[]; alGuardar: () => void }) {
  const [abierto, setAbierto] = useState(false)
  const [form, setForm] = useState({
    ruta_id_ruta: String(socio.ruta_id_ruta),
    medidor_id_medidor: socio.medidor_id_medidor ? String(socio.medidor_id_medidor) : "",
    rol_socio_id_rol_socio: String(socio.rol_socio_id_rol_socio),
    categoria: socio.categoria,
    correo: socio.correo,
    ubicacion: socio.ubicacion === null ? "" : String(socio.ubicacion),
    num_casa: socio.num_casa === null ? "" : String(socio.num_casa),
  })

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    const ok = await enviar(`/socios/${socio.id_socio}`, {
      ruta_id_ruta: Number(form.ruta_id_ruta),
      medidor_id_medidor: form.medidor_id_medidor ? Number(form.medidor_id_medidor) : null,
      rol_socio_id_rol_socio: Number(form.rol_socio_id_rol_socio),
      categoria: form.categoria,
      correo: form.correo,
      ubicacion: form.ubicacion === "" ? null : Number(form.ubicacion),
      num_casa: form.num_casa === "" ? null : Number(form.num_casa),
    }, "Datos del socio actualizados", "PUT")
    if (ok) {
      setAbierto(false)
      alGuardar()
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setAbierto(true)}><PencilIcon /> Editar</Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar socio {socio.codigo_fijo}</DialogTitle></DialogHeader>
          <form onSubmit={guardar} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Ruta" ayuda="Reasignar a otra ruta">
                <Seleccion value={form.ruta_id_ruta} onChange={(e) => setForm({ ...form, ruta_id_ruta: e.target.value })}>
                  {rutas.map((r) => <option key={r.id_ruta} value={r.id_ruta}>Ruta {r.ruta}</option>)}
                </Seleccion>
              </Campo>
              <Campo etiqueta="Medidor">
                <Seleccion value={form.medidor_id_medidor} onChange={(e) => setForm({ ...form, medidor_id_medidor: e.target.value })}>
                  <option value="">Sin medidor</option>
                  {medidores.map((m) => <option key={m.id_medidor} value={m.id_medidor}>{m.serie}</option>)}
                </Seleccion>
              </Campo>
              <Campo etiqueta="Categoría de tarifa">
                <Seleccion value={form.rol_socio_id_rol_socio} onChange={(e) => setForm({ ...form, rol_socio_id_rol_socio: e.target.value })}>
                  <option value="1">Socio</option>
                  <option value="2">Usuario</option>
                </Seleccion>
              </Campo>
              <Campo etiqueta="Uso">
                <Seleccion value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </Seleccion>
              </Campo>
              <Campo etiqueta="Ubicación">
                <Input type="number" min="0" value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
              </Campo>
              <Campo etiqueta="N° de casa">
                <Input type="number" min="0" value={form.num_casa} onChange={(e) => setForm({ ...form, num_casa: e.target.value })} />
              </Campo>
            </div>
            <Campo etiqueta="Correo">
              <Input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} required />
            </Campo>
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DarBaja({ socio, alGuardar }: { socio: Socio; alGuardar: () => void }) {
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState("")

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (await enviar(`/socios/${socio.id_socio}/baja`, { motivo_baja: motivo }, "Socio dado de baja")) {
      setAbierto(false)
      alGuardar()
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setAbierto(true)}>Dar de baja</Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dar de baja al socio {socio.codigo_fijo}</DialogTitle></DialogHeader>
          <form onSubmit={guardar} className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Se conserva toda su información, pero deja de generar avisos y de aparecer en las rutas.
            </p>
            <Campo etiqueta="Motivo">
              <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} minLength={3} required />
            </Campo>
            <DialogFooter><Button type="submit" variant="destructive">Confirmar baja</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CuentaPortal({ socio }: { socio: Socio }) {
  // 404 = el socio todavía no tiene cuenta en el portal
  const cuenta = useDatos<CuentaSocio>(`/socios/${socio.id_socio}/cuenta`)
  const [clave, setClave] = useState("")
  const existe = !cuenta.error && cuenta.datos

  async function guardarClave(evento: FormEvent) {
    evento.preventDefault()
    const mensaje = existe ? "Contraseña del portal restablecida" : "Cuenta del portal creada"
    if (await enviar(`/socios/${socio.id_socio}/cuenta`, { contrasena: clave }, mensaje)) {
      setClave("")
      cuenta.recargar()
    }
  }

  async function cambiarEstado(estado: boolean) {
    const mensaje = estado ? "Cuenta habilitada" : "Cuenta bloqueada"
    if (await enviar(`/socios/${socio.id_socio}/cuenta`, { estado }, mensaje, "PUT")) cuenta.recargar()
  }

  return (
    <Panel>
      <h2 className="mb-1 font-semibold">Cuenta del portal del socio</h2>
      {cuenta.cargando ? (
        <EstadoCarga cargando error="" />
      ) : existe ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <span>Usuario: <b className="font-mono">{cuenta.datos!.usuario}</b></span>
          <Estado valor={cuenta.datos!.estado ? "ACTIVO" : "INACTIVO"} />
          {horaDesbloqueo(cuenta.datos!.bloqueado_hasta) && (
            <span title="Por intentos fallidos. Restablecer la contraseña lo desbloquea.">
              <Estado valor="BLOQUEADO" />
              <span className="ml-1 text-xs text-muted-foreground">hasta {horaDesbloqueo(cuenta.datos!.bloqueado_hasta)}</span>
            </span>
          )}
          <span className="text-muted-foreground">Último acceso: {fechaHora(cuenta.datos!.ultimo_acceso)}</span>
          <Button size="sm" variant="outline" onClick={() => cambiarEstado(!cuenta.datos!.estado)}>
            {cuenta.datos!.estado ? "Bloquear" : "Habilitar"}
          </Button>
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted-foreground">
          Todavía no tiene cuenta. El usuario será su código fijo ({socio.codigo_fijo}).
        </p>
      )}
      <form onSubmit={guardarClave} className="flex gap-2">
        <Input type="password" placeholder={existe ? "Nueva contraseña temporal" : "Contraseña temporal"}
          value={clave} onChange={(e) => setClave(e.target.value)} minLength={6} required />
        <Button type="submit">{existe ? "Restablecer" : "Crear cuenta"}</Button>
      </form>
    </Panel>
  )
}

function CreditoInscripcion({ socio }: { socio: Socio }) {
  const cuotas = useDatos<Cuota[]>(`/socios/${socio.id_socio}/credito`)
  const pagado = cuotas.datos?.filter((c) => c.estado === "PAGADA").reduce((t, c) => t + c.monto_pago, 0) ?? 0

  async function generar() {
    if (await enviar(`/socios/${socio.id_socio}/credito`, undefined, "Crédito de inscripción generado")) cuotas.recargar()
  }

  return (
    <Panel>
      <h2 className="mb-1 font-semibold">Crédito de inscripción (HU12)</h2>
      {cuotas.datos?.length ? (
        <>
          <p className="mb-2 text-sm text-muted-foreground">
            Pagado {bs(pagado)} de {bs(1700)} · saldo {bs(1700 - pagado)}. Cada cuota se cobra en el aviso de su periodo.
          </p>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Cuota</TableHead><TableHead>Periodo</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Estado</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {cuotas.datos.map((c) => (
                <TableRow key={c.id_credito}>
                  <TableCell>{c.num_cuota} de 4</TableCell>
                  <TableCell>{c.periodo}</TableCell>
                  <TableCell className="text-right">{bs(c.monto_pago)}</TableCell>
                  <TableCell><Estado valor={c.estado} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : socio.rol_socio_id_rol_socio === 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">No tiene crédito de inscripción registrado.</p>
          <Button size="sm" variant="outline" onClick={generar}>Generar 4 cuotas</Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Es Usuario (no afiliado): no paga inscripción.</p>
      )}
      <EstadoCarga cargando={cuotas.cargando} error={cuotas.error} />
    </Panel>
  )
}

function AvisosDelSocio({ socio }: { socio: Socio }) {
  const avisos = useDatos<Aviso[]>(`/avisos?codigo_fijo=${socio.codigo_fijo}`)
  return (
    <Panel>
      <h2 className="mb-2 font-semibold">Avisos de cobranza</h2>
      <Table>
        <TableHeader>
          <TableRow><TableHead>N°</TableHead><TableHead>Periodo</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {avisos.datos?.map((a) => (
            <TableRow key={a.id_aviso}>
              <TableCell><Link className="text-primary underline" to={`/avisos/${a.id_aviso}`}>{a.id_aviso}</Link></TableCell>
              <TableCell>{a.periodo}</TableCell>
              <TableCell className="text-right">{bs(a.total_aviso)}</TableCell>
              <TableCell><Estado valor={a.estado} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <EstadoCarga cargando={avisos.cargando} error={avisos.error} vacio={avisos.datos?.length === 0} />
    </Panel>
  )
}
