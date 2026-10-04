# FairLens UI (shadcn/ui · React · TypeScript)

Drop-in replacement for the `frontend/` folder of FairLens. Same API contract (`/api/*`, proxied to `localhost:8000`).

```bash
npm install
npm run dev     # http://localhost:5173
```

shadcn/ui components live in `src/components/ui/` (new-york style, neutral base, Tailwind v4, Radix primitives).
To add more: `npx shadcn@latest add <component>` — `components.json` is already configured.
