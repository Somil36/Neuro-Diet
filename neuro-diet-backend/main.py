import random
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from models import SessionLocal, FoodMatrix, ExerciseMatrix

app = FastAPI(title="Neuro-Diet Brain API")

# Add CORS so React Native Web can access it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserProfile(BaseModel):
    cognitive_goal: str
    physical_goal: str
    is_vegetarian: bool
    bmi: float
    activity_level: str = "Moderate"
    workout_experience: str = "Intermediate"
    sleep_quality: str = "Fair"
    stress_level: str = "Medium"
    age: int = 25
    gender: str = "Prefer not to say"
    cycle_phase: Optional[str] = None

class ProtocolRequest(BaseModel):
    user_profile: UserProfile


def rank_by_score(candidates: list, metric_fns: list):
    """Min-max normalize each metric across candidates, then rank by the
    summed score. Shared by /protocol and /exercise-protocol so both use a
    genuine multi-metric composite instead of a single dominant sort key."""
    def normalize(values):
        lo, hi = min(values), max(values)
        spread = hi - lo
        return [(v - lo) / spread if spread else 0.5 for v in values]

    scores = [normalize([fn(c) for c in candidates]) for fn in metric_fns]
    combined = [sum(s[i] for s in scores) for i in range(len(candidates))]
    return [c for c, _ in sorted(zip(candidates, combined), key=lambda t: t[1], reverse=True)]


COGNITIVE_COMPOUND_MAP = {
    "Enhance Focus": "L-Theanine",
    "Improve Sleep Quality": "Magnesium",
    "Reduce Brain Fog": "Omega-3",
    "Stress Reduction": "Zinc",
}


def _pick_primary_compound(compound_values: Dict[str, float], cognitive_goal: str):
    """Pick which tracked compound to highlight for a food/meal.

    Prefers the compound tied to the user's cognitive goal, but falls back
    to whichever tracked compound is actually present in the largest amount
    otherwise. Without this fallback, any non-tea food under "Enhance Focus"
    would be labeled "rich in L-Theanine, delivering 0mg" - L-Theanine is
    essentially tea-exclusive, so that's not a data gap to backfill, just a
    bad default label for foods that plainly don't contain it.
    """
    preferred = COGNITIVE_COMPOUND_MAP.get(cognitive_goal)
    if preferred and compound_values.get(preferred, 0) > 0:
        return preferred, compound_values[preferred]
    return max(compound_values.items(), key=lambda kv: kv[1])

@app.post("/api/v1/protocol")
def generate_protocol(request: ProtocolRequest):
    profile = request.user_profile
    db = SessionLocal()
    
    try:
        query = db.query(FoodMatrix)
        
        # 1. Hard Filters
        # STRICT INDIAN ENFORCEMENT: Never show foreign non-staple foods (e.g. Lake Trout)
        query = query.filter(FoodMatrix.is_indian_staple == True)
        
        if profile.is_vegetarian:
            query = query.filter(FoodMatrix.is_vegetarian == True)
            
        if profile.physical_goal in ["Fat Loss", "Weight Goal (Maintain)"]:
            query = query.filter(FoodMatrix.calories < 150) # Caloric deficit constraint
            
        # 2. Dynamic Dual-Heuristic Scoring Engine
        # (is_indian_staple is already a hard filter above, so it's a constant
        # here and dropped as a sort key - sorting by a constant is a no-op.)
        physical_metric = {
            "Muscle Gain": lambda f: f.protein_g,
            "Stamina/Endurance": lambda f: f.carbs_g,
        }.get(profile.physical_goal, lambda f: 0.0)

        cognitive_metric = {
            "Enhance Focus": lambda f: f.l_theanine_mg,
            "Improve Sleep Quality": lambda f: f.magnesium_mg,
            "Reduce Brain Fog": lambda f: f.omega_3_mg + f.flavonoids_mg,
            "Stress Reduction": lambda f: f.zinc_mg + f.l_theanine_mg,
        }.get(profile.cognitive_goal, lambda f: 0.0)

        # A plain multi-column SQL ORDER BY (macro first, compound second) would
        # make the compound sort key nearly irrelevant, since ties on a
        # continuous float column like protein_g essentially never happen - the
        # cognitive goal would never actually affect which foods get picked.
        # rank_by_score min-max normalizes both metrics then ranks by their
        # combined score, keeping this a genuine dual-heuristic (physical +
        # cognitive) rather than only ever the physical one.
        candidates = query.all()
        ranked = rank_by_score(candidates, [physical_metric, cognitive_metric])
        top_ingredients = ranked[:10]

        # Choosing "Non-Vegetarian" only lifted the vegetarian-only filter
        # above - it never gave non-veg items any edge in the ranking. With
        # only ~6 non-veg Indian staples (all fish) against ~80 vegetarian
        # ones, and legumes already competitive on raw protein_g, non-veg
        # items never naturally out-ranked them into the top slots, so the
        # returned plan was identical regardless of this choice. Guarantee a
        # couple of the highest-ranked available non-veg items land within
        # RESULT_SIZE (the slice actually returned below) so the choice
        # visibly changes the plan.
        RESULT_SIZE = 5
        if not profile.is_vegetarian:
            NONVEG_MIN_SLOTS = 2
            included_ids = {f.id for f in top_ingredients}
            top_nonveg = [f for f in ranked if not f.is_vegetarian and f.id not in included_ids][:NONVEG_MIN_SLOTS]
            if top_nonveg:
                keep_count = max(0, RESULT_SIZE - len(top_nonveg))
                top_ingredients = top_ingredients[:keep_count] + top_nonveg + top_ingredients[keep_count:]

        ingredients_list = []
        ingredient_names = []
        
        # 3. Map to Ingredients List
        for item in top_ingredients:
            ingredient_names.append(item.name.lower())

            primary_compound, amount = _pick_primary_compound({
                "L-Theanine": item.l_theanine_mg,
                "Magnesium": item.magnesium_mg,
                "Omega-3": item.omega_3_mg,
                "Flavonoids": item.flavonoids_mg,
                "Zinc": item.zinc_mg,
            }, profile.cognitive_goal)

            ingredients_list.append({
                "id": item.id,
                "name": item.name,
                "primary_compound": primary_compound,
                "amount_mg": round(amount, 2),
                "is_staple": item.is_indian_staple,
                "macros": {
                    "calories": round(item.calories, 1),
                    "protein_g": round(item.protein_g, 1),
                    "carbs_g": round(item.carbs_g, 1),
                    "fats_g": round(item.fats_g, 1)
                }
            })
            
        # 4. Recipe Synthesis Engine
        INDIAN_RECIPES = [
            {"name": "Palak Paneer", "core": ["spinach", "paneer", "garlic", "coriander"]},
            {"name": "Dal Tadka", "core": ["lentil", "garlic", "cumin", "turmeric"]},
            {"name": "Mackerel Curry (Machha Jhola)", "core": ["mackerel", "turmeric", "coriander", "mustard"]},
            {"name": "Chana Masala", "core": ["chickpea", "ginger", "garlic", "cumin"]},
            {"name": "Rajma Chawal", "core": ["kidney bean", "rice", "garlic", "ginger"]},
            {"name": "Bhindi Masala", "core": ["bhindi", "cumin", "turmeric"]},
            {"name": "Baingan Bharta", "core": ["eggplant", "garlic", "coriander"]},
            {"name": "Moong Dal Chilla", "core": ["mung", "ginger", "coriander"]},
            {"name": "Coconut Fish Curry", "core": ["rohu", "coconut", "turmeric"]},
            {"name": "Spiced Buttermilk (Chaas)", "core": ["cumin", "coriander"]}
        ]
        
        meals_list = []
        for recipe in INDIAN_RECIPES:
            # Score the recipe based on how many recommended ingredients it contains
            score = sum(1 for core_ing in recipe["core"] if any(core_ing in ing_name for ing_name in ingredient_names))
            if score > 0:
                # Find the matched ingredients to calculate combined macros and compounds
                matched_ings = [item for item in top_ingredients if any(core_ing in item.name.lower() for core_ing in recipe["core"])]
                
                total_cals = sum(item.calories for item in matched_ings) * 1.5
                total_prot = sum(item.protein_g for item in matched_ings) * 1.5
                total_carbs = sum(item.carbs_g for item in matched_ings) * 1.5
                total_fats = sum(item.fats_g for item in matched_ings) * 1.5

                primary_comp, total_comp_mg = _pick_primary_compound({
                    "L-Theanine": sum(item.l_theanine_mg for item in matched_ings),
                    "Magnesium": sum(item.magnesium_mg for item in matched_ings),
                    "Omega-3": sum(item.omega_3_mg for item in matched_ings),
                    "Flavonoids": sum(item.flavonoids_mg for item in matched_ings),
                    "Zinc": sum(item.zinc_mg for item in matched_ings),
                }, profile.cognitive_goal)

                meals_list.append({
                    "id": f"meal_{recipe['name'].replace(' ', '_').lower()}",
                    "name": recipe["name"],
                    "score": score,
                    "primary_compound": primary_comp,
                    "amount_mg": round(total_comp_mg, 2),
                    "macros": {
                        "calories": round(total_cals, 1),
                        "protein_g": round(total_prot, 1),
                        "carbs_g": round(total_carbs, 1),
                        "fats_g": round(total_fats, 1)
                    },
                    "core_ingredients": recipe["core"]
                })
                
        # Sort meals by score
        meals_list = sorted(meals_list, key=lambda x: x["score"], reverse=True)[:3]
        
        # If no meals matched, return some generic ones
        if not meals_list:
            meals_list.append({
                "id": "meal_generic_dal",
                "name": "Healing Dal Bowl",
                "score": 1,
                "primary_compound": "Micronutrients",
                "amount_mg": 100,
                "macros": {"calories": 300, "protein_g": 15, "carbs_g": 40, "fats_g": 5},
                "core_ingredients": ["lentils", "spices"]
            })
            
        return {
            "status": "success",
            "data": {
                "ingredients": ingredients_list[:RESULT_SIZE],
                "meals": meals_list
            }
        }
    finally:
        db.close()


WORKOUT_LEVEL_CAP = {
    "Beginner": {"beginner"},
    "Intermediate": {"beginner", "intermediate"},
    "Advanced": {"beginner", "intermediate", "expert"},
}


def _serialize_exercise(e: ExerciseMatrix) -> Dict[str, Any]:
    return {
        "id": e.id,
        "name": e.name,
        "category": e.category,
        "equipment": e.equipment,
        "level": e.level,
        "primary_muscles": e.primary_muscles,
        "instructions": e.instructions,
        "is_mindfulness": e.is_mindfulness,
        "duration_min": e.duration_min,
    }


@app.post("/api/v1/exercise-protocol")
def generate_exercise_protocol(request: ProtocolRequest):
    profile = request.user_profile
    db = SessionLocal()

    try:
        allowed_levels = WORKOUT_LEVEL_CAP.get(profile.workout_experience, WORKOUT_LEVEL_CAP["Intermediate"])

        # Physical exercises: filter to ones tagged for this physical goal and
        # within the user's experience level, prioritize compound movements
        # (train more muscle per exercise), shuffle within that tier so
        # repeated requests surface variety instead of the same fixed list.
        physical_pool = db.query(ExerciseMatrix).filter(ExerciseMatrix.is_mindfulness == False).all()
        physical_candidates = [
            e for e in physical_pool
            if e.level in allowed_levels and profile.physical_goal in (e.physical_goal_tags or [])
        ]
        random.shuffle(physical_candidates)
        physical_candidates.sort(key=lambda e: e.mechanic != 'compound')
        top_physical = physical_candidates[:8]

        # Mindfulness exercises: filter to ones tagged for this cognitive goal.
        # During the menstrual/luteal cycle phases, bias toward shorter/gentler
        # sessions rather than requiring the user to guess what's manageable.
        mindfulness_pool = db.query(ExerciseMatrix).filter(ExerciseMatrix.is_mindfulness == True).all()
        mindfulness_candidates = [
            e for e in mindfulness_pool
            if profile.cognitive_goal in (e.cognitive_tags or [])
        ]
        if profile.cycle_phase in ("menstrual", "luteal"):
            mindfulness_candidates.sort(key=lambda e: e.duration_min or 0)
        else:
            random.shuffle(mindfulness_candidates)
        top_mindfulness = mindfulness_candidates[:5]

        return {
            "status": "success",
            "data": {
                "physical_exercises": [_serialize_exercise(e) for e in top_physical],
                "mindfulness_exercises": [_serialize_exercise(e) for e in top_mindfulness],
            }
        }
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8090)
