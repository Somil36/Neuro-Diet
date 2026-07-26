import re
import pandas as pd
import os
from models import SessionLocal, FoodMatrix, init_db
from fuzzywuzzy import process
from indian_foods_supplement import INDIAN_FOODS_SUPPLEMENT

init_db()

# USDA nutrient IDs are unambiguous (unlike nutrient *names* - e.g. two different
# rows are both literally named "Energy", one in KCAL and one in kJ, which used
# to get silently averaged together by a name-based pivot).
USDA_NUTRIENT_IDS = {
    1008: 'Energy',                          # KCAL
    1003: 'Protein',                         # G
    1004: 'Total lipid (fat)',               # G
    1005: 'Carbohydrate, by difference',     # G
    1090: 'Magnesium',                       # MG
    1095: 'Zinc',                            # MG
    1404: 'ALA',                             # G  (18:3 n-3, omega-3)
    1272: 'DHA',                             # G  (22:6 n-3, omega-3)
}

# FooDB doesn't track Magnesium/Zinc/ALA/DHA under matching names (plain
# "Magnesium" isn't a compound there at all - only salts like "Magnesium
# oxalate"), so those come from USDA above. FooDB is only needed for the two
# compounds USDA doesn't have: L-Theanine and total Flavonoids.
FOODB_COMPOUND_TARGETS = ['L-Theanine', 'Flavonoids']

# Comprehensive Indian Staple List (word-boundary matched, see is_indian_staple).
# Word-boundary matching already stops substring bugs like 'mango' matching
# inside 'mangosteen', but it can't tell two *different* named species/cultivars
# apart when one is a legitimate whole-word match (e.g. "mustard" is a real
# word inside "Chinese mustard", which isn't the Indian crop) - that's what
# INDIAN_STAPLE_EXCLUDE below is for.
INDIAN_STAPLE_TERMS = [
    'lentil', 'chickpea', 'mung bean', 'paneer', 'ghee', 'turmeric',
    'ginger', 'garlic', 'cumin', 'coriander', 'mustard', 'fenugreek',
    'curry', 'rice', 'wheat', 'mango', 'banana', 'guava', 'papaya',
    'jowar', 'ragi', 'bajra', 'pigeon pea', 'toor', 'urad', 'chana',
    'rajma', 'kidney bean', 'coconut', 'cardamom', 'clove', 'cinnamon',
    'okra', 'bhindi', 'eggplant', 'brinjal', 'tamarind', 'amla', 'tulsi',
    'gourd', 'jackfruit', 'lotus', 'makhana', 'saffron', 'jaggery',
    'rohu', 'katla', 'pomfret', 'hilsa', 'surmai', 'bhetki', 'mackerel',
    'spinach',
]

# Whole-name false positives: these contain a staple keyword as a real word but
# name a different species/cultivar not used in Indian cuisine (found by
# auditing the actual tagged output - e.g. "Chinese mustard" and "Atlantic
# mackerel" both matched via legitimate word-boundary hits on 'mustard'/'mackerel').
INDIAN_STAPLE_EXCLUDE = [
    'chinese mustard', 'hedge mustard', 'white mustard', 'mustard spinach',
    'new zealand spinach', 'king mackerel', 'pacific jack mackerel',
    'spanish mackerel', 'atlantic mackerel', 'scombridae', 'wild rice',
]

JUNK_KEYWORDS = [
    'gum', 'chips', 'candy', 'syrup', 'soda', 'beverage,', 'flavoring',
    'artificial', 'cookie', 'cake', 'pastry', 'lard', 'crisp', 'puff',
    'confectionery', 'sweetener', 'dessert', 'frosting'
]

# Vegetarian-but-not-vegan: contains dairy/honey. Fixes the old bug where
# is_vegan was just a copy of is_vegetarian (marking milk/ghee/paneer vegan).
NON_VEGAN_TERMS = ['milk', 'curd', 'yogurt', 'yoghurt', 'paneer', 'ghee', 'cheese', 'butter', 'honey', 'cream']

MEAT_FOOD_GROUPS = ['Aquatic foods', 'Animal foods', 'Meat', 'Fishes']


def _term_in_name(name: str, terms: list[str]) -> bool:
    name = str(name).lower()
    return any(re.search(rf'\b{re.escape(term)}\b', name) for term in terms)


def is_indian_staple(name: str) -> bool:
    if _term_in_name(name, INDIAN_STAPLE_EXCLUDE):
        return False
    return _term_in_name(name, INDIAN_STAPLE_TERMS)


def is_junk_food(name: str) -> bool:
    return _term_in_name(name, JUNK_KEYWORDS)


def is_vegetarian_group(food_group) -> bool:
    if pd.isna(food_group):
        return False
    return food_group not in MEAT_FOOD_GROUPS


def is_vegan(is_veg: bool, name: str) -> bool:
    return is_veg and not _term_in_name(name, NON_VEGAN_TERMS)


def _num(row, col) -> float:
    val = row.get(col)
    return float(val) if pd.notna(val) else 0.0


def run_etl_pipeline():
    print("Starting Advanced Neuro-Diet ETL Pipeline...")

    foodb_path = "./data/foodb"
    usda_path = "./data/usda"

    if not os.path.exists(foodb_path) or not os.path.exists(usda_path):
        print("Error: Missing data directories.")
        return

    print("1. Loading Massive CSVs...")
    foodb_foods = pd.read_csv(f"{foodb_path}/Food.csv", usecols=['id', 'name', 'food_group'], low_memory=False)
    foodb_compounds = pd.read_csv(f"{foodb_path}/Compound.csv", usecols=['id', 'name'], low_memory=False)
    foodb_contents = pd.read_csv(f"{foodb_path}/Content.csv", usecols=['food_id', 'source_type', 'source_id', 'standard_content'], low_memory=False)

    usda_foods = pd.read_csv(f"{usda_path}/food.csv", usecols=['fdc_id', 'description'], low_memory=False)
    usda_food_nutrients = pd.read_csv(f"{usda_path}/food_nutrient.csv", usecols=['fdc_id', 'nutrient_id', 'amount'], low_memory=False)

    print("2. Pivoting USDA Data (Macros + Magnesium/Zinc/Omega-3, by exact nutrient ID)...")
    usda_nut_filtered = usda_food_nutrients[usda_food_nutrients['nutrient_id'].isin(USDA_NUTRIENT_IDS)].copy()
    usda_nut_filtered['name'] = usda_nut_filtered['nutrient_id'].map(USDA_NUTRIENT_IDS)

    usda_pivoted = usda_nut_filtered.pivot_table(index='fdc_id', columns='name', values='amount', aggfunc='mean').reset_index()
    usda_final = pd.merge(usda_foods, usda_pivoted, on='fdc_id')

    print("3. Pivoting FooDB Data (L-Theanine + Flavonoids)...")
    foodb_comp_filtered = foodb_compounds[foodb_compounds['name'].isin(FOODB_COMPOUND_TARGETS)]

    neuro_contents = foodb_contents[
        (foodb_contents['source_type'] == 'Compound') &
        (foodb_contents['source_id'].isin(foodb_comp_filtered['id']))
    ]

    foodb_merged = pd.merge(neuro_contents, foodb_comp_filtered, left_on='source_id', right_on='id')
    foodb_pivoted = foodb_merged.pivot_table(index='food_id', columns='name', values='standard_content', aggfunc='mean').reset_index()
    # left join: L-Theanine/Flavonoids are optional enrichment, not a requirement
    # for a food to be included (an inner join here would silently drop every
    # FooDB food that lacks those two rare compounds - which is nearly all of them).
    foodb_final = pd.merge(foodb_foods, foodb_pivoted, left_on='id', right_on='food_id', how='left')

    print("4. Executing Matrix Merge (Exact + Fuzzy)...")
    usda_final['match_name'] = usda_final['description'].str.lower().str.strip()
    foodb_final['match_name'] = foodb_final['name'].str.lower().str.strip()

    # 4a. Exact Match
    merged_exact = pd.merge(foodb_final, usda_final, on='match_name', how='inner')

    matched_foodb_ids = merged_exact['id'].tolist()
    unmatched_foodb = foodb_final[~foodb_final['id'].isin(matched_foodb_ids)].copy()
    unmatched_usda = usda_final[~usda_final['fdc_id'].isin(merged_exact['fdc_id'])].copy()

    fuzzy_matches = []
    subset_foodb = unmatched_foodb.head(1000)
    usda_choices = unmatched_usda['match_name'].tolist()

    for _, row in subset_foodb.iterrows():
        best_match = process.extractOne(row['match_name'], usda_choices)
        if best_match and best_match[1] >= 85:
            usda_row = unmatched_usda[unmatched_usda['match_name'] == best_match[0]].iloc[0]
            fuzzy_matches.append({**row.to_dict(), **usda_row.to_dict()})

    merged_fuzzy = pd.DataFrame(fuzzy_matches)
    final_master_df = pd.concat([merged_exact, merged_fuzzy], ignore_index=True) if not merged_fuzzy.empty else merged_exact

    print("5. Purging Junk Foods...")
    final_master_df = final_master_df[~final_master_df['name'].apply(is_junk_food)]

    print("6. Bulk Inserting to Database (USDA/FooDB matrix + curated Indian supplement)...")
    db = SessionLocal()
    db.query(FoodMatrix).delete()

    records_to_insert = []

    for _, row in final_master_df.iterrows():
        veg_flag = is_vegetarian_group(row.get('food_group', 'Unknown'))
        name = row['name']
        omega_3_mg = (_num(row, 'ALA') + _num(row, 'DHA')) * 1000  # USDA reports these in grams

        records_to_insert.append({
            "name": name,
            "is_vegetarian": veg_flag,
            "is_vegan": is_vegan(veg_flag, name),
            "dietary_tags": ["vegetarian"] if veg_flag else ["omnivore"],
            "is_indian_staple": is_indian_staple(name),
            "calories": _num(row, 'Energy'),
            "protein_g": _num(row, 'Protein'),
            "carbs_g": _num(row, 'Carbohydrate, by difference'),
            "fats_g": _num(row, 'Total lipid (fat)'),
            "omega_3_mg": omega_3_mg,
            "flavonoids_mg": _num(row, 'Flavonoids'),
            "zinc_mg": _num(row, 'Zinc'),
            "magnesium_mg": _num(row, 'Magnesium'),
            "l_theanine_mg": _num(row, 'L-Theanine'),
        })

    # Curated supplement: hand-authored rows for staples with no/poor USDA-FooDB
    # coverage under Indian names (ghee, paneer, dals, millets, jaggery, tulsi,
    # named Indian fish, etc). See indian_foods_supplement.py for sourcing notes.
    for food in INDIAN_FOODS_SUPPLEMENT:
        records_to_insert.append({
            "name": food["name"],
            "is_vegetarian": food["is_vegetarian"],
            "is_vegan": food["is_vegan"],
            "dietary_tags": ["vegetarian"] if food["is_vegetarian"] else ["omnivore"],
            "is_indian_staple": True,
            "calories": food["calories"],
            "protein_g": food["protein_g"],
            "carbs_g": food["carbs_g"],
            "fats_g": food["fats_g"],
            "omega_3_mg": food.get("omega_3_mg", 0.0),
            "flavonoids_mg": food.get("flavonoids_mg", 0.0),
            "zinc_mg": food.get("zinc_mg", 0.0),
            "magnesium_mg": food.get("magnesium_mg", 0.0),
            "l_theanine_mg": food.get("l_theanine_mg", 0.0),
        })

    db.bulk_insert_mappings(FoodMatrix, records_to_insert)
    db.commit()
    db.close()

    print(f"ETL Pipeline Completed! Master database has {len(records_to_insert)} foods.")


if __name__ == "__main__":
    run_etl_pipeline()
