import { useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { PlusIcon, SearchIcon } from "lucide-react"

import { Campo, Encabezado, Estado, EstadoCarga, Panel, Seleccion } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CATEGORIAS, DIMENSIONES, TIPOS_INSTALACION } from "@/lib/catalogos"
import { consulta, enviar, useDatos } from "@/lib/datos"
import type { Medidor, Persona, RolSocio, Ruta, Socio } from "@/lib/tipos"

const VACIO = {
  persona_id_persona: "", codigo_fijo: "", rol_socio_id_rol_socio: "1", ruta_id_ruta: "",
  medidor_id_medidor: "", actividad: "Vivienda", categoria: "Doméstico", correo: "",
  ubicacion: "", num_casa: "", num_ocupantes: "", tipo_instalacion: "", dim_instalacion: "",
  generar_credito: true,
}

const numeroONulo = (valor: string) => (valor === "" ? null : Number(valor))

export default function Socios() {
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const [busqueda, setBusqueda] = useState("")
  const [filtros, setFiltros] = useState({ q: "", id_ruta: parametros.get("ruta") ?? "" })
  const socios = useDatos<Socio[]>(`/socios${consulta(filtros)}`)
  const rutas = useDatos<Ruta[]>("/rutas")
  const [abierto, setAbierto] = useState(false)

  const ruta = (id: number) => rutas.datos?.find((r) => r.id_ruta === id)?.ruta ?? "—"

  return (
    <>
      <Encabezado titulo="Socios" descripcion="Conexiones de agua: código fijo, ruta, medidor y categoría (HU11).">
        <Button onClick={() => setAbierto(true)}><PlusIcon /> Nuevo socio</Button>
      </Encabezado>

      <div className="mb-4 flex flex-wrap gap-2">
        <form onSubmit={(e) => { e.preventDefault(); setFiltros({ ...filtros, q: busqueda }) }} className="flex gap-2">
          <Input className="w-72" placeholder="Código fijo, nombre o CI" value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)} />
          <Button type="submit" variant="outline"><SearchIcon /> Buscar</Button>
        </form>
        <Seleccion className="w-44" value={filtros.id_ruta} onChange={(e) => setFiltros({ ...filtros, id_ruta: e.target.value })}>
          <option value="">Todas las rutas</option>
          {rutas.datos?.map((r) => <option key={r.id_ruta} value={r.id_ruta}>Ruta {r.ruta}</option>)}
        </Seleccion>
      </div>

      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código fijo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Ruta</TableHead>
              <TableHead>Medidor</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {socios.datos?.map((s) => (
              <TableRow key={s.id_socio} className="cursor-pointer" onClick={() => navegar(`/socios/${s.id_socio}`)}>
                <TableCell className="font-mono">{s.codigo_fijo}</TableCell>
                <TableCell className="font-medium text-primary">{s.nombre_socio}</TableCell>
                <TableCell>{s.rol_socio_id_rol_socio === 1 ? "Socio" : "Usuario"} · {s.categoria}</TableCell>
                <TableCell>{ruta(s.ruta_id_ruta)}</TableCell>
                <TableCell>{s.medidor_id_medidor ? "Asignado" : <span className="text-muted-foreground">Sin medidor</span>}</TableCell>
                <TableCell><Estado valor={s.estado ? "ACTIVO" : "INACTIVO"} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EstadoCarga cargando={socios.cargando} error={socios.error} vacio={socios.datos?.length === 0} />
      </Panel>

      {abierto && (
        <NuevoSocio
          rutas={rutas.datos ?? []}
          alCerrar={() => setAbierto(false)}
          alGuardar={(socio) => navegar(`/socios/${socio.id_socio}`)}
        />
      )}
    </>
  )
}

function NuevoSocio({
  rutas,
  alCerrar,
  alGuardar,
}: {
  rutas: Ruta[]
  alCerrar: () => void
  alGuardar: (socio: Socio) => void
}) {
  const personas = useDatos<Persona[]>("/personas")
  const medidores = useDatos<Medidor[]>("/medidores")
  const socios = useDatos<Socio[]>("/socios")
  const categorias = useDatos<RolSocio[]>("/roles-socio")
  const [form, setForm] = useState({ ...VACIO, ruta_id_ruta: rutas[0] ? String(rutas[0].id_ruta) : "" })

  // Solo se ofrecen los medidores que no tiene otro socio activo
  const ocupados = new Set(socios.datos?.filter((s) => s.estado).map((s) => s.medidor_id_medidor))
  const libres = medidores.datos?.filter((m) => !ocupados.has(m.id_medidor)) ?? []
  const cambiar = (campo: keyof typeof VACIO) => (e: { target: { value: string } }) =>
    setForm({ ...form, [campo]: e.target.value })

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    const socio = await enviar<Socio>("/socios", {
      persona_id_persona: Number(form.persona_id_persona),
      codigo_fijo: Number(form.codigo_fijo),
      rol_socio_id_rol_socio: Number(form.rol_socio_id_rol_socio),
      ruta_id_ruta: Number(form.ruta_id_ruta),
      medidor_id_medidor: numeroONulo(form.medidor_id_medidor),
      actividad: form.actividad,
      categoria: form.categoria,
      correo: form.correo,
      ubicacion: numeroONulo(form.ubicacion),
      num_casa: numeroONulo(form.num_casa),
      num_ocupantes: numeroONulo(form.num_ocupantes),
      tipo_instalacion: form.tipo_instalacion || null,
      dim_instalacion: form.dim_instalacion || null,
      generar_credito: form.generar_credito,
    }, "Socio registrado")
    if (socio) alGuardar(socio)
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Nuevo socio</DialogTitle></DialogHeader>
        <form onSubmit={guardar} className="grid gap-3">
          <Campo etiqueta="Titular (persona)" ayuda="Si no está en la lista, regístrela primero en Personas">
            <Seleccion value={form.persona_id_persona} onChange={cambiar("persona_id_persona")} required>
              <option value="">Seleccione...</option>
              {personas.datos?.filter((p) => p.estado).map((p) => (
                <option key={p.id_persona} value={p.id_persona}>{p.nombre_completo} (CI {p.ci})</option>
              ))}
            </Seleccion>
          </Campo>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo etiqueta="Código fijo">
              <Input type="number" min="1" value={form.codigo_fijo} onChange={cambiar("codigo_fijo")} required />
            </Campo>
            <Campo etiqueta="Categoría de tarifa">
              <Seleccion value={form.rol_socio_id_rol_socio} onChange={cambiar("rol_socio_id_rol_socio")}>
                {categorias.datos?.map((c) => <option key={c.id_rol_socio} value={c.id_rol_socio}>{c.rol_socio}</option>)}
              </Seleccion>
            </Campo>
            <Campo etiqueta="Uso">
              <Seleccion value={form.categoria} onChange={cambiar("categoria")}>
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </Seleccion>
            </Campo>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo etiqueta="Ruta">
              <Seleccion value={form.ruta_id_ruta} onChange={cambiar("ruta_id_ruta")} required>
                {rutas.map((r) => <option key={r.id_ruta} value={r.id_ruta}>Ruta {r.ruta} - {r.descripcion}</option>)}
              </Seleccion>
            </Campo>
            <Campo etiqueta="Medidor">
              <Seleccion value={form.medidor_id_medidor} onChange={cambiar("medidor_id_medidor")}>
                <option value="">Sin medidor por ahora</option>
                {libres.map((m) => <option key={m.id_medidor} value={m.id_medidor}>{m.serie}</option>)}
              </Seleccion>
            </Campo>
            <Campo etiqueta="Actividad">
              <Input value={form.actividad} onChange={cambiar("actividad")} required />
            </Campo>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Campo etiqueta="Ubicación"><Input type="number" min="0" value={form.ubicacion} onChange={cambiar("ubicacion")} /></Campo>
            <Campo etiqueta="N° de casa"><Input type="number" min="0" value={form.num_casa} onChange={cambiar("num_casa")} /></Campo>
            <Campo etiqueta="Ocupantes"><Input type="number" min="0" max="50" value={form.num_ocupantes} onChange={cambiar("num_ocupantes")} /></Campo>
            <Campo etiqueta="Correo"><Input type="email" value={form.correo} onChange={cambiar("correo")} required /></Campo>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Tipo de instalación">
              <Seleccion value={form.tipo_instalacion} onChange={cambiar("tipo_instalacion")}>
                <option value="">—</option>
                {TIPOS_INSTALACION.map((t) => <option key={t}>{t}</option>)}
              </Seleccion>
            </Campo>
            <Campo etiqueta="Diámetro">
              <Seleccion value={form.dim_instalacion} onChange={cambiar("dim_instalacion")}>
                <option value="">—</option>
                {DIMENSIONES.map((d) => <option key={d}>{d}</option>)}
              </Seleccion>
            </Campo>
          </div>
          {form.rol_socio_id_rol_socio === "1" && (
            <label className="flex items-center gap-2 rounded-lg bg-muted p-2.5 text-sm">
              <input type="checkbox" checked={form.generar_credito}
                onChange={(e) => setForm({ ...form, generar_credito: e.target.checked })} />
              Generar el crédito de inscripción: 1.700 Bs en 4 cuotas de 425 Bs (este mes y los 3 siguientes)
            </label>
          )}
          <DialogFooter><Button type="submit">Registrar socio</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
