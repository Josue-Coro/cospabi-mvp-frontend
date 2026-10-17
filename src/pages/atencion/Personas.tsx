import { useState, type FormEvent } from "react"
import { PencilIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Campo, Encabezado, Estado, EstadoCarga, Panel, Seleccion } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { consulta, enviar, useDatos } from "@/lib/datos"
import { fecha } from "@/lib/formato"
import type { Persona } from "@/lib/tipos"

const VACIO = { nombre_completo: "", ci: "", fecha_nacimiento: "", genero: "", telefono: "" }

export default function Personas() {
  const [busqueda, setBusqueda] = useState("")
  const [q, setQ] = useState("")
  const personas = useDatos<Persona[]>(`/personas${consulta({ q })}`)
  const [editando, setEditando] = useState<Persona | "nuevo" | null>(null)
  const [form, setForm] = useState(VACIO)

  function abrir(persona: Persona | "nuevo") {
    setEditando(persona)
    setForm(persona === "nuevo" ? VACIO : {
      nombre_completo: persona.nombre_completo, ci: persona.ci, fecha_nacimiento: persona.fecha_nacimiento,
      genero: persona.genero ?? "", telefono: persona.telefono ? String(persona.telefono) : "",
    })
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    const cuerpo = {
      nombre_completo: form.nombre_completo,
      fecha_nacimiento: form.fecha_nacimiento,
      genero: form.genero || null,
      telefono: form.telefono ? Number(form.telefono) : null,
    }
    const ok = editando === "nuevo"
      ? await enviar("/personas", { ...cuerpo, ci: form.ci }, "Persona registrada")
      : await enviar(`/personas/${(editando as Persona).id_persona}`, cuerpo, "Datos actualizados", "PUT")
    if (ok) {
      setEditando(null)
      personas.recargar()
    }
  }

  async function darBaja(persona: Persona) {
    if (!window.confirm(`¿Dar de baja a ${persona.nombre_completo}? No se borra, solo se desactiva.`)) return
    if (await enviar(`/personas/${persona.id_persona}`, undefined, "Persona dada de baja", "DELETE")) personas.recargar()
  }

  return (
    <>
      <Encabezado titulo="Personas" descripcion="Padrón de titulares del servicio (HU10). No se repite el CI.">
        <Button onClick={() => abrir("nuevo")}><PlusIcon /> Nueva persona</Button>
      </Encabezado>

      <form onSubmit={(e) => { e.preventDefault(); setQ(busqueda) }} className="mb-4 flex max-w-md gap-2">
        <Input placeholder="Buscar por nombre o CI" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <Button type="submit" variant="outline"><SearchIcon /> Buscar</Button>
      </form>

      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre completo</TableHead>
              <TableHead>CI</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Nacimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {personas.datos?.map((p) => (
              <TableRow key={p.id_persona}>
                <TableCell className="font-medium">{p.nombre_completo}</TableCell>
                <TableCell>{p.ci}</TableCell>
                <TableCell>{p.telefono ?? "—"}</TableCell>
                <TableCell>{fecha(p.fecha_nacimiento)}</TableCell>
                <TableCell><Estado valor={p.estado ? "ACTIVO" : "INACTIVO"} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => abrir(p)}><PencilIcon /> Editar</Button>
                  {p.estado && <Button variant="ghost" size="sm" onClick={() => darBaja(p)}>Dar de baja</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EstadoCarga cargando={personas.cargando} error={personas.error} vacio={personas.datos?.length === 0} />
      </Panel>

      <Dialog open={editando !== null} onOpenChange={(abierto) => !abierto && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando === "nuevo" ? "Nueva persona" : "Editar persona"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={guardar} className="grid gap-3">
            <Campo etiqueta="Nombre completo">
              <Input value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} minLength={3} required />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="CI" ayuda="Solo números">
                <Input value={form.ci} onChange={(e) => setForm({ ...form, ci: e.target.value })}
                  pattern="[0-9]{4,10}" disabled={editando !== "nuevo"} required />
              </Campo>
              <Campo etiqueta="Teléfono">
                <Input type="number" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  min="10000000" max="99999999" />
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Fecha de nacimiento">
                <Input type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} required />
              </Campo>
              <Campo etiqueta="Género">
                <Seleccion value={form.genero} onChange={(e) => setForm({ ...form, genero: e.target.value })}>
                  <option value="">Sin especificar</option>
                  <option>Masculino</option>
                  <option>Femenino</option>
                  <option>Otro</option>
                </Seleccion>
              </Campo>
            </div>
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
