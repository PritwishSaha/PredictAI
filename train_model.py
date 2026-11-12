"""
==========================================
PREDICTAI - Customer Purchase Prediction
Model Training Script
==========================================
This script trains a Random Forest classifier
for customer purchase prediction.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "customer_purchase_data.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "customer_purchase_model.pkl")

# Features
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

TARGET = "Purchase"


def load_data():
    """Load or generate sample data for training."""
    if os.path.exists(DATA_PATH):
        print(f"Loading data from {DATA_PATH}")
        df = pd.read_csv(DATA_PATH)
    else:
        print("Generating sample training data...")
        df = generate_sample_data()
        df.to_csv(DATA_PATH, index=False)
        print(f"Sample data saved to {DATA_PATH}")
    
    return df


def generate_sample_data(n_samples=1000):
    """Generate synthetic customer data for training."""
    np.random.seed(42)
    
    data = {
        "Age": np.random.randint(18, 70, n_samples),
        "Gender": np.random.choice(["Male", "Female"], n_samples),
        "AnnualIncome": np.random.randint(20000, 150000, n_samples),
        "NumberOfPurchases": np.random.randint(0, 20, n_samples),
        "ProductCategory": np.random.choice(
            ["Electronics", "Clothing", "Food", "Home", "Sports"],
            n_samples
        ),
        "TimeSpentOnWebsite": np.random.randint(5, 120, n_samples),
        "LoyaltyProgram": np.random.choice(["Yes", "No"], n_samples),
        "DiscountsAvailed": np.random.randint(0, 10, n_samples),
        "Purchase": np.random.randint(0, 2, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Add some correlation to make the model learn patterns
    df.loc[
        (df["TimeSpentOnWebsite"] > 60) & 
        (df["NumberOfPurchases"] > 5) & 
        (df["LoyaltyProgram"] == "Yes"),
        "Purchase"
    ] = 1
    
    return df


def preprocess_data(df):
    """Preprocess the data for training."""
    df = df.copy()
    
    # Encode categorical variables
    label_encoders = {}
    categorical_cols = ["Gender", "ProductCategory", "LoyaltyProgram"]
    
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le
    
    return df, label_encoders


def train_model(X_train, y_train):
    """Train the Random Forest classifier."""
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    print("Training Random Forest model...")
    model.fit(X_train, y_train)
    print("Model training completed!")
    
    return model


def evaluate_model(model, X_test, y_test):
    """Evaluate the model and return metrics."""
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1_score": f1_score(y_test, y_pred),
        "roc_auc": roc_auc_score(y_test, y_prob)
    }
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    
    return metrics, cm


def save_model(model, metrics, label_encoders):
    """Save the trained model and metadata."""
    # Create models directory if it doesn't exist
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Prepare model artifact
    artifact = {
        "model": model,
        "model_name": "Random Forest",
        "threshold": 0.50,
        "features": FEATURES,
        "label_encoders": label_encoders,
        "accuracy": metrics["accuracy"],
        "precision": metrics["precision"],
        "recall": metrics["recall"],
        "f1_score": metrics["f1_score"],
        "roc_auc": metrics["roc_auc"]
    }
    
    # Save model
    joblib.dump(artifact, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


def main():
    """Main training pipeline."""
    print("\n" + "=" * 50)
    print("CUSTOMER PURCHASE PREDICTION - MODEL TRAINING")
    print("=" * 50 + "\n")
    
    # Load data
    df = load_data()
    print(f"Dataset shape: {df.shape}\n")
    
    # Preprocess
    df_processed, label_encoders = preprocess_data(df)
    
    # Split features and target
    X = df_processed[FEATURES]
    y = df_processed[TARGET]
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}\n")
    
    # Train model
    model = train_model(X_train, y_train)
    
    # Evaluate
    metrics, cm = evaluate_model(model, X_test, y_test)
    
    # Print metrics
    print("\n" + "-" * 50)
    print("MODEL PERFORMANCE METRICS")
    print("-" * 50)
    print(f"Accuracy:  {metrics['accuracy']:.2%}")
    print(f"Precision: {metrics['precision']:.2%}")
    print(f"Recall:    {metrics['recall']:.2%}")
    print(f"F1-Score:  {metrics['f1_score']:.2%}")
    print(f"ROC-AUC:   {metrics['roc_auc']:.2f}")
    print("-" * 50)
    
    print("\nConfusion Matrix:")
    print("              Predicted 0  Predicted 1")
    print(f"Actual 0:    {cm[0][0]:>10}    {cm[0][1]:>10}")
    print(f"Actual 1:    {cm[1][0]:>10}    {cm[1][1]:>10}")
    print("-" * 50 + "\n")
    
    # Save model
    save_model(model, metrics, label_encoders)
    
    print("\nTraining completed successfully!\n")


if __name__ == "__main__":
    main()
