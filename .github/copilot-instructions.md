# AI Coding Agent Instructions – Pronajímatel v6

## Project Context
Next.js 14 property management app with modular architecture, Supabase backend, and strict 6-section UI system. Built for landlords to manage properties, tenants, contracts, payments, and documents.

## Architecture Fundamentals

### 6-Section UI Layout (IMMUTABLE)
Every screen follows this fixed structure:
1. **HomeButton** (top-left corner)
2. **Sidebar** (left panel, dynamic modules)
3. **Top Bar** (Breadcrumbs left, HomeActions right)
4. **CommonActions** (toolbar for list/detail operations)
5. **Content** (EntityList/EntityDetailFrame/Tiles)
6. **Footer** (optional status bar)

See [AppShell.tsx](app/AppShell.tsx) for implementation. Never break this layout.

### Module System
Modules live in `app/modules/XXX-nazev/` with numeric prefixes (010, 020, 030, etc.):
- `module.config.js` – defines id, label, icon, order, enabled, tiles
- `tiles/` – entry points (overview lists, type-specific views)
- `forms/` – form definitions for DetailView
- `components/` – module-specific UI

Modules are **dynamically loaded** via [modules.index.js](app/modules.index.js). Sidebar auto-generates from enabled modules. Never hardcode module references.

Example: [030-pronajimatel/module.config.js](app/modules/030-pronajimatel/module.config.js)

### Data Layer
- **Supabase** for auth, database, storage
- **Services** in `app/lib/services/` handle all data operations
- **RLS policies** enforce row-level security
- **Never call Supabase directly from UI components** – always use service layer

Example service: [app/lib/services/permissions.ts](app/lib/services/permissions.ts)

## Critical Conventions

### File Headers (MANDATORY)
Every file must start with:
```typescript
// FILE: app/path/to/Component.tsx
// PURPOSE: Brief description of what this file does
// NOTES: Any important context
```

### UI Components Pattern
Use these standard components (in `app/UI/`):
- `EntityList` – table view with sorting/filtering
- `EntityDetailFrame` – detail view with tabs
- `RelationListWithDetail` – list + detail sidebar
- `CommonActions` – toolbar actions (add, edit, delete, filter, etc.)
- `DetailView` – form-based detail rendering

Never create duplicate components. Check `app/UI/` before building new UI.

### Subject Types (Polymorphic Entity)
Subjects represent all persons/companies with type discrimination:
- `osoba` (person), `osvc` (self-employed), `firma` (company)
- `spolek` (association), `statni` (government), `zastupce` (representative)

Each type has different required fields. See [docs/01-core/subject-model.md](docs/01-core/subject-model.md).

Table: `public.subjects`, roles via `subject_roles`, validation in UI based on `subject_type`.

### Attachments System
Attachments are polymorphic (link to any entity):
- **Read-only tab** in entity detail (view/download only)
- **Management tile** via 📎 button in CommonActions (upload/version/edit)
- Files in Supabase Storage: `documents/{entity-type}/{entity-id}/{doc-id}/v{version}/{filename}`
- Never physically delete – use archivation (`is_archived` flag)

See [docs/03-ui-system.md](docs/03-ui-system.md#5️⃣-sekce-přílohy) section 5.

### Theme & Localization
- Light/dark mode via `app/lib/themeSettings.ts`
- Czech language in UI (labels, validation messages)
- Apply theme classes to layout on load

## Developer Workflows

### Running Locally
```bash
npm run dev  # Starts on http://localhost:3000
```

### Environment Setup
Copy `.env.example` to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_BASE_URL=http://localhost:3000
```

### Database Migrations
Migrations in `supabase/migrations/` numbered sequentially:
```bash
# Example: Create new migration
supabase migration new create_property_units
```

Always include:
- Migration header comment (purpose, date)
- RLS policies for new tables
- Indexes for foreign keys and query fields

Example: [supabase/migrations/011_seed_test_landlords.sql](supabase/migrations/011_seed_test_landlords.sql)

### Deployment
- **Main branch** → Vercel production
- **Feature branches** → Vercel preview deployments
- Auto-deploy on push via webhook

### Git Workflow (AI Collaboration)
Per [docs/00-core/SPOLUPRACE-S-AI.md](docs/00-core/SPOLUPRACE-S-AI.md):
1. Create feature branch: `feature/nazev-zmeny`
2. Make changes, commit with descriptive messages
3. Push to GitHub (triggers Vercel preview)
4. Test on preview URL
5. Merge to `main` when approved

Never commit directly to `main` during active development.

## Project-Specific Rules

### From [docs/09-project-rules.md](docs/09-project-rules.md):
- **No duplicates** – One component, one place
- **Documentation updates** – Every change must update relevant docs in `/docs/`
- **Simple over magic** – Readable code, no clever tricks
- **Modular consistency** – All modules follow same structure
- **Services for data** – UI never directly calls Supabase

### Module Development Process
From [app/modules/postup.md](app/modules/postup.md):
1. Create field specification (Excel/table)
2. Define selects (hard-coded vs. generic types)
3. Create database tables + migrations
4. Build service layer functions
5. Create UI components (ListView → DetailFrame)
6. Add to module config
7. Test with real data

### Generic Types (Configurable Enums)
User-editable lookup tables for dropdowns:
- Stored in `generic_types` table
- Managed via GenericTypeTile in module 900
- Reference in selects: `{source: 'generic_type:property_types'}`

## Key Documentation

Essential reading for understanding this codebase:
- [docs/02-architecture.md](docs/02-architecture.md) – Tech stack, layers, structure
- [docs/03-ui-system.md](docs/03-ui-system.md) – 6-section layout, UI components
- [docs/04-modules.md](docs/04-modules.md) – Module system details
- [docs/06-data-model.md](docs/06-data-model.md) – Database schema, entities
- [docs/09-project-rules.md](docs/09-project-rules.md) – Mandatory project rules

## Common Pitfalls to Avoid
1. Don't break the 6-section layout structure
2. Don't bypass service layer (no direct Supabase calls in UI)
3. Don't create new UI components without checking `app/UI/` first
4. Don't hardcode module references – use dynamic loading
5. Don't forget RLS policies on new tables
6. Don't skip file headers and purpose comments
7. Don't ignore subject type field requirements
8. Don't physically delete data – use archivation pattern

## Questions to Ask Before Coding
- Does this follow the 6-section layout?
- Is there already a component that does this?
- Should this be in a service layer function?
- Which module does this belong to?
- What RLS policies are needed?
- Is documentation updated?

## Success Criteria
✅ Code follows existing patterns from similar modules
✅ Documentation updated in `/docs/`
✅ Service layer used for data operations
✅ UI components reused, not duplicated
✅ Module config updated if adding tiles
✅ RLS policies added for new tables
✅ File headers present and accurate
