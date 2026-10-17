import { useState, type FormEvent } from "react"
import { Navigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSesion } from "@/lib/auth"

export default function Login() {
  const { usuario, iniciarSesion } = useSesion()
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [error, setError] = useState("")
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to="/" replace />

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setError("")
    setEnviando(true)
    try {
      await iniciarSesion(nombreUsuario, contrasena)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">COSPABI R.L.</CardTitle>
          <CardDescription>Sistema de gestión administrativa. Ingrese con su usuario.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="usuario">Usuario</Label>
              <Input
                id="usuario"
                autoComplete="username"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contrasena">Contraseña</Label>
              <Input
                id="contrasena"
                type="password"
                autoComplete="current-password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={enviando}>
              {enviando ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
