# Chef Gustave - Requirements

## Overview

A meal planning app for a household of 2. Users interact via mobile phones. The goal is to choose recipes for the week, compile a grocery list, and consult recipes while cooking. Designed to be as simple and cheap as possible.

## Users & Access

- 2 users, mobile-first
- Fully shared: same recipe library, same meal plan
- No authentication complexity needed (trusted household)

## Core Features

### Recipe Library

- **CRUD** — Create, read, update, delete recipes
- **Manual entry** — Ingredients, steps, servings, prep/cook time
- **URL import** — Extract recipe from a web page:
  - Use structured data (JSON-LD / schema.org) when available
  - LLM-based best-effort extraction as fallback
  - Produces a draft that the user validates and edits before saving
- **Tagging** — User-defined freeform tags with autocomplete from existing tags
- **Nutritional info** — Per recipe, fetched via API (Edamam or FatSecret). Display only, no tracker sync.

### Weekly Meal Plan

- Single shared plan, either user can edit
- Assign recipes to days and meals (breakfast, lunch, dinner, snack)
- Dinner is the primary use case; other meals included for completeness
- No meal plan history

### Grocery List

- Auto-generated from the current weekly plan
- Duplicates merged across recipes (e.g., two recipes needing onions = combined quantity)
- Flat list (no aisle/section categorization — Listonic handles that)
- Manual copy to Listonic for now

### Recipe Consultation

- Clean, mobile-friendly view optimized for cooking
- Clear ingredient list and step-by-step instructions

## Nice-to-Have (Deferred)

- Direct Listonic integration (push grocery list via API)
- Serving scaling with ingredient adjustment
- Search and filtering beyond tags
- Meal plan history ("what did we eat 3 weeks ago")
- Nutrition tracker sync (MyFitnessPal, Cronometer, etc.)

## Non-Goals

- Complex authentication or user management
- Grocery aisle categorization (Listonic handles this)
- Multi-household / multi-tenant support

## Integration Points

| Integration | Status | Notes |
|-------------|--------|-------|
| Edamam or FatSecret API | Core | Nutritional info per recipe |
| Recipe URL parsing (JSON-LD + LLM fallback) | Core | Extract recipes from web pages |
| Listonic | Nice-to-have | Direct push; manual copy for now |
| MyFitnessPal / Cronometer | Deferred | API access is restricted or partner-only |

## Key Decisions

- **Nutritional info**: display in-app only, no sync to external trackers
- **MFP integration deferred**: API is effectively closed; alternatives (FatSecret, Cronometer) have limited public access too
- **Tags over categories**: freeform tags with autocomplete, no rigid taxonomy
- **No history**: weekly plan is ephemeral, replaced each week
