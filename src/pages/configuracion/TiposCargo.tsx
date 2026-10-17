import { useState, type FormEvent } from "react"
import { PencilIcon, PlusIcon } from "lucide-react"

import { Campo, Encabezado, Estado, EstadoCarga, Panel } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSesion } from "@/lib/auth"
import { enviar, useDatos } from "@/lib/datos"
import { bs } from "@/lib/formato"
import type { TipoCargo } from "@/lib/tipos"

const VACIO = { nombre: "", descripcion: "", monto: "", estado: true }

export default function TiposCargo() {
  const { usuario } = useSesion()
  const tipos = useDatos<TipoCargo[]>("/tipos-cargo")
  const [editando, setEditando] = useState<TipoCargo | "nuevo" | null>(null)
  const [form, setForm] = useState(VACIO)
  const esAdmin = usuario?.rol === "Administrador"

  function abrir(tipo: TipoCargo | "nuevo") {
    setEditando(tipo)
    setForm(tipo === "nuevo" ? VACIO : {
      nombre: tipo.nombre, descripcion: tipo.descripcion ?? "", monto: String(tipo.monto), estado: tipo.estado,
    })
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    const cuerpo = { nombre: form.nombre, descripcion: form.descripcion || null, monto: Number(form.monto) }
    const ok = editando === "nuevo"
      ? await enviar("/tipos-cargo", cuerpo, "Tipo de cargo registrado")
      : await enviar(`/tipos-cargo/${(editando as TipoCargo).id_tipo}`, { ...cuerpo, estado: form.estado }, "Tipo de cargo actualizado", "PUT")
    if (ok) {
      setEditando(null)
      tipos.recargar()
    }
  }

  return (
    <>
      <Encabezado
        titulo="Tipos de cargo"
        descripcion="Conceptos de cobro adicional: multas, reconexión y otros (HU8)."
      >
        {esAdmin && <Button onClick={() => abrir("nuevo")}><PlusIcon /> Nuevo tipo</Button>}
      </Encabezado>
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Estado</TableHead>
              {esAdmin && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tipos.datos?.map((t) => (
              <TableRow key={t.id_tipo}>
                <TableCell className="font-medium">{t.nombre}</TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">{t.descripcion}</TableCell>
                <TableCell className="text-right">{bs(t.monto)}</TableCell>
                <TableCell><Estado valor={t.estado ? "ACTIVO" : "INACTIVO"} /></TableCell>
                {esAdmin && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => abrir(t)}><PencilIcon /> Editar</Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EstadoCarga cargando={tipos.cargando} error={tipos.error} vacio={tipos.datos?.length === 0} />
      </Panel>

      <Dialog open={editando !== null} onOpenChange={(abierto) => !abierto && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando === "nuevo" ? "Nuevo tipo de cargo" : "Editar tipo de cargo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={guardar} className="grid gap-3">
            <Campo etiqueta="Nombre">
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} minLength={3} required />
            </Campo>
            <Campo etiqueta="Descripción">
              <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </Campo>
            <Campo etiqueta="Monto por defecto (Bs)">
              <Input type="number" min="0" step="0.01" value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })} required />
            </Campo>
            {editando !== "nuevo" && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.checked })} />
                Vigente (desmarcar para desactivar; no se borra porque puede estar en avisos)
              </label>
            )}
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
