import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

import { Campo, Encabezado, EstadoCarga, Panel } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { enviar, useDatos } from "@/lib/datos"
import type { Ruta, Socio } from "@/lib/tipos"

export default function Rutas() {
  const rutas = useDatos<Ruta[]>("/rutas")
  const socios = useDatos<Socio[]>("/socios")
  const [form, setForm] = useState({ ruta: "", descripcion: "" })

  const cantidad = (id: number) => socios.datos?.filter((s) => s.ruta_id_ruta === id && s.estado).length ?? 0

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    const ok = await enviar("/rutas", { ruta: Number(form.ruta), descripcion: form.descripcion || null }, "Ruta registrada")
    if (ok) {
      setForm({ ruta: "", descripcion: "" })
      rutas.recargar()
    }
  }

  return (
    <>
      <Encabezado
        titulo="Rutas de lecturación"
        descripcion="Zonas para organizar el recorrido del plomero (HU17). Los socios se reasignan desde su ficha."
      />
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <Panel>
          <form onSubmit={guardar} className="grid gap-3">
            <Campo etiqueta="Número de ruta">
              <Input type="number" min="1" value={form.ruta} onChange={(e) => setForm({ ...form, ruta: e.target.value })} required />
            </Campo>
            <Campo etiqueta="Descripción" ayuda="Barrio o calles que cubre">
              <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </Campo>
            <Button type="submit">Registrar ruta</Button>
          </form>
        </Panel>
        <Panel>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Ruta</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Socios activos</TableHead><TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {rutas.datos?.map((r) => (
                <TableRow key={r.id_ruta}>
                  <TableCell className="font-medium">{r.ruta}</TableCell>
                  <TableCell>{r.descripcion}</TableCell>
                  <TableCell className="text-right">{cantidad(r.id_ruta)}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/socios?ruta=${r.id_ruta}`} className="text-sm text-primary underline">Ver socios</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <EstadoCarga cargando={rutas.cargando} error={rutas.error} vacio={rutas.datos?.length === 0} />
        </Panel>
      </div>
    </>
  )
}
