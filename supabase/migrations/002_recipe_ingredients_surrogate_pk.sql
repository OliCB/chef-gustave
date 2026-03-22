-- Replace composite PK (recipe_id, ingredient_id) with a surrogate UUID key
-- This allows the same ingredient to appear multiple times in a recipe

alter table recipe_ingredients drop constraint recipe_ingredients_pkey;

alter table recipe_ingredients add column id uuid not null default gen_random_uuid();

alter table recipe_ingredients add primary key (id);
