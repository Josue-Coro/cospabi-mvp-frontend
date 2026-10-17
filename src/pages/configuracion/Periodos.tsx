import { useState, type FormEvent } from "react"

import { Campo, Encabezado, EstadoCarga, Panel } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { enviar, useDatos } from "@/lib/datos"
import { ordenarPeriodos } from "@/lib/formato"
import type { Periodo } from "@/lib/tipos"

export default function Periodos() {
  const periodos = useDatos<Periodo[]>("/periodos")
  const [periodo, setPeriodo] = useState("")

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (await enviar("/periodos", { periodo }, `Periodo ${periodo} registrado`)) {
      setPeriodo("")
      periodos.recargar()
    }
  }

  return (
    <>
      <Encabezado
        titulo="Periodos"
        descripcion="Meses de facturación. Los periodos de las cuotas de inscripción se crean solos."
      />
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <Panel>
          <form onSubmit={guardar} className="grid gap-3">
            <Campo etiqueta="Nuevo periodo" ayuda="Formato MM/aaaa, por ejemplo 11/2026">
              <Input value={periodo} onChange={(e) => setPeriodo(e.target.value)}
                pattern="(0[1-9]|1[0-2])/\d{4}" placeholder="11/2026" required />
            </Campo>
            <Button type="submit">Registrar</Button>
          </form>
        </Panel>
        <Panel>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Periodo</TableHead><TableHead>N° interno</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {periodos.datos && ordenarPeriodos(periodos.datos).map((p) => (
                <TableRow key={p.id_periodo}>
                  <TableCell className="font-medium">{p.periodo}</TableCell>
                  <TableCell className="text-muted-foreground">{p.id_periodo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <EstadoCarga cargando={periodos.cargando} error={periodos.error} vacio={periodos.datos?.length === 0} />
        </Panel>
      </div>
    </>
  )
}
