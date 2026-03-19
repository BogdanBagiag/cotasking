# CoTasking — Modern SaaS Kanban

Platformă Kanban multi-tenant modernă pentru companii și persoane fizice. Construită cu Next.js, Supabase și TypeScript.

![CoTasking](https://via.placeholder.com/1200x600/0e8fe7/ffffff?text=CoTasking)

## 🚀 Stack tehnic

- **Next.js 14** — App Router, Server Components, TypeScript
- **Supabase** — PostgreSQL + Auth + Row Level Security (RLS) + Realtime
- **Tailwind CSS** — Styling
- **@hello-pangea/dnd** — Drag & Drop
- **next-intl** — i18n (Română + Engleză)
- **Resend** — Email notifications
- **Vercel** — Deploy

## 💰 Planuri

| Feature | Free | Premium (€9/lună) | Premium Plus (€19/lună) |
|---|---|---|---|
| Workspace-uri | 1 | 1 | Nelimitat |
| Proiecte | 3 | Nelimitat | Nelimitat |
| Membri | 5 | 25 | Nelimitat |
| Board-uri | 1/proiect | Nelimitat | Nelimitat |
| Subtask-uri | ❌ | ✅ | ✅ |
| Email reminders | ❌ | ✅ | ✅ |
| Zile libere custom | ❌ | ✅ | ✅ |
| Rapoarte | ❌ | ❌ | ✅ |
| Export CSV/PDF | ❌ | ❌ | ✅ |

## 🛠️ Setup local

### 1. Clonează repository-ul

```bash
git clone https://github.com/your-username/cotasking.git
cd cotasking
npm install
```

### 2. Configurează Supabase

1. Creează un proiect nou pe [supabase.com](https://supabase.com)
2. Rulează migrarea din `supabase/migrations/001_initial_schema.sql` în SQL Editor
3. Activează Google OAuth în **Authentication → Providers → Google**
4. Configurează URL-urile în **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 3. Configurează variabilele de mediu

```bash
cp .env.local.example .env.local
```

Completează `.env.local` cu credențialele Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=your-resend-api-key
```

### 4. Rulează local

```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000)

## 🚀 Deploy pe Vercel

```bash
# Instalează Vercel CLI
npm i -g vercel

# Deploy
vercel

# Sau conectează GitHub repository-ul în Vercel dashboard
```

**Variabile de mediu pe Vercel:**
Adaugă toate variabilele din `.env.local.example` în Vercel → Settings → Environment Variables.

## 📁 Structura proiectului

```
cotasking/
├── app/
│   ├── [locale]/                  # Route groups per locale
│   │   ├── (auth)/                # Login, Register
│   │   ├── (marketing)/           # Landing page, Pricing
│   │   └── (app)/                 # Dashboard, Workspace, Board
│   └── auth/callback/             # Supabase OAuth callback
├── components/
│   ├── ui/                        # Componente de bază (Button, Input, etc.)
│   ├── kanban/                    # KanbanBoard, KanbanColumn, KanbanCard
│   ├── layout/                    # Sidebar, Header, LandingNav
│   ├── workspace/                 # ProjectsGrid, HolidaysManager, etc.
│   └── shared/                    # NotificationsBell, LanguageSwitcher, Pricing
├── i18n/                          # next-intl config
├── lib/
│   ├── supabase/                  # Client, Server, Middleware
│   └── utils.ts                   # Funcții utilitare
├── messages/                      # Traduceri ro.json, en.json
├── supabase/
│   └── migrations/                # Schema SQL
└── types/                         # TypeScript types, PLAN_LIMITS
```

## 🗄️ Schema baza de date

```
profiles           — Extinde auth.users (full_name, avatar_url)
workspaces         — Multi-tenant: name, slug, plan, owner_id
workspace_members  — Roluri: owner/admin/manager/member/viewer
projects           — Proiecte per workspace (color, description)
boards             — Board-uri per proiect
columns            — Coloane per board (position, color)
tasks              — Task-uri (title, description, due_date, assignee, priority)
subtasks           — Subtask-uri (Premium+)
labels             — Etichete per workspace
task_labels        — Many-to-many tasks ↔ labels
comments           — Comentarii pe task-uri
notifications      — Notificări in-app (realtime)
holidays           — Zile libere per workspace (Premium+)
```

## 🔐 Securitate (RLS)

Row Level Security este activat pe toate tabelele. Fiecare user poate accesa doar datele din workspace-urile din care face parte. Rolurile controlează ce operații poate efectua fiecare user.

## 🌍 Internalizare (i18n)

- Română (`/ro`) — limbă implicită
- Engleză (`/en`)
- Structurat pentru adăugarea ușoară de noi limbi
- Traduceri în `messages/ro.json` și `messages/en.json`

## 📧 Notificări email

Folosim **Resend** pentru notificări email. Configurează `RESEND_API_KEY` și `RESEND_FROM_EMAIL` în `.env.local`.

## 🧩 Features implementate

- [x] Autentificare (email/password + Google OAuth)
- [x] Multi-workspace cu izolare completă a datelor
- [x] Proiecte cu board-uri multiple
- [x] Kanban board cu Drag & Drop (coloane + task-uri)
- [x] Task details: assignee, due date, priority, labels, subtasks, comments
- [x] Zile libere cu indicator vizual pe task-uri
- [x] Notificări in-app (realtime via Supabase)
- [x] i18n complet (RO + EN)
- [x] Plan limits (Free/Premium/Premium Plus)
- [x] Landing page + Pricing
- [x] Dashboard cu statistici

## 🔮 În curând

- [ ] Integrare Stripe pentru plăți
- [ ] Email reminders pentru deadline-uri
- [ ] Rapoarte și statistici (Premium Plus)
- [ ] Export CSV/PDF
- [ ] Membrii workspace cu invitații
- [ ] Settings workspace/profil
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)

## 📝 Licență

MIT License — folosiți liber pentru proiecte personale și comerciale.
