from models import SessionLocal, FoodMatrix

def generate_neural_protocol(goal: str, is_vegetarian: bool, target_calories: int):
    """
    V1 Heuristics Engine based on NHANES evidence-informed associations.
    """
    print(f"Generating Protocol - Goal: {goal}, Veg: {is_vegetarian}, Calories: {target_calories}")
    db = SessionLocal()
    
    query = db.query(FoodMatrix)
    
    # 1. Apply strict dietary exclusions first (The Vegetarian Filter)
    if is_vegetarian:
        query = query.filter(FoodMatrix.is_vegetarian == True)

    # 2. Apply Cognitive Goal Heuristics (The "Brain" logic)
    if goal == "Enhance Focus":
        # Target high L-Theanine
        query = query.order_by(FoodMatrix.is_indian_staple.desc(), FoodMatrix.l_theanine_mg.desc())
    elif goal == "Improve Sleep Quality":
        # Target high Magnesium
        query = query.order_by(FoodMatrix.is_indian_staple.desc(), FoodMatrix.magnesium_mg.desc())
    elif goal == "Reduce Brain Fog":
        # Target Omega-3s and Flavonoids
        query = query.order_by(FoodMatrix.is_indian_staple.desc(), FoodMatrix.omega_3_mg.desc(), FoodMatrix.flavonoids_mg.desc())

    # Get top ingredients that fit the profile
    top_ingredients = query.limit(5).all()
    
    protocol = []
    for food in top_ingredients:
        protocol.append({
            "name": food.name,
            "tags": food.dietary_tags
        })
        
    db.close()
    return protocol

if __name__ == "__main__":
    # Test the engine locally
    result = generate_neural_protocol("Reduce Brain Fog", is_vegetarian=True, target_calories=2100)
    print("Recommended Ingredients:", result)
