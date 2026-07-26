import pandas as pd
from sqlalchemy import create_engine
import sqlite3

def verify_pipeline():
    print("Connecting to the local Neuro-Diet Database...")
    
    # Connect directly using sqlite3 to execute raw queries
    conn = sqlite3.connect('neuro_diet.db')
    
    print("\n--- 1. Database Size ---")
    count = pd.read_sql_query("SELECT COUNT(*) as total_foods FROM food_matrix", conn)
    print(f"Total Foods Processed: {count.iloc[0]['total_foods']}")
    
    print("\n--- 2. Top L-Theanine Sources (For Focus) ---")
    focus_foods = pd.read_sql_query("""
        SELECT name, dietary_tags, l_theanine_mg 
        FROM food_matrix 
        ORDER BY l_theanine_mg DESC 
        LIMIT 5
    """, conn)
    print(focus_foods)
    
    print("\n--- 3. Top Omega-3 Sources (For Brain Fog) ---")
    brain_fog_foods = pd.read_sql_query("""
        SELECT name, dietary_tags, omega_3_mg 
        FROM food_matrix 
        ORDER BY omega_3_mg DESC 
        LIMIT 5
    """, conn)
    print(brain_fog_foods)

    conn.close()

if __name__ == "__main__":
    verify_pipeline()
