import { useState } from "react"

import { Campo, Encabezado, EstadoCarga, Panel, Seleccion } from "@/components/comunes"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { consulta, useDatos } from "@/lib/datos"
import { fechaHora } from "@/lib/formato"
import type { RegistroBitacora, UsuarioDetalle } from "@/lib/tipos"

export default function Bitacora() {
  const usuarios = useDatos<UsuarioDetalle[]>("/usuarios")
  const [filtros, setFiltros] = useState({ id_usuario: "", desde: "", hasta: "" })
  const registros = useDatos<RegistroBitacora[]>(`/bitacora${consulta(filtros)}`)

  return (
    <>
      <Encabezado
        titulo="Bitácora"
        descripcion="Acciones de cada usuario. Es de solo lectura: la base de datos impide modificarla (HU6)."
      />
      <Panel className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo etiqueta="Usuario">
            <Seleccion value={filtros.id_usuario} onChange={(e) => setFiltros({ ...filtros, id_usuario: e.target.value })}>
              <option value="">Todos</option>
              {usuarios.datos?.map((u) => (
                <option key={u.id_usuario_admin} value={u.id_usuario_admin}>{u.usuario}</option>
              ))}
            </Seleccion>
          </Campo>
          <Campo etiqueta="Desde">
            <Input type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} />
          </Campo>
          <Campo etiqueta="Hasta">
            <Input type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} />
          </Campo>
        </div>
      </Panel>
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Fecha y hora</TableHead>
              <TableHead className="w-28">Usuario</TableHead>
              <TableHead>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.datos?.map((r) => (
              <TableRow key={r.id_bitacora}>
                <TableCell>{fechaHora(r.fecha_hora)}</TableCell>
                <TableCell className="font-mono text-xs">{r.usuario}</TableCell>
                <TableCell className="whitespace-normal">{r.accion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EstadoCarga cargando={registros.cargando} error={registros.error} vacio={registros.datos?.length === 0} />
      </Panel>
    </>
  )
}
