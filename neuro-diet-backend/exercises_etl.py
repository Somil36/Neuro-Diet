import pandas as pd
from models import SessionLocal, ExerciseMatrix, init_db
from mindfulness_supplement import MINDFULNESS_SUPPLEMENT

init_db()

EXERCISE_DB_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"

# Muscle-building/strength categories -> Muscle Gain. Explosive/aerobic
# categories -> Stamina/Endurance and Fat Loss (both benefit from
# cardio-style conditioning). Stretching is framed as a low-intensity
# active-recovery complement to Fat Loss work rather than its own goal.
STRENGTH_CATEGORIES = {'strength', 'powerlifting', 'olympic weightlifting', 'strongman'}
CARDIO_CATEGORIES = {'cardio', 'plyometrics'}


def physical_goal_tags_for(category: str, equipment) -> list[str]:
    tags = []
    if category in STRENGTH_CATEGORIES:
        tags.append('Muscle Gain')
        if equipment in ('body only', None):
            tags.append('Fat Loss')  # bodyweight strength doubles as a fat-loss circuit option
    if category in CARDIO_CATEGORIES:
        tags.extend(['Stamina/Endurance', 'Fat Loss'])
    if category == 'stretching':
        tags.append('Fat Loss')
    return tags


def run_exercise_etl():
    print("Starting Exercise ETL Pipeline...")

    print("1. Fetching free-exercise-db (~870 physical exercises)...")
    exercises = pd.read_json(EXERCISE_DB_URL)

    records = []
    for _, row in exercises.iterrows():
        records.append({
            "name": row['name'],
            "category": row['category'],
            "equipment": row['equipment'] if pd.notna(row['equipment']) else None,
            "level": row['level'],
            "force": row['force'] if pd.notna(row['force']) else None,
            "mechanic": row['mechanic'] if pd.notna(row['mechanic']) else None,
            "primary_muscles": row['primaryMuscles'],
            "secondary_muscles": row['secondaryMuscles'],
            "instructions": row['instructions'],
            "is_mindfulness": False,
            "cognitive_tags": [],
            "duration_min": None,
            "physical_goal_tags": physical_goal_tags_for(row['category'], row['equipment'] if pd.notna(row['equipment']) else None),
        })

    print("2. Adding curated mindfulness/mental exercises...")
    for item in MINDFULNESS_SUPPLEMENT:
        records.append({
            "name": item["name"],
            "category": "mindfulness",
            "equipment": None,
            "level": "beginner",
            "force": None,
            "mechanic": None,
            "primary_muscles": [],
            "secondary_muscles": [],
            "instructions": item["instructions"],
            "is_mindfulness": True,
            "cognitive_tags": item["cognitive_tags"],
            "duration_min": item["duration_min"],
            "physical_goal_tags": [],
        })

    print("3. Bulk inserting to database...")
    db = SessionLocal()
    db.query(ExerciseMatrix).delete()
    db.bulk_insert_mappings(ExerciseMatrix, records)
    db.commit()
    db.close()

    print(f"Exercise ETL Completed! {len(records)} exercises loaded "
          f"({len(records) - len(MINDFULNESS_SUPPLEMENT)} physical + {len(MINDFULNESS_SUPPLEMENT)} mindfulness).")


if __name__ == "__main__":
    run_exercise_etl()
