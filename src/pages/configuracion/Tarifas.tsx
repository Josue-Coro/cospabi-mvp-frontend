import { useState, type FormEvent } from "react"
import { PencilIcon } from "lucide-react"

import { Campo, Encabezado, EstadoCarga, Panel } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSesion } from "@/lib/auth"
import { enviar, useDatos } from "@/lib/datos"
import { bs } from "@/lib/formato"
import type { RolSocio, Tarifa } from "@/lib/tipos"

export default function Tarifas() {
  const { usuario } = useSesion()
  const tarifas = useDatos<Tarifa[]>("/tarifas")
  const categorias = useDatos<RolSocio[]>("/roles-socio")
  const [editando, setEditando] = useState<Tarifa | null>(null)
  const [form, setForm] = useState({ consumo_minimo_m3: "", monto_minimo: "", precio_m3: "" })
  const esAdmin = usuario?.rol === "Administrador"

  const nombreCategoria = (id: number) =>
    categorias.datos?.find((c) => c.id_rol_socio === id)?.rol_socio ?? id

  function abrir(tarifa: Tarifa) {
    setEditando(tarifa)
    setForm({
      consumo_minimo_m3: String(tarifa.consumo_minimo_m3 ?? 0),
      monto_minimo: String(tarifa.monto_minimo),
      precio_m3: String(tarifa.precio_m3),
    })
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (!editando) return
    const ok = await enviar(`/tarifas/${editando.id_tarifa}`, {
      consumo_minimo_m3: Number(form.consumo_minimo_m3),
      monto_minimo: Number(form.monto_minimo),
      precio_m3: Number(form.precio_m3),
    }, "Tarifa actualizada", "PUT")
    if (ok) {
      setEditando(null)
      tarifas.recargar()
    }
  }

  return (
    <>
      <Encabezado
        titulo="Tarifas"
        descripcion="Monto mínimo hasta cierto consumo y precio por cada m³ adicional, por categoría (HU7)."
      />
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Consumo mínimo</TableHead>
              <TableHead className="text-right">Monto mínimo</TableHead>
              <TableHead className="text-right">Precio por m³ adicional</TableHead>
              <TableHead>Ejemplo: 10 m³</TableHead>
              {esAdmin && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tarifas.datos?.map((t) => {
              const minimo = t.consumo_minimo_m3 ?? 0
              const ejemplo = t.monto_minimo + Math.max(0, 10 - minimo) * t.precio_m3
              return (
                <TableRow key={t.id_tarifa}>
                  <TableCell className="font-medium">{nombreCategoria(t.rol_socio_id_rol_socio)}</TableCell>
                  <TableCell className="text-right">{minimo} m³</TableCell>
                  <TableCell className="text-right">{bs(t.monto_minimo)}</TableCell>
                  <TableCell className="text-right">{bs(t.precio_m3)}</TableCell>
                  <TableCell className="text-muted-foreground">{bs(ejemplo)}</TableCell>
                  {esAdmin && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => abrir(t)}><PencilIcon /> Editar</Button>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <EstadoCarga cargando={tarifas.cargando} error={tarifas.error} />
      </Panel>

      <Dialog open={editando !== null} onOpenChange={(abierto) => !abierto && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tarifa {editando && nombreCategoria(editando.rol_socio_id_rol_socio)}</DialogTitle>
          </DialogHeader>
          <form onSubmit={guardar} className="grid gap-3">
            <Campo etiqueta="Consumo mínimo (m³)">
              <Input type="number" min="0" value={form.consumo_minimo_m3}
                onChange={(e) => setForm({ ...form, consumo_minimo_m3: e.target.value })} required />
            </Campo>
            <Campo etiqueta="Monto mínimo (Bs)">
              <Input type="number" min="0" step="0.01" value={form.monto_minimo}
                onChange={(e) => setForm({ ...form, monto_minimo: e.target.value })} required />
            </Campo>
            <Campo etiqueta="Precio por m³ adicional (Bs)">
              <Input type="number" min="0" value={form.precio_m3}
                onChange={(e) => setForm({ ...form, precio_m3: e.target.value })} required />
            </Campo>
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
