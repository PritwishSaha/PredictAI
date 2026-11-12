import os
import io
import csv
import json
import sqlite3
import logging
import traceback

import joblib
import numpy as np
import pandas as pd

from datetime import datetime, timedelta
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    Response
)
from werkzeug.utils import secure_filename


# ============================================================
# APPLICATION CONFIGURATION
# ============================================================

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "customer_purchase_model.pkl"
)

DATABASE_PATH = os.path.join(
    BASE_DIR,
    "customer_predictions.db"
)

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

ALLOWED_EXTENSIONS = {"csv"}

MAX_UPLOAD_SIZE = 10 * 1024 * 1024
MAX_CONTENT_LENGTH = MAX_UPLOAD_SIZE + 1024 * 1024

app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)


# ============================================================
# MODEL CONFIGURATION
# ============================================================

FEATURES = [
    "Age",
    "Gender",
    "AnnualIncome",
    "NumberOfPurchases",
    "ProductCategory",
    "TimeSpentOnWebsite",
    "LoyaltyProgram",
    "DiscountsAvailed"
]

CATEGORICAL_FEATURES = [
    "Gender",
    "ProductCategory",
    "LoyaltyProgram"
]

NUMERIC_FEATURES = [
    "Age",
    "AnnualIncome",
    "NumberOfPurchases",
    "TimeSpentOnWebsite",
    "DiscountsAvailed"
]

model = None
label_encoders = {}
model_metrics = {}
prediction_threshold = 0.5
model_name = "Random Forest Classifier"
model_features = FEATURES

model_loaded = False
model_error = None


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

def load_model():

    global model
    global label_encoders
    global model_metrics
    global prediction_threshold
    global model_name
    global model_features
    global model_loaded
    global model_error

    try:

        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model file not found: {MODEL_PATH}"
            )

        artifact = joblib.load(MODEL_PATH)

        # Support dictionary-based model artifacts.
        if isinstance(artifact, dict):

            model = artifact.get("model")

            label_encoders = artifact.get(
                "label_encoders", {}
            )

            model_metrics = artifact.get(
                "metrics", {}
            )

            prediction_threshold = float(
                artifact.get("threshold", 0.5)
            )

            model_name = artifact.get(
                "model_name",
                "Random Forest Classifier"
            )

            model_features = artifact.get(
                "features",
                FEATURES
            )

        else:
            # Support an artifact containing only the model.
            model = artifact

            label_encoders = {}
            model_metrics = {}
            prediction_threshold = 0.5
            model_features = FEATURES

        if model is None:
            raise ValueError(
                "The model artifact does not contain a valid model."
            )

        model_loaded = True
        model_error = None

        logger.info("Model loaded successfully.")
        logger.info("Model: %s", model_name)

    except Exception as error:

        model_loaded = False
        model_error = str(error)

        logger.exception("Model loading failed.")


load_model()


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_db_connection():

    connection = sqlite3.connect(DATABASE_PATH)

    connection.row_factory = sqlite3.Row

    return connection


# ============================================================
# CREATE DATABASE TABLE
# ============================================================

def initialize_database():

    connection = get_db_connection()
    cursor = connection.cursor()

    def create_predictions_table():
        cursor.execute("""
            CREATE TABLE predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                Age INTEGER,
                Gender TEXT,
                AnnualIncome REAL,
                NumberOfPurchases INTEGER,
                ProductCategory TEXT,
                TimeSpentOnWebsite REAL,
                LoyaltyProgram TEXT,
                DiscountsAvailed INTEGER,
                prediction TEXT,
                probability REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

    cursor.execute("""
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'predictions'
    """)

    if cursor.fetchone():
        cursor.execute("PRAGMA table_info(predictions)")
        existing_columns = {
            row["name"] for row in cursor.fetchall()
        }

        current_columns = {
            *FEATURES,
            "id",
            "prediction",
            "probability",
            "created_at"
        }

        if not current_columns.issubset(existing_columns):
            legacy_columns = {
                "customer_data",
                "prediction",
                "probability",
                "prediction_result",
                "created_at"
            }

            if not legacy_columns.issubset(existing_columns):
                raise RuntimeError(
                    "Unsupported predictions table schema. "
                    "The existing data has been left unchanged."
                )

            cursor.execute("""
                SELECT name
                FROM sqlite_master
                WHERE type = 'table' AND name = 'predictions_legacy'
            """)

            if cursor.fetchone():
                raise RuntimeError(
                    "Cannot migrate predictions: "
                    "predictions_legacy already exists."
                )

            cursor.execute(
                "ALTER TABLE predictions RENAME TO predictions_legacy"
            )
            create_predictions_table()

            cursor.execute("SELECT * FROM predictions_legacy")
            legacy_records = cursor.fetchall()

            insert_columns = FEATURES + [
                "prediction",
                "probability",
                "created_at"
            ]
            placeholders = ", ".join("?" for _ in insert_columns)
            columns_sql = ", ".join(
                f'"{column}"' for column in insert_columns
            )

            positive_labels = {
                "1",
                "true",
                "yes",
                "will buy",
                "will purchase",
                "purchase",
                "likely"
            }
            negative_labels = {
                "0",
                "false",
                "no",
                "will not buy",
                "will not purchase",
                "not purchase",
                "unlikely"
            }

            for record in legacy_records:
                try:
                    customer_data = json.loads(
                        record["customer_data"] or "{}"
                    )
                except (TypeError, json.JSONDecodeError):
                    customer_data = {}
                    logger.warning(
                        "Could not decode legacy customer data for "
                        "prediction %s; preserving the source record.",
                        record["id"]
                    )

                if not isinstance(customer_data, dict):
                    customer_data = {}

                feature_values = [
                    customer_data.get(
                        feature,
                        customer_data.get(feature.lower())
                    )
                    for feature in FEATURES
                ]

                raw_label = str(
                    record["prediction_result"] or ""
                ).strip().lower()

                if raw_label in positive_labels:
                    prediction_label = "Will Buy"
                elif raw_label in negative_labels:
                    prediction_label = "Will Not Buy"
                else:
                    prediction_label = (
                        "Will Buy"
                        if str(record["prediction"]).strip() in {"1", "1.0"}
                        else "Will Not Buy"
                    )

                cursor.execute(
                    f"""
                    INSERT INTO predictions ({columns_sql})
                    VALUES ({placeholders})
                    """,
                    (
                        *feature_values,
                        prediction_label,
                        record["probability"],
                        record["created_at"] or datetime.now().isoformat()
                    )
                )

            logger.info(
                "Migrated %s legacy prediction records; original table "
                "is preserved as predictions_legacy.",
                len(legacy_records)
            )
    else:
        create_predictions_table()

    connection.commit()
    connection.close()

    logger.info("Database initialized.")


initialize_database()


# ============================================================
# INPUT VALIDATION
# ============================================================

def validate_customer_data(data):

    if not isinstance(data, dict):
        raise ValueError("Invalid customer data.")

    missing_fields = [
        feature
        for feature in FEATURES
        if feature not in data or data[feature] in (None, "")
    ]

    if missing_fields:

        raise ValueError(
            "Missing fields: " + ", ".join(missing_fields)
        )

    cleaned = {}

    for feature in NUMERIC_FEATURES:

        try:
            value = float(data[feature])

        except (ValueError, TypeError):

            raise ValueError(
                f"{feature} must be a valid number."
            )

        if not np.isfinite(value):
            raise ValueError(
                f"{feature} must be a finite number."
            )

        cleaned[feature] = value

    if not cleaned["Age"].is_integer():
        raise ValueError("Age must be a whole number.")

    if not cleaned["NumberOfPurchases"].is_integer():
        raise ValueError(
            "NumberOfPurchases must be a whole number."
        )

    if not cleaned["DiscountsAvailed"].is_integer():
        raise ValueError(
            "DiscountsAvailed must be a whole number."
        )

    cleaned["Age"] = int(cleaned["Age"])

    cleaned["NumberOfPurchases"] = int(
        cleaned["NumberOfPurchases"]
    )

    cleaned["DiscountsAvailed"] = int(
        cleaned["DiscountsAvailed"]
    )

    if not 1 <= cleaned["Age"] <= 120:
        raise ValueError("Age must be between 1 and 120.")

    for feature in [
        "AnnualIncome",
        "NumberOfPurchases",
        "TimeSpentOnWebsite",
        "DiscountsAvailed"
    ]:

        if cleaned[feature] < 0:

            raise ValueError(
                f"{feature} cannot be negative."
            )

    for feature in CATEGORICAL_FEATURES:

        value = str(data[feature]).strip()

        if not value:
            raise ValueError(
                f"{feature} cannot be empty."
            )

        cleaned[feature] = value

    return cleaned


# ============================================================
# ENCODE CUSTOMER DATA
# ============================================================

def encode_customer_data(customer_data):

    encoded_data = customer_data.copy()

    for feature in CATEGORICAL_FEATURES:

        if feature not in label_encoders:
            continue

        encoder = label_encoders[feature]

        if not hasattr(encoder, "classes_"):
            raise ValueError(
                f"Invalid encoder for {feature}."
            )

        value = str(encoded_data[feature]).strip()

        # Match categories without case sensitivity.
        category_map = {
            str(category).strip().lower(): category
            for category in encoder.classes_
        }

        matched_category = category_map.get(
            value.lower()
        )

        if matched_category is None:

            supported_values = [
                str(category)
                for category in encoder.classes_
            ]

            raise ValueError(
                f"Unsupported {feature}: '{value}'. "
                f"Supported values: {', '.join(supported_values)}"
            )

        encoded_data[feature] = int(
            encoder.transform([matched_category])[0]
        )

    return encoded_data


# ============================================================
# PREPARE MODEL INPUT
# ============================================================

def prepare_model_input(customer_data):

    encoded_data = encode_customer_data(
        customer_data
    )

    feature_order = model_features or FEATURES

    input_df = pd.DataFrame(
        [encoded_data],
        columns=FEATURES
    )

    try:

        input_df = input_df[feature_order]

    except KeyError as error:

        raise ValueError(
            f"Model feature mismatch: {error}"
        )

    return input_df


def positive_class_index(classes):
    for index, class_value in enumerate(classes):
        if str(class_value).strip().lower() in [
            "1",
            "true",
            "yes",
            "will buy"
        ]:
            return index

    if len(classes) == 2:
        return 1

    raise ValueError("Unable to identify the purchase class.")


# ============================================================
# GENERATE PREDICTION
# ============================================================

def generate_prediction(customer_data):

    if not model_loaded or model is None:
        raise RuntimeError(
            "Prediction model is not available."
        )

    cleaned_data = validate_customer_data(
        customer_data
    )

    input_df = prepare_model_input(
        cleaned_data
    )

    # Generate probability.
    probabilities = model.predict_proba(input_df)[0]

    positive_index = positive_class_index(list(model.classes_))

    probability = float(
        probabilities[positive_index]
    )

    predicted_class = int(
        probability >= prediction_threshold
    )

    prediction_label = (
        "Will Buy"
        if predicted_class == 1
        else "Will Not Buy"
    )

    return {
        "prediction": prediction_label,
        "probability": round(
            probability * 100,
            2
        ),
        "class": predicted_class,
        "customer_data": cleaned_data
    }


# ============================================================
# SAVE PREDICTION TO DATABASE
# ============================================================

def save_prediction(customer_data, prediction, probability):

    connection = get_db_connection()

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO predictions (

            Age,
            Gender,
            AnnualIncome,
            NumberOfPurchases,
            ProductCategory,
            TimeSpentOnWebsite,
            LoyaltyProgram,
            DiscountsAvailed,

            prediction,
            probability

        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (

        customer_data["Age"],
        customer_data["Gender"],
        customer_data["AnnualIncome"],
        customer_data["NumberOfPurchases"],
        customer_data["ProductCategory"],
        customer_data["TimeSpentOnWebsite"],
        customer_data["LoyaltyProgram"],
        customer_data["DiscountsAvailed"],

        prediction,
        probability

    ))

    prediction_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return prediction_id


def save_predictions(predictions):
    if not predictions:
        return []

    connection = get_db_connection()
    cursor = connection.cursor()
    prediction_ids = []

    try:
        for customer_data, prediction, probability in predictions:
            cursor.execute("""
                INSERT INTO predictions (
                    Age,
                    Gender,
                    AnnualIncome,
                    NumberOfPurchases,
                    ProductCategory,
                    TimeSpentOnWebsite,
                    LoyaltyProgram,
                    DiscountsAvailed,
                    prediction,
                    probability
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                customer_data["Age"],
                customer_data["Gender"],
                customer_data["AnnualIncome"],
                customer_data["NumberOfPurchases"],
                customer_data["ProductCategory"],
                customer_data["TimeSpentOnWebsite"],
                customer_data["LoyaltyProgram"],
                customer_data["DiscountsAvailed"],
                prediction,
                probability
            ))
            prediction_ids.append(cursor.lastrowid)

        connection.commit()
        return prediction_ids
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


# ============================================================
# DATABASE RECORD CONVERSION
# ============================================================

def row_to_dict(row):

    return dict(row) if row else None


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def index():

    return render_template("index.html")


# ============================================================
# API: HEALTH CHECK
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():

    connection_status = False

    try:

        connection = get_db_connection()

        connection.execute("SELECT 1")

        connection.close()

        connection_status = True

    except Exception:

        logger.exception("Database health check failed.")

    def get_metric(*keys):

        for key in keys:

            if key in model_metrics:
                return model_metrics[key]

        return None

    return jsonify({

        "status": "online",

        "model_loaded": model_loaded,

        "model_name": model_name,

        "model_status": (
            "Loaded" if model_loaded else "Unavailable"
        ),

        "database_connected": connection_status,

        "database_status": (
            "Connected"
            if connection_status
            else "Disconnected"
        ),

        "metrics": {

            "test_accuracy": get_metric(
                "test_accuracy",
                "accuracy"
            ),

            "test_precision": get_metric(
                "test_precision",
                "precision"
            ),

            "test_recall": get_metric(
                "test_recall",
                "recall"
            ),

            "test_f1": get_metric(
                "test_f1",
                "f1_score"
            ),

            "test_roc_auc": get_metric(
                "test_roc_auc",
                "roc_auc"
            )

        },

        "timestamp": datetime.now().isoformat(),

        "error": model_error

    })


# ============================================================
# API: SINGLE CUSTOMER PREDICTION
# ============================================================

@app.route("/api/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "error": "Invalid or missing JSON data."
            }), 400

        result = generate_prediction(data)

        prediction_id = save_prediction(

            result["customer_data"],

            result["prediction"],

            result["probability"]

        )

        return jsonify({

            "success": True,

            "prediction_id": prediction_id,

            "prediction": result["prediction"],

            "probability": result["probability"],

            "class": result["class"],

            "customer_data": result["customer_data"],

            "created_at": datetime.now().isoformat()

        })

    except ValueError as error:

        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except Exception as error:

        logger.exception("Prediction failed.")

        return jsonify({
            "success": False,
            "error": "Prediction failed. Please check the input and model configuration."
        }), 500


# ============================================================
# API: PREDICTION HISTORY
# ============================================================

@app.route("/api/history", methods=["GET"])
def history():

    try:

        limit = request.args.get(
            "limit",
            default=100,
            type=int
        )

        limit = max(1, min(limit, 1000))

        connection = get_db_connection()

        cursor = connection.cursor()

        cursor.execute("""
            SELECT *
            FROM predictions
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))

        records = [
            row_to_dict(row)
            for row in cursor.fetchall()
        ]

        connection.close()

        return jsonify({
            "success": True,
            "total": len(records),
            "history": records
        })

    except Exception:

        logger.exception("History retrieval failed.")

        return jsonify({
            "success": False,
            "error": "Unable to retrieve prediction history."
        }), 500


# ============================================================
# API: SINGLE HISTORY RECORD
# ============================================================

@app.route(
    "/api/history/<int:prediction_id>",
    methods=["GET"]
)
def history_details(prediction_id):

    try:

        connection = get_db_connection()

        cursor = connection.cursor()

        cursor.execute("""
            SELECT *
            FROM predictions
            WHERE id = ?
        """, (prediction_id,))

        record = cursor.fetchone()

        connection.close()

        if not record:

            return jsonify({
                "success": False,
                "error": "Prediction record not found."
            }), 404

        return jsonify({
            "success": True,
            "record": row_to_dict(record)
        })

    except Exception:

        logger.exception("History details retrieval failed.")

        return jsonify({
            "success": False,
            "error": "Unable to retrieve prediction details."
        }), 500


# ============================================================
# API: ANALYTICS
# ============================================================

@app.route("/api/analytics", methods=["GET"])
def analytics():

    try:

        connection = get_db_connection()

        cursor = connection.cursor()

        # Total predictions.
        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM predictions
        """)

        total_predictions = cursor.fetchone()["total"]

        # Purchase distribution.
        cursor.execute("""
            SELECT prediction, COUNT(*) AS count
            FROM predictions
            GROUP BY prediction
        """)

        distribution = {
            row["prediction"]: row["count"]
            for row in cursor.fetchall()
        }

        will_buy = distribution.get("Will Buy", 0)

        will_not_buy = distribution.get(
            "Will Not Buy", 0
        )

        # Average prediction probability.
        cursor.execute("""
            SELECT AVG(probability) AS average_probability
            FROM predictions
        """)

        average_result = cursor.fetchone()

        average_probability = (
            average_result["average_probability"] or 0
        )

        # Purchase outcomes by product category.
        cursor.execute("""
            SELECT
                COALESCE(NULLIF(TRIM(ProductCategory), ''), 'Unknown')
                    AS category,
                COUNT(*) AS total,
                SUM(CASE WHEN prediction = 'Will Buy' THEN 1 ELSE 0 END)
                    AS will_buy,
                SUM(CASE WHEN prediction = 'Will Not Buy' THEN 1 ELSE 0 END)
                    AS will_not_buy,
                AVG(probability) AS average_probability
            FROM predictions
            GROUP BY category
            ORDER BY total DESC
        """)

        category_analysis = [
            {
                "category": row["category"],
                "total": row["total"],
                "will_buy": row["will_buy"],
                "will_not_buy": row["will_not_buy"],
                "purchase_rate": round(
                    row["will_buy"] / row["total"] * 100,
                    2
                ) if row["total"] else 0,
                "average_probability": round(
                    row["average_probability"] or 0,
                    2
                )
            }
            for row in cursor.fetchall()
        ]

        category_comparison = {
            row["category"]: row["will_buy"]
            for row in category_analysis
        }

        # Probability distribution.
        cursor.execute("""
            SELECT
                CASE
                    WHEN probability < 20 THEN '0-20%'
                    WHEN probability < 40 THEN '20-40%'
                    WHEN probability < 60 THEN '40-60%'
                    WHEN probability < 80 THEN '60-80%'
                    ELSE '80-100%'
                END AS probability_range,
                COUNT(*) AS total

            FROM predictions

            GROUP BY probability_range

            ORDER BY MIN(probability)
        """)

        probability_counts = {
            row["probability_range"]: row["total"]
            for row in cursor.fetchall()
        }
        probability_ranges = [
            "0-20%",
            "20-40%",
            "40-60%",
            "60-80%",
            "80-100%"
        ]
        probability_distribution = {
            probability_range: probability_counts.get(
                probability_range,
                0
            )
            for probability_range in probability_ranges
        }

        # Purchase outcomes by loyalty program.
        cursor.execute("""
            SELECT
                COALESCE(NULLIF(TRIM(LoyaltyProgram), ''), 'Unknown')
                    AS loyalty_program,
                COUNT(*) AS total,
                SUM(CASE WHEN prediction = 'Will Buy' THEN 1 ELSE 0 END)
                    AS will_buy,
                SUM(CASE WHEN prediction = 'Will Not Buy' THEN 1 ELSE 0 END)
                    AS will_not_buy
            FROM predictions
            GROUP BY loyalty_program
            ORDER BY total DESC
        """)

        loyalty_analysis = [
            {
                "loyalty_program": row["loyalty_program"],
                "total": row["total"],
                "will_buy": row["will_buy"],
                "will_not_buy": row["will_not_buy"]
            }
            for row in cursor.fetchall()
        ]

        loyalty_comparison = {
            row["loyalty_program"]: row["will_buy"]
            for row in loyalty_analysis
        }

        # Average probability by category.
        cursor.execute("""
            SELECT
                ProductCategory,
                AVG(probability) AS average_probability
            FROM predictions
            GROUP BY ProductCategory
        """)

        category_probability = {
            row["ProductCategory"]: round(
                row["average_probability"] or 0,
                2
            )
            for row in cursor.fetchall()
        }

        # Recent prediction activity, including days with no predictions.
        cursor.execute("""
            SELECT
                DATE(created_at) AS prediction_date,
                COUNT(*) AS total
            FROM predictions
            GROUP BY DATE(created_at)
        """)

        activity_by_date = {
            row["prediction_date"]: row["total"]
            for row in cursor.fetchall()
            if row["prediction_date"]
        }

        today = datetime.now().date()
        daily_activity = [
            {
                "date": (today - timedelta(days=days_ago)).isoformat(),
                "count": activity_by_date.get(
                    (today - timedelta(days=days_ago)).isoformat(),
                    0
                )
            }
            for days_ago in range(6, -1, -1)
        ]

        connection.close()

        purchase_rate = (
            (will_buy / total_predictions) * 100
            if total_predictions
            else 0
        )

        return jsonify({

            "success": True,

            "stats": {

                "total_predictions": total_predictions,

                "will_buy": will_buy,

                "will_not_buy": will_not_buy,

                "average_probability": round(
                    average_probability,
                    2
                ),

                "purchase_rate": round(
                    purchase_rate,
                    2
                )

            },

            "analytics": {

                "purchase_distribution": {
                    "Will Buy": will_buy,
                    "Will Not Buy": will_not_buy
                },

                "purchase_comparison": category_comparison,

                "category_comparison": category_comparison,

                "category_analysis": category_analysis,

                "probability_distribution": (
                    probability_distribution
                ),

                "loyalty_comparison": loyalty_comparison,

                "loyalty_analysis": loyalty_analysis,

                "category_probability": category_probability,

                "daily_activity": daily_activity

            }

        })

    except Exception:

        logger.exception("Analytics retrieval failed.")

        return jsonify({
            "success": False,
            "error": "Unable to generate analytics."
        }), 500


# ============================================================
# API: EXPORT HISTORY TO CSV
# ============================================================

@app.route("/api/history/export", methods=["GET"])
def export_history():

    try:

        connection = get_db_connection()

        df = pd.read_sql_query(
            """
            SELECT *
            FROM predictions
            ORDER BY id DESC
            """,
            connection
        )

        connection.close()

        output = io.StringIO()

        df.to_csv(
            output,
            index=False,
            quoting=csv.QUOTE_MINIMAL
        )

        output.seek(0)

        return Response(

            output.getvalue(),

            mimetype="text/csv",

            headers={
                "Content-Disposition":
                "attachment; filename=customer_prediction_history.csv"
            }

        )

    except Exception:

        logger.exception("CSV export failed.")

        return jsonify({
            "success": False,
            "error": "Unable to export prediction history."
        }), 500


# ============================================================
# CSV FILE VALIDATION
# ============================================================

def allowed_file(filename):

    return (
        "." in filename and
        filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# ============================================================
# API: BATCH CUSTOMER PREDICTION
# ============================================================

@app.route("/api/batch-predict", methods=["POST"])
def batch_predict():

    if "file" not in request.files:

        return jsonify({
            "success": False,
            "error": "No CSV file uploaded."
        }), 400

    file = request.files["file"]

    if not file.filename:

        return jsonify({
            "success": False,
            "error": "Please select a CSV file."
        }), 400

    if not allowed_file(file.filename):

        return jsonify({
            "success": False,
            "error": "Only CSV files are allowed."
        }), 400

    try:

        file.stream.seek(0, os.SEEK_END)
        file_size = file.stream.tell()
        file.stream.seek(0)

        if file_size > MAX_UPLOAD_SIZE:
            return jsonify({
                "success": False,
                "error": "CSV files must be 10 MB or smaller."
            }), 413

        filename = secure_filename(file.filename)

        if not filename:
            return jsonify({
                "success": False,
                "error": "Invalid filename."
            }), 400

        # Read CSV directly into memory.
        df = pd.read_csv(file)

        if df.empty:

            return jsonify({
                "success": False,
                "error": "The uploaded CSV file is empty."
            }), 400

        missing_columns = [
            feature
            for feature in FEATURES
            if feature not in df.columns
        ]

        if missing_columns:

            return jsonify({
                "success": False,
                "error": (
                    "Missing CSV columns: " +
                    ", ".join(missing_columns)
                )
            }), 400

        if len(df) > 10000:

            return jsonify({
                "success": False,
                "error": "Maximum 10,000 rows are allowed."
            }), 400

        if not model_loaded or model is None:
            return jsonify({
                "success": False,
                "error": "Prediction model is not available."
            }), 503

        results = []
        valid_records = []
        encoded_records = []
        valid_result_indexes = []

        for row_number, row in enumerate(
            df.to_dict(orient="records"),
            start=1
        ):
            customer_id = row.get("CustomerID", row_number)
            if pd.isna(customer_id):
                customer_id = row_number
            elif isinstance(customer_id, np.generic):
                customer_id = customer_id.item()

            try:
                customer_data = validate_customer_data({
                    feature: row[feature]
                    for feature in FEATURES
                })
                encoded_data = encode_customer_data(customer_data)

                valid_records.append(customer_data)
                encoded_records.append(encoded_data)
                valid_result_indexes.append(len(results))
                results.append({
                    "row": row_number,
                    "customer_id": customer_id,
                    "prediction": None,
                    "probability": None,
                    "status": "processing",
                    "success": True
                })
            except (TypeError, ValueError) as error:
                logger.warning(
                    "Batch row %s failed validation: %s",
                    row_number,
                    error
                )
                results.append({
                    "row": row_number,
                    "customer_id": customer_id,
                    "prediction": "Failed",
                    "probability": None,
                    "status": "failed",
                    "success": False,
                    "error": str(error)
                })

        if valid_records:
            input_df = pd.DataFrame(
                encoded_records,
                columns=FEATURES
            )
            input_df = input_df[model_features or FEATURES]
            probabilities = model.predict_proba(input_df)
            positive_index = positive_class_index(list(model.classes_))
            prediction_records = []

            for record_index, customer_data in enumerate(valid_records):
                probability = float(probabilities[record_index][positive_index])
                predicted_class = int(
                    probability >= prediction_threshold
                )
                prediction_label = (
                    "Will Buy"
                    if predicted_class
                    else "Will Not Buy"
                )
                probability_percent = round(probability * 100, 2)

                prediction_records.append((
                    customer_data,
                    prediction_label,
                    probability_percent
                ))

                result_index = valid_result_indexes[record_index]
                results[result_index].update({
                    "prediction": prediction_label,
                    "probability": probability_percent,
                    "status": "success",
                    "success": True,
                    "class": predicted_class
                })

            prediction_ids = save_predictions(prediction_records)
            for record_index, prediction_id in enumerate(prediction_ids):
                result_index = valid_result_indexes[record_index]
                results[result_index]["prediction_id"] = prediction_id

        successful = len(valid_records)
        failed = len(results) - successful
        will_buy = sum(
            result.get("class") == 1
            for result in results
            if result["success"]
        )
        will_not_buy = successful - will_buy

        return jsonify({

            "success": True,

            "filename": filename,

            "total_rows": len(df),

            "successfully_processed": successful,

            "failed": failed,

            "will_buy": will_buy,

            "will_not_buy": will_not_buy,

            "results": results

        })

    except pd.errors.EmptyDataError:

        return jsonify({
            "success": False,
            "error": "The CSV file contains no data."
        }), 400

    except Exception:

        logger.exception("Batch prediction failed.")

        return jsonify({
            "success": False,
            "error": "Unable to process the uploaded CSV."
        }), 500


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):

    if request.path.startswith("/api/"):

        return jsonify({
            "success": False,
            "error": "API endpoint not found."
        }), 404

    return "Page not found.", 404


@app.errorhandler(413)
def file_too_large(error):

    return jsonify({
        "success": False,
        "error": "File is too large. Maximum size is 10 MB."
    }), 413


@app.errorhandler(500)
def internal_error(error):

    return jsonify({
        "success": False,
        "error": "Internal server error."
    }), 500


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    print("\n" + "=" * 55)
    print(" CUSTOMER PURCHASE PREDICTION SYSTEM")
    print("=" * 55)

    print(f"Model Loaded : {model_loaded}")
    print(f"Model Name   : {model_name}")
    print(f"Database     : {DATABASE_PATH}")

    if model_error:
        print(f"Model Error  : {model_error}")

    print("=" * 55)

    app.run(
    host="127.0.0.1",
    port=5000,
    debug=True,
    use_reloader=False
)