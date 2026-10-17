import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FilePlus2Icon, SearchIcon } from "lucide-react"

import { Campo, Encabezado, Estado, EstadoCarga, Panel, Seleccion } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { consulta, enviar, useDatos } from "@/lib/datos"
import { bs, fecha, ordenarPeriodos, periodoActual } from "@/lib/formato"
import type { Aviso, Periodo } from "@/lib/tipos"

export default function Avisos() {
  const navegar = useNavigate()
  const periodos = useDatos<Periodo[]>("/periodos")
  const [busqueda, setBusqueda] = useState("")
  const [filtros, setFiltros] = useState({ q: "", id_periodo: "", estado: "" })
  const avisos = useDatos<Aviso[]>(`/avisos${consulta(filtros)}`)
  const [generando, setGenerando] = useState(false)

  const listaPeriodos = periodos.datos ? ordenarPeriodos(periodos.datos) : []

  return (
    <>
      <Encabezado
        titulo="Avisos de cobranza"
        descripcion="Búsqueda inmediata por código fijo, nombre, periodo o estado (HU15)."
      >
        <Button onClick={() => setGenerando(true)}><FilePlus2Icon /> Generar avisos del periodo</Button>
      </Encabezado>

      <div className="mb-4 flex flex-wrap gap-2">
        <form onSubmit={(e) => { e.preventDefault(); setFiltros({ ...filtros, q: busqueda }) }} className="flex gap-2">
          <Input className="w-64" placeholder="Código fijo o nombre" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <Button type="submit" variant="outline"><SearchIcon /> Buscar</Button>
        </form>
        <Seleccion className="w-36" value={filtros.id_periodo} onChange={(e) => setFiltros({ ...filtros, id_periodo: e.target.value })}>
          <option value="">Todo periodo</option>
          {listaPeriodos.map((p) => <option key={p.id_periodo} value={p.id_periodo}>{p.periodo}</option>)}
        </Seleccion>
        <Seleccion className="w-36" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todo estado</option>
          {["PENDIENTE", "VENCIDO", "PAGADO", "ANULADO"].map((e) => <option key={e}>{e}</option>)}
        </Seleccion>
      </div>

      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Socio</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead className="text-right">Consumo</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {avisos.datos?.map((a) => (
              <TableRow key={a.id_aviso} className="cursor-pointer" onClick={() => navegar(`/avisos/${a.id_aviso}`)}>
                <TableCell className="text-primary">{a.id_aviso}</TableCell>
                <TableCell>{a.codigo_fijo} · {a.nombre_socio}</TableCell>
                <TableCell>{a.periodo}</TableCell>
                <TableCell className="text-right">{a.consumo_m3 ?? "—"} m³</TableCell>
                <TableCell className="text-right font-medium">{bs(a.total_aviso)}</TableCell>
                <TableCell>{fecha(a.fecha_vencimiento)}</TableCell>
                <TableCell><Estado valor={a.estado} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EstadoCarga cargando={avisos.cargando} error={avisos.error} vacio={avisos.datos?.length === 0} />
      </Panel>

      {generando && (
        <GenerarPeriodo
          periodos={listaPeriodos}
          alCerrar={() => setGenerando(false)}
          alGenerar={avisos.recargar}
        />
      )}
    </>
  )
}

function GenerarPeriodo({
  periodos, alCerrar, alGenerar,
}: { periodos: Periodo[]; alCerrar: () => void; alGenerar: () => void }) {
  const actual = periodoActual(periodos)
  const [idPeriodo, setIdPeriodo] = useState(actual ? String(actual.id_periodo) : "")
  const [resultado, setResultado] = useState<{ generados: number; omitidos: string[] } | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function generar() {
    setEnviando(true)
    const respuesta = await enviar<{ generados: number; omitidos: string[] }>(
      "/avisos/generar-periodo", { periodo_id_periodo: Number(idPeriodo) }, "Generación terminada",
    )
    setEnviando(false)
    if (respuesta) {
      setResultado(respuesta)
      alGenerar()
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Generar avisos del periodo</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          Crea el aviso de cada lectura del periodo que todavía no lo tiene, con la tarifa de su categoría,
          sus cargos extra y su cuota de inscripción.
        </p>
        <Campo etiqueta="Periodo">
          <Seleccion value={idPeriodo} onChange={(e) => { setIdPeriodo(e.target.value); setResultado(null) }}>
            {periodos.map((p) => <option key={p.id_periodo} value={p.id_periodo}>{p.periodo}</option>)}
          </Seleccion>
        </Campo>
        {resultado && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{resultado.generados} avisos generados.</p>
            {resultado.omitidos.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {resultado.omitidos.map((o) => <li key={o}>{o}</li>)}
              </ul>
            )}
          </div>
        )}
        <DialogFooter>
          <Button onClick={generar} disabled={!idPeriodo || enviando}>{enviando ? "Generando..." : "Generar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
