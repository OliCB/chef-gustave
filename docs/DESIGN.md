# Chef Gustave - Solution Design

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | SvelteKit (PWA) |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| LLM | Gemini API (recipe extraction + ingredient parsing + translation) |
| Nutrition | Edamam API |
| Auth | Shared password + server-side JWT (no expiry) |

## Language

- **UI and data**: French (canonical language)
- **Code**: English

## Access Control

- Single shared password for the household
- Server validates password against a hashed value in env var
- Returns a JWT (no expiry) stored in a cookie on the device
- `hooks.server.ts` checks token on every request; no token → redirect to `/login`
- One-time login per device

## Data Model

### Ingredients
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | unique |

### Recipes
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | |
| servings | int | |
| prep_time | int | minutes |
| cook_time | int | minutes |
| source_url | text | nullable |
| notes | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### RecipeIngredients
| Column | Type | Notes |
|--------|------|-------|
| recipe_id | uuid | FK → Recipes |
| ingredient_id | uuid | FK → Ingredients |
| quantity | decimal | nullable |
| unit | text | nullable |
| position | int | display order |

### Steps
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| recipe_id | uuid | FK → Recipes |
| instruction | text | |
| position | int | display order |

### Tags
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | unique |

### RecipeTags
| Column | Type | Notes |
|--------|------|-------|
| recipe_id | uuid | FK → Recipes |
| tag_id | uuid | FK → Tags |

### NutritionInfo
| Column | Type | Notes |
|--------|------|-------|
| recipe_id | uuid | PK, FK → Recipes |
| calories | decimal | |
| protein | decimal | grams |
| carbs | decimal | grams |
| fat | decimal | grams |
| fiber | decimal | grams |

### MealPlanEntries
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| date | date | |
| meal_type | text | déjeuner / dîner / souper / collation |
| recipe_id | uuid | FK → Recipes |

### Grocery List
Computed at query time — no table. Aggregates ingredients from all recipes in the current week's meal plan, grouped by ingredient name + unit, quantities summed.

## Architecture

### System Overview

```
┌─────────────┐     ┌──────────────────────────┐     ┌───────────┐
│  Phone A    │────▶│  SvelteKit on Vercel      │────▶│ Supabase  │
│  Phone B    │────▶│  (UI + API routes)        │────▶│ (Postgres)│
└─────────────┘     └──────────┬───────────────┘     └───────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
               Gemini API   Edamam    Web scraper
               (recipe      (nutrition) (recipe URL
                extraction)              fetch)
```

Single SvelteKit app — pages + API routes in one deployable unit. Supabase client is server-side only (never exposed to browser). All external API calls are server-side.

### SvelteKit Routes

```
src/routes/
├── +layout.svelte              # shared nav, auth check
├── login/+page.svelte          # password entry
├── recipes/
│   ├── +page.svelte            # recipe list + search/filter by tag
│   ├── new/+page.svelte        # create recipe (manual + URL import)
│   ├── [id]/+page.svelte       # view recipe (cooking mode)
│   └── [id]/edit/+page.svelte  # edit recipe
├── meal-plan/
│   └── +page.svelte            # weekly grid
├── grocery-list/
│   └── +page.svelte            # generated list + copy button
└── api/
    ├── auth/+server.ts
    ├── recipes/+server.ts
    ├── recipes/import/+server.ts
    ├── ingredients/+server.ts
    ├── tags/+server.ts
    ├── meal-plan/+server.ts
    ├── grocery-list/+server.ts
    └── nutrition/+server.ts
```

### Data Loading

- Pages use SvelteKit `load` functions (server-side) for initial data
- Mutations (create, update, delete) via `fetch` to API routes

## Recipe Import Flow

```
User pastes URL
       │
       ▼
Server fetches the page HTML
       │
       ▼
Look for JSON-LD (schema.org/Recipe)
       │
  ┌────┴────┐
  │ Found   │ Not found
  ▼         ▼
Parse       Send HTML to Gemini API
structured  "Extract the recipe from this page"
data
  │         │
  └────┬────┘
       ▼
Gemini parses ingredients into
structured fields (quantity/unit/name)
+ translates everything to French
       │
       ▼
Return to client → populate form
       │
       ▼
User reviews, edits, saves
```

- Gemini always handles ingredient parsing (even from JSON-LD, since ingredients are often plain strings like "1 1/2 tasses de farine tout usage, tamisée")
- Gemini translates to French if the source is in another language
- If the HTML fetch fails, user falls back to manual entry

## Grocery List Logic

- Generated from all recipes in the current week's meal plan
- Merge: group by ingredient name (case-insensitive) + unit, sum quantities
- Unit conflicts (e.g. "500g poulet" + "2 poitrines de poulet"): shown as separate lines, no unit conversion
- Ingredients with no quantity (e.g. "sel et poivre au goût"): listed once
- Output: plain text, one line per item
- "Copier" button copies to clipboard for pasting into Listonic

## UI / UX

### Navigation
Bottom tab bar (3 tabs):
- **Recettes** — recipe list
- **Plan** — weekly meal plan
- **Épicerie** — grocery list

### Screens

**Connexion** — password field + button. Shown once per device.

**Recettes** — list of recipe cards (name, tags, times). Search bar + tag filter. FAB to add new recipe.

**Nouvelle recette / Modifier recette** — toggle between "Saisie manuelle" and "Importer une URL". URL mode: paste URL → "Importer" → form auto-fills. Fields: nom, portions, temps de préparation, temps de cuisson, ingrédients (add/remove/reorder), étapes (add/remove/reorder), tags (autocomplete), notes. "Enregistrer" button.

**Vue recette (mode cuisine)** — clean, large text, high contrast. Ingredients at top, numbered steps below. Wake Lock API keeps screen on.

**Plan de la semaine** — 7-day grid, current week only. Slots: déjeuner, dîner, souper, collation. Tap slot → pick recipe. Tap filled slot → view or remove.

**Liste d'épicerie** — flat list from current plan. "Copier" button → plain text to clipboard.

## Visual Design — Potager

Direction: warm, earthy, organic — like a kitchen garden journal.

### Fonts
- **Display**: Fraunces (quirky variable serif with personality)
- **Body**: Literata (warm, readable serif)

### Color Palette (CSS Variables)
| Variable | Hex | Usage |
|----------|-----|-------|
| --parchment | #f5efe3 | Background |
| --parchment-deep | #e8dcc8 | Background gradient end |
| --ink | #2b2118 | Primary text |
| --ink-soft | #5c4d3e | Secondary text |
| --verde | #3a6b35 | Primary accent (green) |
| --verde-deep | #2d5016 | Active states |
| --terra | #c2633a | Warm accent (terracotta) |
| --terra-glow | #c2633a18 | Warm accent background |
| --sage | #8fa97e | Soft green |
| --sage-pale | #c5d4b8 | Dividers, subtle accents |

### Atmosphere
- Warm parchment base with subtle radial gradients (terracotta top-left, green bottom-right)
- Organic dot pattern overlay for texture
- Cards on white (#fff) with soft shadows, gradient top-border on hover (verde → sage → terra)
- Staggered reveal animations on page load (scale + translateY)

### Components
- Tags: rounded pills, green or terracotta backgrounds
- FAB: green, rounded-square (16px radius), morphs to circle on hover
- Section dividers: vine-like lines with centered label
- Bottom nav: 3 tabs, active state uses verde with subtle green background

### Reference
See `mockups/direction-3-potager.html` for the visual prototype.

## Deferred

- Realtime sync (Supabase realtime) — start with pull to refresh
- Direct Listonic integration
- Serving scaling with ingredient adjustment
- Meal plan history / week navigation
- Nutrition tracker sync
- Advanced search/filtering beyond tags
