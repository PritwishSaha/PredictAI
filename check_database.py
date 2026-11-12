import sqlite3

DATABASE = "customer_predictions.db"

try:
    connection = sqlite3.connect(DATABASE)
    cursor = connection.cursor()

    # Get all database tables
    cursor.execute("""
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
    """)

    tables = cursor.fetchall()

    print("\n========== DATABASE TABLES ==========")

    for table in tables:
        table_name = table[0]
        print(f"\nTable: {table_name}")

        # Display table columns
        cursor.execute(f"PRAGMA table_info('{table_name}')")
        columns = cursor.fetchall()

        print("Columns:", [column[1] for column in columns])

        # Display saved records
        cursor.execute(f'SELECT * FROM "{table_name}" LIMIT 5')
        records = cursor.fetchall()

        print("Records:")
        for record in records:
            print(record)

    connection.close()

except sqlite3.Error as error:
    print("Database error:", error)