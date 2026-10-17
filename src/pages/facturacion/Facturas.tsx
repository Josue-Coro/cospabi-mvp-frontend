import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { SearchIcon } from "lucide-react"

import { Campo, Encabezado, Estado, EstadoCarga, Panel } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { consulta, useDatos } from "@/lib/datos"
import { bs, fechaHora } from "@/lib/formato"
import type { Factura } from "@/lib/tipos"

export default function Facturas() {
  const navegar = useNavigate()
  const [busqueda, setBusqueda] = useState("")
  const [filtros, setFiltros] = useState({ q: "", desde: "", hasta: "" })
  const facturas = useDatos<Factura[]>(`/facturas${consulta(filtros)}`)
  const total = facturas.datos?.reduce((suma, f) => suma + f.monto_total, 0) ?? 0

  return (
    <>
      <Encabezado
        titulo="Facturas"
        descripcion="Facturas emitidas al cobrar. Es una facturación simulada: no se envía al SIAT de Impuestos Nacionales."
      />
      <Panel className="mb-4">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <form onSubmit={(e) => { e.preventDefault(); setFiltros({ ...filtros, q: busqueda }) }} className="flex items-end gap-2">
            <Campo etiqueta="NIT/CI o razón social" className="flex-1">
              <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </Campo>
            <Button type="submit" variant="outline"><SearchIcon /></Button>
          </form>
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
              <TableHead>N° factura</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>NIT/CI</TableHead>
              <TableHead>Razón social</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facturas.datos?.map((f) => (
              <TableRow key={f.id_factura} className="cursor-pointer" onClick={() => navegar(`/facturas/${f.id_factura}`)}>
                <TableCell className="text-primary">{f.numero_factura}</TableCell>
                <TableCell>{fechaHora(f.fecha_emision)}</TableCell>
                <TableCell>{f.nit_ci}</TableCell>
                <TableCell>{f.razon_social}</TableCell>
                <TableCell className="text-right">{bs(f.monto_total)}</TableCell>
                <TableCell><Estado valor={f.estado} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EstadoCarga cargando={facturas.cargando} error={facturas.error} vacio={facturas.datos?.length === 0} />
        {!!facturas.datos?.length && (
          <p className="mt-3 text-right text-sm font-medium">
            {facturas.datos.length} facturas · total facturado {bs(total)}
          </p>
        )}
      </Panel>
    </>
  )
}
