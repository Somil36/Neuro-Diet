"""
Curated Indian-staple foods missing (or badly mismatched) from the USDA/FooDB
pipeline. Those two source databases are Western food-composition references
and simply don't carry Indian vernacular names - ghee, paneer, the various
dals, millets like ragi/bajra/jowar, jaggery, tulsi, and named Indian fish
have no entry under any name etl.py's matching step could find.

All values are per 100g, sourced from well-established, commonly-cited Indian
nutrition references (IFCT-style figures). This is a V1 heuristics engine
(see engine.py/main.py docstrings), so these are reasonable estimates for
ranking foods against each other, not lab-certified figures. Magnesium/zinc/
omega-3/flavonoids/l_theanine default to 0.0 via dict.get() in etl.py when
omitted below.
"""

INDIAN_FOODS_SUPPLEMENT = [
    # --- Dairy (vegetarian, not vegan) ---
    {"name": "Paneer", "is_vegetarian": True, "is_vegan": False,
     "calories": 265, "protein_g": 18.3, "carbs_g": 1.2, "fats_g": 20.8, "magnesium_mg": 20, "zinc_mg": 1.5},
    {"name": "Ghee", "is_vegetarian": True, "is_vegan": False,
     "calories": 900, "protein_g": 0.0, "carbs_g": 0.0, "fats_g": 100.0},
    {"name": "Curd (Dahi)", "is_vegetarian": True, "is_vegan": False,
     "calories": 60, "protein_g": 3.5, "carbs_g": 4.7, "fats_g": 3.3, "magnesium_mg": 12, "zinc_mg": 0.5},

    # --- Pulses & legumes (vegan) ---
    {"name": "Chana (Whole Bengal Gram)", "is_vegetarian": True, "is_vegan": True,
     "calories": 364, "protein_g": 19.3, "carbs_g": 61.0, "fats_g": 6.0, "magnesium_mg": 115, "zinc_mg": 2.7},
    {"name": "Chana Dal (Split Bengal Gram)", "is_vegetarian": True, "is_vegan": True,
     "calories": 360, "protein_g": 17.1, "carbs_g": 61.0, "fats_g": 5.3, "magnesium_mg": 138, "zinc_mg": 2.7},
    {"name": "Urad Dal (Split Black Gram)", "is_vegetarian": True, "is_vegan": True,
     "calories": 341, "protein_g": 25.2, "carbs_g": 59.0, "fats_g": 1.6, "magnesium_mg": 267, "zinc_mg": 3.5},
    {"name": "Moong Dal (Split Green Gram)", "is_vegetarian": True, "is_vegan": True,
     "calories": 347, "protein_g": 24.0, "carbs_g": 59.9, "fats_g": 1.2, "magnesium_mg": 189, "zinc_mg": 2.7},
    {"name": "Toor Dal (Split Pigeon Pea)", "is_vegetarian": True, "is_vegan": True,
     "calories": 343, "protein_g": 22.3, "carbs_g": 57.6, "fats_g": 1.5, "magnesium_mg": 183, "zinc_mg": 2.8},
    {"name": "Rajma (Kidney Beans)", "is_vegetarian": True, "is_vegan": True,
     "calories": 337, "protein_g": 22.9, "carbs_g": 60.6, "fats_g": 1.3, "magnesium_mg": 140, "zinc_mg": 2.8},

    # --- Millets, grains & flours (vegan) ---
    {"name": "Ragi (Finger Millet)", "is_vegetarian": True, "is_vegan": True,
     "calories": 328, "protein_g": 7.3, "carbs_g": 72.0, "fats_g": 1.3, "magnesium_mg": 137, "zinc_mg": 2.3},
    {"name": "Bajra (Pearl Millet)", "is_vegetarian": True, "is_vegan": True,
     "calories": 361, "protein_g": 11.6, "carbs_g": 67.5, "fats_g": 5.0, "magnesium_mg": 137, "zinc_mg": 3.1},
    {"name": "Jowar (Sorghum)", "is_vegetarian": True, "is_vegan": True,
     "calories": 349, "protein_g": 10.4, "carbs_g": 72.6, "fats_g": 1.9, "magnesium_mg": 165, "zinc_mg": 1.6},
    {"name": "Poha (Flattened Rice)", "is_vegetarian": True, "is_vegan": True,
     "calories": 356, "protein_g": 6.6, "carbs_g": 76.9, "fats_g": 1.2, "magnesium_mg": 46, "zinc_mg": 0.9},
    {"name": "Besan (Chickpea Flour)", "is_vegetarian": True, "is_vegan": True,
     "calories": 387, "protein_g": 22.0, "carbs_g": 57.8, "fats_g": 6.7, "magnesium_mg": 166, "zinc_mg": 2.8},
    {"name": "Atta (Whole Wheat Flour)", "is_vegetarian": True, "is_vegan": True,
     "calories": 341, "protein_g": 12.1, "carbs_g": 69.4, "fats_g": 1.7, "magnesium_mg": 130, "zinc_mg": 2.7},
    {"name": "Sabudana (Sago)", "is_vegetarian": True, "is_vegan": True,
     "calories": 358, "protein_g": 0.2, "carbs_g": 88.7, "fats_g": 0.2, "magnesium_mg": 10, "zinc_mg": 0.2},
    {"name": "Amaranth (Rajgira)", "is_vegetarian": True, "is_vegan": True,
     "calories": 371, "protein_g": 13.6, "carbs_g": 65.2, "fats_g": 7.0, "magnesium_mg": 248, "zinc_mg": 2.9},

    # --- Vegetables (vegan) ---
    {"name": "Onion", "is_vegetarian": True, "is_vegan": True,
     "calories": 40, "protein_g": 1.1, "carbs_g": 9.3, "fats_g": 0.1, "magnesium_mg": 10, "zinc_mg": 0.2, "flavonoids_mg": 20.0},
    {"name": "Tomato", "is_vegetarian": True, "is_vegan": True,
     "calories": 18, "protein_g": 0.9, "carbs_g": 3.9, "fats_g": 0.2, "magnesium_mg": 11, "zinc_mg": 0.2, "flavonoids_mg": 4.0},
    {"name": "Potato", "is_vegetarian": True, "is_vegan": True,
     "calories": 77, "protein_g": 2.0, "carbs_g": 17.5, "fats_g": 0.1, "magnesium_mg": 23, "zinc_mg": 0.3},
    {"name": "Green Peas (Matar)", "is_vegetarian": True, "is_vegan": True,
     "calories": 81, "protein_g": 5.4, "carbs_g": 14.5, "fats_g": 0.4, "magnesium_mg": 33, "zinc_mg": 1.2},
    {"name": "Bottle Gourd (Lauki)", "is_vegetarian": True, "is_vegan": True,
     "calories": 14, "protein_g": 0.6, "carbs_g": 3.4, "fats_g": 0.02, "magnesium_mg": 11, "zinc_mg": 0.7},
    {"name": "Mustard Greens (Sarson Saag)", "is_vegetarian": True, "is_vegan": True,
     "calories": 27, "protein_g": 2.9, "carbs_g": 4.7, "fats_g": 0.4, "magnesium_mg": 32, "zinc_mg": 0.25, "flavonoids_mg": 5.0},
    {"name": "Fenugreek Leaves (Methi Saag)", "is_vegetarian": True, "is_vegan": True,
     "calories": 49, "protein_g": 4.4, "carbs_g": 6.0, "fats_g": 0.9, "magnesium_mg": 65, "zinc_mg": 0.6},

    # --- Fruit, sweetener & seeds (vegan) ---
    {"name": "Amla (Indian Gooseberry)", "is_vegetarian": True, "is_vegan": True,
     "calories": 44, "protein_g": 0.9, "carbs_g": 10.2, "fats_g": 0.6, "magnesium_mg": 10, "zinc_mg": 0.1, "flavonoids_mg": 15.0},
    {"name": "Jaggery", "is_vegetarian": True, "is_vegan": True,
     "calories": 383, "protein_g": 0.4, "carbs_g": 98.0, "fats_g": 0.1, "magnesium_mg": 70, "zinc_mg": 0.2},
    {"name": "Makhana (Fox Nuts)", "is_vegetarian": True, "is_vegan": True,
     "calories": 347, "protein_g": 9.7, "carbs_g": 76.9, "fats_g": 0.1, "magnesium_mg": 116, "zinc_mg": 3.0},
    {"name": "Sesame Seeds (Til)", "is_vegetarian": True, "is_vegan": True,
     "calories": 573, "protein_g": 17.7, "carbs_g": 23.4, "fats_g": 49.7, "magnesium_mg": 351, "zinc_mg": 7.8, "omega_3_mg": 380.0},
    {"name": "Peanut (Groundnut)", "is_vegetarian": True, "is_vegan": True,
     "calories": 567, "protein_g": 25.8, "carbs_g": 16.1, "fats_g": 49.2, "magnesium_mg": 168, "zinc_mg": 3.3},

    # --- Herbs & spices (vegan) ---
    {"name": "Tulsi (Holy Basil)", "is_vegetarian": True, "is_vegan": True,
     "calories": 22, "protein_g": 3.1, "carbs_g": 2.7, "fats_g": 0.6, "magnesium_mg": 65, "zinc_mg": 0.8, "flavonoids_mg": 50.0},
    {"name": "Curry Leaves", "is_vegetarian": True, "is_vegan": True,
     "calories": 108, "protein_g": 6.1, "carbs_g": 18.7, "fats_g": 1.0, "magnesium_mg": 45, "zinc_mg": 0.2, "flavonoids_mg": 20.0},
    {"name": "Hing (Asafoetida)", "is_vegetarian": True, "is_vegan": True,
     "calories": 297, "protein_g": 4.0, "carbs_g": 67.8, "fats_g": 1.1},
    {"name": "Ajwain (Carom Seeds)", "is_vegetarian": True, "is_vegan": True,
     "calories": 305, "protein_g": 15.9, "carbs_g": 44.2, "fats_g": 25.7, "magnesium_mg": 192, "zinc_mg": 3.7},
    {"name": "Black Pepper", "is_vegetarian": True, "is_vegan": True,
     "calories": 251, "protein_g": 10.4, "carbs_g": 63.9, "fats_g": 3.3, "magnesium_mg": 171, "zinc_mg": 1.2},

    # --- Fish (non-vegetarian) ---
    {"name": "Rohu", "is_vegetarian": False, "is_vegan": False,
     "calories": 97, "protein_g": 16.6, "carbs_g": 0.0, "fats_g": 3.2, "magnesium_mg": 25, "zinc_mg": 1.0, "omega_3_mg": 300.0},
    {"name": "Hilsa", "is_vegetarian": False, "is_vegan": False,
     "calories": 273, "protein_g": 21.8, "carbs_g": 0.0, "fats_g": 19.4, "magnesium_mg": 32, "zinc_mg": 1.5, "omega_3_mg": 2500.0},
    {"name": "Pomfret", "is_vegetarian": False, "is_vegan": False,
     "calories": 146, "protein_g": 18.8, "carbs_g": 0.0, "fats_g": 7.5, "magnesium_mg": 28, "zinc_mg": 0.8, "omega_3_mg": 500.0},
    {"name": "Surmai (King Fish)", "is_vegetarian": False, "is_vegan": False,
     "calories": 118, "protein_g": 21.4, "carbs_g": 0.0, "fats_g": 3.2, "magnesium_mg": 30, "zinc_mg": 0.9, "omega_3_mg": 450.0},
    {"name": "Bhetki (Barramundi)", "is_vegetarian": False, "is_vegan": False,
     "calories": 105, "protein_g": 18.4, "carbs_g": 0.0, "fats_g": 3.0, "magnesium_mg": 27, "zinc_mg": 0.5, "omega_3_mg": 300.0},
    {"name": "Indian Mackerel (Bangda)", "is_vegetarian": False, "is_vegan": False,
     "calories": 156, "protein_g": 19.0, "carbs_g": 0.0, "fats_g": 8.0, "magnesium_mg": 30, "zinc_mg": 1.6, "omega_3_mg": 2200.0},

    # --- Beverage: the one real L-theanine source, central to Indian chai culture ---
    {"name": "Tea Leaves (Chai Patti)", "is_vegetarian": True, "is_vegan": True,
     "calories": 1, "protein_g": 0.0, "carbs_g": 0.2, "fats_g": 0.0, "flavonoids_mg": 3000.0, "l_theanine_mg": 2000.0},
]
