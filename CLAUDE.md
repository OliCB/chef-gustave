# Chef Gustave

Meal planning PWA for a 2-person francophone household.

## Key Rules

- **French** for all UI text and data. **English** for code.
- Do not implement anything unless explicitly asked.
- Québécois French: déjeuner / dîner / souper (not petit-déjeuner / déjeuner / dîner).

## Stack

SvelteKit (PWA) · Supabase (PostgreSQL) · Vercel · Claude API · Edamam API

## Frontend Design

Make creative, distinctive frontends that surprise and delight. Avoid generic "AI slop" aesthetic.

- **Typography**: Choose beautiful, unique fonts. Never use Inter, Roboto, Arial, system fonts, or Space Grotesk. Pick distinctive choices that fit the context.
- **Color & Theme**: Commit to a cohesive aesthetic via CSS variables. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.
- **Backgrounds**: Create atmosphere and depth rather than solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

## Docs

- `docs/REQUIREMENTS.md` — product requirements
- `docs/DESIGN.md` — solution design (data model, architecture, UI, flows)
- `mockups/direction-3-potager.html` — visual direction (Potager theme)
