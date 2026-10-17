import { useState, type FormEvent } from "react"
import { KeyRoundIcon, PencilIcon, PlusIcon } from "lucide-react"

import { Campo, Encabezado, Estado, EstadoCarga, Panel, Seleccion } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { enviar, useDatos } from "@/lib/datos"
import { fecha } from "@/lib/formato"
import type { Rol, UsuarioDetalle } from "@/lib/tipos"

type Formulario = {
  nombre: string
  apellido: string
  usuario: string
  contrasena: string
  correo: string
  rol_id_rol: string
  estado: boolean
}

const VACIO: Formulario = {
  nombre: "", apellido: "", usuario: "", contrasena: "", correo: "", rol_id_rol: "2", estado: true,
}

export default function Usuarios() {
  const usuarios = useDatos<UsuarioDetalle[]>("/usuarios")
  const roles = useDatos<Rol[]>("/roles")
  const [editando, setEditando] = useState<UsuarioDetalle | "nuevo" | null>(null)
  const [form, setForm] = useState<Formulario>(VACIO)
  const [claveDe, setClaveDe] = useState<UsuarioDetalle | null>(null)
  const [nuevaClave, setNuevaClave] = useState("")

  function abrir(usuario: UsuarioDetalle | "nuevo") {
    setEditando(usuario)
    setForm(usuario === "nuevo" ? VACIO : {
      nombre: usuario.nombre, apellido: usuario.apellido, usuario: usuario.usuario, contrasena: "",
      correo: usuario.correo ?? "", rol_id_rol: String(usuario.rol_id_rol), estado: usuario.estado,
    })
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    const comunes = {
      nombre: form.nombre, apellido: form.apellido, correo: form.correo || null,
      rol_id_rol: Number(form.rol_id_rol),
    }
    const ok = editando === "nuevo"
      ? await enviar("/usuarios", { ...comunes, usuario: form.usuario, contrasena: form.contrasena }, "Usuario registrado")
      : await enviar(`/usuarios/${(editando as UsuarioDetalle).id_usuario_admin}`, { ...comunes, estado: form.estado }, "Usuario actualizado", "PUT")
    if (ok) {
      setEditando(null)
      usuarios.recargar()
    }
  }

  async function cambiarClave(evento: FormEvent) {
    evento.preventDefault()
    if (!claveDe) return
    const ok = await enviar(`/usuarios/${claveDe.id_usuario_admin}/clave`, { contrasena: nuevaClave }, "Contraseña restablecida")
    if (ok) {
      setClaveDe(null)
      setNuevaClave("")
    }
  }

  const cambiar = (campo: keyof Formulario) => (e: { target: { value: string } }) =>
    setForm({ ...form, [campo]: e.target.value })

  return (
    <>
      <Encabezado titulo="Usuarios" descripcion="Personal con acceso al sistema y su rol (HU2, HU3).">
        <Button onClick={() => abrir("nuevo")}><PlusIcon /> Nuevo usuario</Button>
      </Encabezado>

      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Alta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.datos?.map((u) => (
              <TableRow key={u.id_usuario_admin}>
                <TableCell>{u.nombre} {u.apellido}</TableCell>
                <TableCell className="font-mono text-xs">{u.usuario}</TableCell>
                <TableCell>{u.rol.nombre}</TableCell>
                <TableCell>{fecha(u.fecha_creacion)}</TableCell>
                <TableCell><Estado valor={u.estado ? "ACTIVO" : "INACTIVO"} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => abrir(u)}><PencilIcon /> Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setClaveDe(u)}><KeyRoundIcon /> Clave</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EstadoCarga cargando={usuarios.cargando} error={usuarios.error} vacio={usuarios.datos?.length === 0} />
      </Panel>

      <Dialog open={editando !== null} onOpenChange={(abierto) => !abierto && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando === "nuevo" ? "Nuevo usuario" : "Editar usuario"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={guardar} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Nombre"><Input value={form.nombre} onChange={cambiar("nombre")} required /></Campo>
              <Campo etiqueta="Apellido"><Input value={form.apellido} onChange={cambiar("apellido")} required /></Campo>
            </div>
            {editando === "nuevo" && (
              <div className="grid grid-cols-2 gap-3">
                <Campo etiqueta="Usuario"><Input value={form.usuario} onChange={cambiar("usuario")} required /></Campo>
                <Campo etiqueta="Contraseña" ayuda="Mínimo 6 caracteres">
                  <Input type="password" value={form.contrasena} onChange={cambiar("contrasena")} minLength={6} required />
                </Campo>
              </div>
            )}
            <Campo etiqueta="Correo"><Input type="email" value={form.correo} onChange={cambiar("correo")} /></Campo>
            <Campo etiqueta="Rol">
              <Seleccion value={form.rol_id_rol} onChange={cambiar("rol_id_rol")}>
                {roles.datos?.map((r) => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}
              </Seleccion>
            </Campo>
            {editando !== "nuevo" && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.checked })} />
                Usuario activo (desmarcar para dar de baja sin borrar)
              </label>
            )}
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={claveDe !== null} onOpenChange={(abierto) => !abierto && setClaveDe(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Restablecer contraseña de {claveDe?.usuario}</DialogTitle></DialogHeader>
          <form onSubmit={cambiarClave} className="grid gap-3">
            <Campo etiqueta="Nueva contraseña" ayuda="Mínimo 6 caracteres">
              <Input type="password" value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} minLength={6} required />
            </Campo>
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
