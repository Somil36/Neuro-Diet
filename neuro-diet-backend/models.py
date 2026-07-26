from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, JSON
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

class FoodMatrix(Base):
    __tablename__ = 'food_matrix'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, index=True, nullable=False)
    
    # Dietary Tags
    is_vegetarian = Column(Boolean, default=False)
    is_vegan = Column(Boolean, default=False)
    dietary_tags = Column(JSON) # e.g. ["dairy_free", "gluten_free"]
    is_indian_staple = Column(Boolean, default=False)

    # USDA Macros (per 100g)
    calories = Column(Float, default=0.0)
    protein_g = Column(Float, default=0.0)
    carbs_g = Column(Float, default=0.0)
    fats_g = Column(Float, default=0.0)

    # FooDB Neuro-Active Compounds (per 100g)
    omega_3_mg = Column(Float, default=0.0)
    flavonoids_mg = Column(Float, default=0.0)
    zinc_mg = Column(Float, default=0.0)
    magnesium_mg = Column(Float, default=0.0)
    l_theanine_mg = Column(Float, default=0.0)


class ExerciseMatrix(Base):
    __tablename__ = 'exercise_matrix'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, index=True, nullable=False)

    # Physical exercises (from free-exercise-db) - null/empty for mindfulness entries
    category = Column(String)
    equipment = Column(String)
    level = Column(String)  # beginner | intermediate | expert
    force = Column(String)
    mechanic = Column(String)
    primary_muscles = Column(JSON)
    secondary_muscles = Column(JSON)
    instructions = Column(JSON)

    # Mindfulness/mental exercises (hand-curated) - null for physical entries
    is_mindfulness = Column(Boolean, default=False)
    cognitive_tags = Column(JSON)  # which cognitive goals this serves
    duration_min = Column(Float)

    # Which physical goals this exercise serves (both kinds can have this,
    # though it's mainly populated for physical entries)
    physical_goal_tags = Column(JSON)

# SQLite for local dev, easily swappable to PostgreSQL later
DATABASE_URL = "sqlite:///./neuro_diet.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
    print("Database schema generated successfully.")
