# cospabi-mvp-frontend

Panel administrativo del MVP de la Cooperativa de Agua Potable **COSPABI R.L.**
(React + TypeScript + Vite + Tailwind CSS + shadcn/ui). Consume la API `cospabi-mvp-backend`.

## Ejecutar en local

```bash
npm install
cp .env.example .env      # ajustar VITE_API_URL si la API no está en localhost:8000
npm run dev
```

## Despliegue en Vercel

- Framework: Vite (build `npm run build`, salida `dist`).
- Variable de entorno: `VITE_API_URL` = URL de la API en Render.
- `vercel.json` redirige todas las rutas a `index.html` (React Router).
