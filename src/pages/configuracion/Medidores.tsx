import { useState, type FormEvent } from "react"
import { PlusIcon } from "lucide-react"

import { Campo, Encabezado, EstadoCarga, Panel } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { enviar, useDatos } from "@/lib/datos"
import { fecha } from "@/lib/formato"
import type { Medidor, Socio } from "@/lib/tipos"

export default function Medidores() {
  const medidores = useDatos<Medidor[]>("/medidores")
  const socios = useDatos<Socio[]>("/socios")
  const [abierto, setAbierto] = useState(false)
  const [form, setForm] = useState({ serie: "", numero: "", fecha_instalacion: "" })

  const socioDe = (id: number) => socios.datos?.find((s) => s.medidor_id_medidor === id && s.estado)

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    const ok = await enviar("/medidores", {
      serie: form.serie, numero: Number(form.numero), fecha_instalacion: form.fecha_instalacion || null,
    }, "Medidor registrado")
    if (ok) {
      setAbierto(false)
      setForm({ serie: "", numero: "", fecha_instalacion: "" })
      medidores.recargar()
    }
  }

  return (
    <>
      <Encabezado titulo="Medidores" descripcion="Medidores instalados en las viviendas (HU9). Se asignan al socio desde su ficha.">
        <Button onClick={() => setAbierto(true)}><PlusIcon /> Nuevo medidor</Button>
      </Encabezado>
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serie</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Instalación</TableHead>
              <TableHead>Socio asignado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medidores.datos?.map((m) => {
              const socio = socioDe(m.id_medidor)
              return (
                <TableRow key={m.id_medidor}>
                  <TableCell className="font-mono text-xs">{m.serie}</TableCell>
                  <TableCell>{m.numero}</TableCell>
                  <TableCell>{fecha(m.fecha_instalacion)}</TableCell>
                  <TableCell>
                    {socio ? `${socio.codigo_fijo} - ${socio.nombre_socio}` : <span className="text-muted-foreground">Libre</span>}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <EstadoCarga cargando={medidores.cargando} error={medidores.error} vacio={medidores.datos?.length === 0} />
      </Panel>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo medidor</DialogTitle></DialogHeader>
          <form onSubmit={guardar} className="grid gap-3">
            <Campo etiqueta="Número de serie" ayuda="No se puede repetir">
              <Input value={form.serie} onChange={(e) => setForm({ ...form, serie: e.target.value })} required />
            </Campo>
            <Campo etiqueta="Número visible">
              <Input type="number" min="1" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} required />
            </Campo>
            <Campo etiqueta="Fecha de instalación">
              <Input type="date" value={form.fecha_instalacion}
                onChange={(e) => setForm({ ...form, fecha_instalacion: e.target.value })} />
            </Campo>
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
