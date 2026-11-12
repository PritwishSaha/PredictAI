import joblib
import sqlite3
import os

# =====================================
# 1. INSPECT TRAINED MODEL
# =====================================

model_path = "models/customer_purchase_model.pkl"

print("\n========== MODEL INFORMATION ==========")

if os.path.exists(model_path):
    artifact = joblib.load(model_path)

    print("Model file:", model_path)
    print("Artifact type:", type(artifact))

    if isinstance(artifact, dict):
        print("Available keys:", list(artifact.keys()))

        for key, value in artifact.items():
            if key == "model":
                print("Model type:", type(value))
            else:
                print(f"{key}:", value)
    else:
        print("Loaded object:", artifact)
else:
    print("Model file not found!")


# =====================================
# 2. INSPECT DATABASES
# =====================================

for db_path in ["customer_predictions.db", "predictions.db"]:

    print(f"\n========== {db_path} ==========")

    if not os.path.exists(db_path):
        print("Database not found!")
        continue

    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()

    cursor.execute("""
        SELECT name
        FROM sqlite_master
        WHERE type='table'
    """)

    tables = cursor.fetchall()

    print("Tables:", tables)

    for table in tables:
        table_name = table[0]

        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()

        print(f"\nTable: {table_name}")
        print("Columns:", [column[1] for column in columns])

        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        print("Records:", cursor.fetchone()[0])

    connection.close()