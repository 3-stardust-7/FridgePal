-- FridgePal Database Schema for Supabase
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  age INTEGER,
  height REAL, -- in cm
  weight REAL, -- in kg
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  diet_type TEXT DEFAULT 'standard',
  health_goal TEXT DEFAULT 'maintain',
  allergies TEXT[] DEFAULT '{}',
  daily_calorie_goal INTEGER DEFAULT 2000,
  daily_protein_goal INTEGER DEFAULT 50,
  daily_carbs_goal INTEGER DEFAULT 250,
  daily_fat_goal INTEGER DEFAULT 65,
  daily_fiber_goal INTEGER DEFAULT 25,
  daily_water_goal INTEGER DEFAULT 2000,
  notifications_expiry BOOLEAN DEFAULT true,
  notifications_recipes BOOLEAN DEFAULT true,
  notifications_water BOOLEAN DEFAULT true,
  notifications_meals BOOLEAN DEFAULT true,
  streak INTEGER DEFAULT 0,
  items_saved INTEGER DEFAULT 0,
  recipes_made INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FRIDGE ITEMS TABLE
-- ============================================
CREATE TABLE public.fridge_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity REAL DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  amount_left REAL DEFAULT 100, -- percentage 0-100
  purchase_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  image_url TEXT,
  notes TEXT,
  -- Nutrition per serving
  calories INTEGER DEFAULT 0,
  protein REAL DEFAULT 0,
  carbs REAL DEFAULT 0,
  fat REAL DEFAULT 0,
  fiber REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECIPES TABLE
-- ============================================
CREATE TABLE public.recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  prep_time INTEGER, -- in minutes
  cook_time INTEGER,
  servings INTEGER DEFAULT 2,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  cuisine TEXT,
  tags TEXT[] DEFAULT '{}',
  ingredients JSONB NOT NULL, -- [{name, amount, unit, optional}]
  instructions TEXT[] NOT NULL,
  -- Nutrition per serving
  calories INTEGER DEFAULT 0,
  protein REAL DEFAULT 0,
  carbs REAL DEFAULT 0,
  fat REAL DEFAULT 0,
  fiber REAL DEFAULT 0,
  -- Metadata
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER SAVED RECIPES (junction table)
-- ============================================
CREATE TABLE public.saved_recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- ============================================
-- MEALS LOG TABLE (Nutrition Tracking)
-- ============================================
CREATE TABLE public.meals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  name TEXT NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  -- Nutrition
  calories INTEGER DEFAULT 0,
  protein REAL DEFAULT 0,
  carbs REAL DEFAULT 0,
  fat REAL DEFAULT 0,
  fiber REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WATER INTAKE TABLE
-- ============================================
CREATE TABLE public.water_intake (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  amount INTEGER NOT NULL, -- in ml
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY SUMMARY TABLE (cached daily stats)
-- ============================================
CREATE TABLE public.daily_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  total_calories INTEGER DEFAULT 0,
  total_protein REAL DEFAULT 0,
  total_carbs REAL DEFAULT 0,
  total_fat REAL DEFAULT 0,
  total_fiber REAL DEFAULT 0,
  total_water INTEGER DEFAULT 0,
  meals_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- INDEXES for better query performance
-- ============================================
CREATE INDEX idx_fridge_items_user ON public.fridge_items(user_id);
CREATE INDEX idx_fridge_items_expiry ON public.fridge_items(expiry_date);
CREATE INDEX idx_fridge_items_category ON public.fridge_items(category);
CREATE INDEX idx_meals_user_date ON public.meals(user_id, date);
CREATE INDEX idx_water_user_date ON public.water_intake(user_id, date);
CREATE INDEX idx_saved_recipes_user ON public.saved_recipes(user_id);
CREATE INDEX idx_recipes_tags ON public.recipes USING GIN(tags);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fridge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Fridge Items: users can only access their own items
CREATE POLICY "Users can view own fridge items" ON public.fridge_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fridge items" ON public.fridge_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fridge items" ON public.fridge_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fridge items" ON public.fridge_items
  FOR DELETE USING (auth.uid() = user_id);

-- Recipes: public recipes visible to all, user can manage their own
CREATE POLICY "Anyone can view public recipes" ON public.recipes
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can insert recipes" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own recipes" ON public.recipes
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own recipes" ON public.recipes
  FOR DELETE USING (auth.uid() = created_by);

-- Saved Recipes
CREATE POLICY "Users can view own saved recipes" ON public.saved_recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save recipes" ON public.saved_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave recipes" ON public.saved_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Meals
CREATE POLICY "Users can view own meals" ON public.meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON public.meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON public.meals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON public.meals
  FOR DELETE USING (auth.uid() = user_id);

-- Water Intake
CREATE POLICY "Users can view own water intake" ON public.water_intake
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water intake" ON public.water_intake
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water intake" ON public.water_intake
  FOR DELETE USING (auth.uid() = user_id);

-- Daily Summaries
CREATE POLICY "Users can view own daily summaries" ON public.daily_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily summaries" ON public.daily_summaries
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_fridge_items_updated_at
  BEFORE UPDATE ON public.fridge_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- SEED DATA: Sample Recipes
-- ============================================
INSERT INTO public.recipes (name, description, prep_time, cook_time, servings, difficulty, cuisine, tags, ingredients, instructions, calories, protein, carbs, fat, fiber, is_public, created_by)
VALUES
  (
    'Classic Omelette',
    'A fluffy, protein-packed breakfast omelette with vegetables',
    5, 10, 1, 'easy', 'French',
    ARRAY['quick', 'breakfast', 'high-protein', 'keto'],
    '[{"name": "eggs", "amount": 3, "unit": "pcs"}, {"name": "milk", "amount": 2, "unit": "tbsp"}, {"name": "butter", "amount": 1, "unit": "tbsp"}, {"name": "cheese", "amount": 30, "unit": "g", "optional": true}, {"name": "salt", "amount": 1, "unit": "pinch"}, {"name": "pepper", "amount": 1, "unit": "pinch"}]',
    ARRAY['Beat eggs with milk, salt and pepper', 'Heat butter in a non-stick pan over medium heat', 'Pour egg mixture and let it set for 30 seconds', 'Gently push edges toward center, tilting pan', 'Add cheese if using, fold omelette in half', 'Slide onto plate and serve immediately'],
    350, 21, 2, 28, 0,
    true, NULL
  ),
  (
    'Greek Salad',
    'Fresh and healthy Mediterranean salad',
    15, 0, 2, 'easy', 'Greek',
    ARRAY['quick', 'healthy', 'vegetarian', 'low-carb'],
    '[{"name": "cucumber", "amount": 1, "unit": "pcs"}, {"name": "tomatoes", "amount": 2, "unit": "pcs"}, {"name": "red onion", "amount": 0.5, "unit": "pcs"}, {"name": "feta cheese", "amount": 100, "unit": "g"}, {"name": "olives", "amount": 50, "unit": "g"}, {"name": "olive oil", "amount": 3, "unit": "tbsp"}, {"name": "lemon juice", "amount": 1, "unit": "tbsp"}]',
    ARRAY['Chop cucumber, tomatoes and onion into chunks', 'Add olives and crumbled feta cheese', 'Drizzle with olive oil and lemon juice', 'Season with salt, pepper and oregano', 'Toss gently and serve fresh'],
    280, 8, 12, 22, 3,
    true, NULL
  ),
  (
    'Chicken Stir Fry',
    'Quick and healthy Asian-style chicken with vegetables',
    15, 15, 3, 'easy', 'Asian',
    ARRAY['quick', 'healthy', 'high-protein', 'dinner'],
    '[{"name": "chicken breast", "amount": 400, "unit": "g"}, {"name": "broccoli", "amount": 200, "unit": "g"}, {"name": "bell pepper", "amount": 1, "unit": "pcs"}, {"name": "carrots", "amount": 2, "unit": "pcs"}, {"name": "soy sauce", "amount": 3, "unit": "tbsp"}, {"name": "garlic", "amount": 3, "unit": "cloves"}, {"name": "ginger", "amount": 1, "unit": "inch"}, {"name": "vegetable oil", "amount": 2, "unit": "tbsp"}]',
    ARRAY['Cut chicken into bite-sized pieces', 'Chop all vegetables', 'Heat oil in wok over high heat', 'Stir-fry chicken until golden, set aside', 'Stir-fry vegetables for 3-4 minutes', 'Add garlic and ginger, cook 30 seconds', 'Return chicken, add soy sauce', 'Toss everything together and serve with rice'],
    320, 35, 15, 12, 4,
    true, NULL
  ),
  (
    'Overnight Oats',
    'Easy make-ahead breakfast with oats and fruit',
    10, 0, 1, 'easy', 'American',
    ARRAY['quick', 'breakfast', 'healthy', 'meal-prep', 'vegetarian'],
    '[{"name": "oats", "amount": 50, "unit": "g"}, {"name": "milk", "amount": 150, "unit": "ml"}, {"name": "yogurt", "amount": 50, "unit": "g"}, {"name": "honey", "amount": 1, "unit": "tbsp"}, {"name": "banana", "amount": 0.5, "unit": "pcs"}, {"name": "berries", "amount": 50, "unit": "g"}]',
    ARRAY['Combine oats, milk, yogurt and honey in a jar', 'Stir well to combine', 'Cover and refrigerate overnight (or at least 4 hours)', 'In the morning, top with sliced banana and berries', 'Enjoy cold or microwave for 1-2 minutes if preferred'],
    380, 12, 65, 8, 6,
    true, NULL
  ),
  (
    'Grilled Salmon',
    'Simple grilled salmon with lemon and herbs',
    10, 15, 2, 'medium', 'Mediterranean',
    ARRAY['healthy', 'high-protein', 'keto', 'dinner', 'omega-3'],
    '[{"name": "salmon fillet", "amount": 400, "unit": "g"}, {"name": "lemon", "amount": 1, "unit": "pcs"}, {"name": "olive oil", "amount": 2, "unit": "tbsp"}, {"name": "garlic", "amount": 2, "unit": "cloves"}, {"name": "dill", "amount": 2, "unit": "tbsp"}, {"name": "salt", "amount": 1, "unit": "tsp"}, {"name": "pepper", "amount": 0.5, "unit": "tsp"}]',
    ARRAY['Preheat grill or pan to medium-high heat', 'Mix olive oil, minced garlic, lemon zest, dill, salt and pepper', 'Brush salmon with the mixture', 'Grill skin-side down for 4-5 minutes', 'Flip and cook another 3-4 minutes until done', 'Squeeze fresh lemon juice and serve'],
    420, 46, 2, 25, 0,
    true, NULL
  ),
  (
    'Vegetable Soup',
    'Hearty and nutritious homemade vegetable soup',
    20, 30, 4, 'easy', 'International',
    ARRAY['healthy', 'vegetarian', 'vegan', 'low-calorie', 'lunch'],
    '[{"name": "carrots", "amount": 3, "unit": "pcs"}, {"name": "celery", "amount": 3, "unit": "stalks"}, {"name": "onion", "amount": 1, "unit": "pcs"}, {"name": "potatoes", "amount": 2, "unit": "pcs"}, {"name": "tomatoes", "amount": 2, "unit": "pcs"}, {"name": "vegetable broth", "amount": 1, "unit": "L"}, {"name": "garlic", "amount": 3, "unit": "cloves"}, {"name": "olive oil", "amount": 2, "unit": "tbsp"}]',
    ARRAY['Dice all vegetables into small cubes', 'Heat olive oil in a large pot', 'Sauté onion and garlic until soft', 'Add carrots, celery and potatoes', 'Cook for 5 minutes, stirring occasionally', 'Add tomatoes and vegetable broth', 'Bring to boil, then simmer for 25 minutes', 'Season with salt, pepper and herbs'],
    180, 5, 32, 5, 6,
    true, NULL
  ),
  (
    'Avocado Toast',
    'Trendy and nutritious breakfast or snack',
    10, 5, 1, 'easy', 'Modern',
    ARRAY['quick', 'breakfast', 'vegetarian', 'healthy'],
    '[{"name": "bread", "amount": 2, "unit": "slices"}, {"name": "avocado", "amount": 1, "unit": "pcs"}, {"name": "eggs", "amount": 2, "unit": "pcs", "optional": true}, {"name": "cherry tomatoes", "amount": 6, "unit": "pcs"}, {"name": "lemon juice", "amount": 1, "unit": "tsp"}, {"name": "red pepper flakes", "amount": 1, "unit": "pinch"}]',
    ARRAY['Toast bread until golden and crispy', 'Cut avocado in half, remove pit', 'Mash avocado with lemon juice, salt and pepper', 'Spread mashed avocado on toast', 'Poach or fry eggs if using', 'Top with halved cherry tomatoes', 'Sprinkle with red pepper flakes', 'Serve immediately'],
    420, 14, 35, 26, 10,
    true, NULL
  ),
  (
    'Pasta Primavera',
    'Colorful pasta with fresh spring vegetables',
    15, 20, 4, 'easy', 'Italian',
    ARRAY['vegetarian', 'dinner', 'family-friendly'],
    '[{"name": "pasta", "amount": 400, "unit": "g"}, {"name": "zucchini", "amount": 1, "unit": "pcs"}, {"name": "bell pepper", "amount": 2, "unit": "pcs"}, {"name": "cherry tomatoes", "amount": 200, "unit": "g"}, {"name": "garlic", "amount": 4, "unit": "cloves"}, {"name": "parmesan", "amount": 50, "unit": "g"}, {"name": "olive oil", "amount": 4, "unit": "tbsp"}, {"name": "basil", "amount": 10, "unit": "leaves"}]',
    ARRAY['Cook pasta according to package directions', 'Slice zucchini and bell peppers', 'Halve cherry tomatoes', 'Sauté garlic in olive oil until fragrant', 'Add vegetables and cook for 5-7 minutes', 'Toss with drained pasta', 'Add parmesan and fresh basil', 'Season and serve with extra cheese'],
    480, 16, 72, 14, 5,
    true, NULL
  );

-- Success message
SELECT 'FridgePal database schema created successfully!' AS status;
