import { useState, type FormEvent } from "react"
import { PlusIcon } from "lucide-react"

import { Campo, Encabezado, Estado, EstadoCarga, Panel, Seleccion } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { consulta, enviar, useDatos } from "@/lib/datos"
import { bs, fecha, ordenarPeriodos, periodoActual } from "@/lib/formato"
import type { CargoExtra, Periodo, Socio, TipoCargo } from "@/lib/tipos"

export default function CargosExtra() {
  const periodos = useDatos<Periodo[]>("/periodos")
  const [idPeriodo, setIdPeriodo] = useState("")
  const cargos = useDatos<CargoExtra[]>(`/cargos-extra${consulta({ id_periodo: idPeriodo })}`)
  const [nuevo, setNuevo] = useState(false)
  const [anulando, setAnulando] = useState<CargoExtra | null>(null)
  const [motivo, setMotivo] = useState("")
  const listaPeriodos = periodos.datos ? ordenarPeriodos(periodos.datos) : []

  async function anular(evento: FormEvent) {
    evento.preventDefault()
    if (!anulando) return
    if (await enviar(`/cargos-extra/${anulando.id_cargo_extra}/anular`, { motivo }, "Cargo anulado")) {
      setAnulando(null)
      setMotivo("")
      cargos.recargar()
    }
  }

  return (
    <>
      <Encabezado
        titulo="Cargos extra"
        descripcion="Multas, reconexiones y otros conceptos que se suman al aviso del periodo (HU16)."
      >
        <Button onClick={() => setNuevo(true)}><PlusIcon /> Asignar cargo</Button>
      </Encabezado>
      <Seleccion className="mb-4 w-44" value={idPeriodo} onChange={(e) => setIdPeriodo(e.target.value)}>
        <option value="">Todos los periodos</option>
        {listaPeriodos.map((p) => <option key={p.id_periodo} value={p.id_periodo}>{p.periodo}</option>)}
      </Seleccion>
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Socio</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargos.datos?.map((c) => (
              <TableRow key={c.id_cargo_extra}>
                <TableCell>{c.codigo_fijo} · {c.nombre_socio}</TableCell>
                <TableCell>{c.tipo}</TableCell>
                <TableCell className="whitespace-normal" title={c.motivo_anulacion ?? ""}>{c.descripcion}</TableCell>
                <TableCell>{c.periodo}</TableCell>
                <TableCell className="text-right">{bs(c.monto)}</TableCell>
                <TableCell>{fecha(c.fecha_registro)}</TableCell>
                <TableCell><Estado valor={c.estado} /></TableCell>
                <TableCell className="text-right">
                  {c.estado === "PENDIENTE" && (
                    <Button variant="ghost" size="sm" onClick={() => setAnulando(c)}>Anular</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EstadoCarga cargando={cargos.cargando} error={cargos.error} vacio={cargos.datos?.length === 0} />
      </Panel>

      {nuevo && <NuevoCargo periodos={listaPeriodos} alCerrar={() => setNuevo(false)} alGuardar={() => { setNuevo(false); cargos.recargar() }} />}

      <Dialog open={anulando !== null} onOpenChange={(abierto) => !abierto && setAnulando(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Anular cargo de {anulando?.nombre_socio}</DialogTitle></DialogHeader>
          <form onSubmit={anular} className="grid gap-3">
            <Campo etiqueta="Motivo" ayuda="Se resta del aviso si todavía no fue pagado">
              <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} minLength={3} required />
            </Campo>
            <DialogFooter><Button type="submit" variant="destructive">Anular cargo</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function NuevoCargo({
  periodos, alCerrar, alGuardar,
}: { periodos: Periodo[]; alCerrar: () => void; alGuardar: () => void }) {
  const socios = useDatos<Socio[]>("/socios")
  const tipos = useDatos<TipoCargo[]>("/tipos-cargo?solo_activos=true")
  const [form, setForm] = useState({
    socio_id_socio: "", tipo_cargo_id_tipo: "",
    periodo_id_periodo: String(periodoActual(periodos)?.id_periodo ?? ""),
    monto: "", descripcion: "",
  })
  const tipo = tipos.datos?.find((t) => String(t.id_tipo) === form.tipo_cargo_id_tipo)

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    const ok = await enviar("/cargos-extra", {
      socio_id_socio: Number(form.socio_id_socio),
      tipo_cargo_id_tipo: Number(form.tipo_cargo_id_tipo),
      periodo_id_periodo: Number(form.periodo_id_periodo),
      monto: form.monto ? Number(form.monto) : null,
      descripcion: form.descripcion || null,
    }, "Cargo asignado")
    if (ok) alGuardar()
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Asignar cargo extra</DialogTitle></DialogHeader>
        <form onSubmit={guardar} className="grid gap-3">
          <Campo etiqueta="Socio">
            <Seleccion value={form.socio_id_socio} onChange={(e) => setForm({ ...form, socio_id_socio: e.target.value })} required>
              <option value="">Seleccione...</option>
              {socios.datos?.filter((s) => s.estado).map((s) => (
                <option key={s.id_socio} value={s.id_socio}>{s.codigo_fijo} · {s.nombre_socio}</option>
              ))}
            </Seleccion>
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Tipo de cargo">
              <Seleccion value={form.tipo_cargo_id_tipo} onChange={(e) => setForm({ ...form, tipo_cargo_id_tipo: e.target.value })} required>
                <option value="">Seleccione...</option>
                {tipos.datos?.map((t) => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre}</option>)}
              </Seleccion>
            </Campo>
            <Campo etiqueta="Periodo del aviso">
              <Seleccion value={form.periodo_id_periodo} onChange={(e) => setForm({ ...form, periodo_id_periodo: e.target.value })}>
                {periodos.map((p) => <option key={p.id_periodo} value={p.id_periodo}>{p.periodo}</option>)}
              </Seleccion>
            </Campo>
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <Campo etiqueta="Monto (Bs)" ayuda={tipo ? `Por defecto ${bs(tipo.monto)}` : undefined}>
              <Input type="number" min="0.01" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
            </Campo>
            <Campo etiqueta="Detalle" ayuda="Ej.: Falta a la asamblea del 04/10">
              <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </Campo>
          </div>
          <DialogFooter><Button type="submit">Asignar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
