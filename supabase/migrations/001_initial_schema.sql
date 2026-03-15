-- Chef Gustave — Initial Schema

-- Ingredients (normalized, shared across recipes)
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Recipes
create table recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  servings int,
  prep_time int,        -- minutes
  cook_time int,        -- minutes
  source_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recipe ↔ Ingredient join with quantity/unit/order
create table recipe_ingredients (
  recipe_id uuid not null references recipes(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity decimal,
  unit text,
  position int not null default 0,
  primary key (recipe_id, ingredient_id)
);

-- Steps (ordered instructions)
create table steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  instruction text not null,
  position int not null default 0
);

-- Tags (freeform)
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Recipe ↔ Tag join
create table recipe_tags (
  recipe_id uuid not null references recipes(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (recipe_id, tag_id)
);

-- Nutrition info (1:1 with recipe)
create table nutrition_info (
  recipe_id uuid primary key references recipes(id) on delete cascade,
  calories decimal,
  protein decimal,
  carbs decimal,
  fat decimal,
  fiber decimal
);

-- Meal plan entries
create table meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  meal_type text not null check (meal_type in ('déjeuner', 'dîner', 'souper', 'collation')),
  recipe_id uuid not null references recipes(id) on delete cascade
);

-- Indexes
create index idx_recipe_ingredients_recipe on recipe_ingredients(recipe_id);
create index idx_steps_recipe on steps(recipe_id);
create index idx_recipe_tags_recipe on recipe_tags(recipe_id);
create index idx_meal_plan_date on meal_plan_entries(date);

-- Auto-update updated_at on recipes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
  before update on recipes
  for each row execute function update_updated_at();
