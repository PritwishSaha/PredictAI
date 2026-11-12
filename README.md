<!-- ===================== HEADER ===================== -->
<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:ff1744,100:b71c1c&height=240&section=header&text=PredictAI&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=36&desc=Customer%20Purchase%20Prediction%20%7C%20Machine%20Learning%20%2B%20Flask&descAlignY=58&descSize=20" alt="PredictAI header" width="100%"/>

<a href="https://predictai-eq5w.onrender.com">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&duration=3000&pause=900&color=E11D48&center=true&vCenter=true&width=760&height=50&lines=Will+this+customer+buy%3F+Ask+PredictAI+%F0%9F%94%AE;Random+Forest+%C2%B7+Flask+%C2%B7+SQLite+%C2%B7+Analytics;Single+%26+Batch+Predictions+with+Probability+Scores;From+raw+data+to+a+live+web+app+%F0%9F%9A%80" alt="Typing animation" />
</a>

<br/>

<a href="https://predictai-eq5w.onrender.com">
  <img src="https://img.shields.io/badge/🌐_LIVE_DEMO-Visit_PredictAI-E11D48?style=for-the-badge&labelColor=7f0000" alt="Live Demo"/>
</a>
<a href="https://github.com/PritwishSaha/PredictAI">
  <img src="https://img.shields.io/badge/SOURCE-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
</a>

<br/><br/>

<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
<img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask"/>
<img src="https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="scikit-learn"/>
<img src="https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white" alt="Pandas"/>
<img src="https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white" alt="NumPy"/>
<img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
<img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Render"/>

<br/>

<img src="https://img.shields.io/github/stars/PritwishSaha/PredictAI?style=flat-square&logo=github&color=E11D48" alt="Stars"/>
<img src="https://img.shields.io/github/forks/PritwishSaha/PredictAI?style=flat-square&logo=github&color=E11D48" alt="Forks"/>
<img src="https://img.shields.io/github/last-commit/PritwishSaha/PredictAI?style=flat-square&color=E11D48" alt="Last commit"/>
<img src="https://img.shields.io/github/repo-size/PritwishSaha/PredictAI?style=flat-square&color=E11D48" alt="Repo size"/>

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:ff1744,100:b71c1c&height=3" width="100%" alt=""/>

## 📌 Table of Contents

| | | |
|---|---|---|
| [📖 Overview](#-overview) | [🤖 ML Workflow](#-machine-learning-workflow) | [🔌 API Endpoints](#-api-endpoints) |
| [✨ Key Features](#-key-features) | [📊 Input Features](#-input-features) | [☁️ Deployment](#️-deployment) |
| [🛠️ Tech Stack](#️-technology-stack) | [📁 Project Structure](#-project-structure) | [🗄️ Database](#️-database) |
| [⚙️ Installation](#️-installation-and-setup) | [🚀 Run the App](#-run-the-application) | [⚠️ Limitations](#️-limitations) |
| [🔮 Roadmap](#-roadmap) | [👨‍💻 Author](#-author) | |

---

## 📖 Overview

**PredictAI** is a machine learning-powered web application that predicts whether a customer is likely to purchase a product, based on **demographics, purchasing behavior, website activity, and loyalty program participation**.

A **Random Forest Classifier** generates the prediction and a probability score, while the app adds interactive analytics, prediction history, and batch predictions through CSV upload.

> 💡 **Why this project?** It shows how machine learning, backend development, frontend development, and database management come together in one practical application.

<div align="center">

| 🎯 Predict | 📈 Score | 📦 Batch | 🕘 Track | 📤 Export |
|:---:|:---:|:---:|:---:|:---:|
| Will the customer buy? | Purchase probability | Many customers via CSV | Full prediction history | Download your records |

</div>

---

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 🎯 Individual Prediction
- Enter customer details in an interactive form
- Get the predicted result instantly
- See the model's purchase probability

</td>
<td width="50%" valign="top">

### 📦 Batch Prediction
- Upload customer records as a CSV file
- Process many customers in one operation
- View successful and failed records
- Get purchase / non-purchase statistics

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📊 Analytics Dashboard
- Overall prediction statistics
- Purchase vs. non-purchase breakdown
- Trends and summary metrics
- Customer prediction activity monitoring

</td>
<td width="50%" valign="top">

### 🕘 Prediction History
- Records saved automatically in SQLite
- Browse previous predictions
- Retrieve a single prediction by ID
- Export the full history

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🔌 REST API
- Flask-powered backend
- Dedicated prediction endpoints
- Health monitoring endpoint
- Analytics and history endpoints

</td>
<td width="50%" valign="top">

### 🎨 Responsive UI
- Modern red-and-white theme
- Responsive dashboard layout
- Interactive frontend components
- CSS animations and JavaScript interactions

</td>
</tr>
</table>

<!--
📸 SCREENSHOTS (optional)
Add images to static/images/ and uncomment the block below:

## 📸 Screenshots
<div align="center">
  <img src="static/images/home.png" width="48%" alt="Home"/>
  <img src="static/images/analytics.png" width="48%" alt="Analytics"/>
</div>
-->

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| 🐍 **Language** | ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) |
| 🎨 **Frontend** | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) |
| ⚙️ **Backend** | ![Flask](https://img.shields.io/badge/Flask-000000?style=flat-square&logo=flask&logoColor=white) |
| 🤖 **Machine Learning** | ![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white) · Random Forest Classifier |
| 🧮 **Data Processing** | ![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat-square&logo=pandas&logoColor=white) ![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat-square&logo=numpy&logoColor=white) |
| 📦 **Model Serialization** | Joblib |
| 🗄️ **Database** | ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white) |
| 🚦 **Production Server** | ![Gunicorn](https://img.shields.io/badge/Gunicorn-499848?style=flat-square&logo=gunicorn&logoColor=white) |
| 🔧 **Version Control** | ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white) |
| ☁️ **Cloud Deployment** | ![Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=black) |

---

## 🤖 Machine Learning Workflow

```mermaid
flowchart TD
    subgraph T["🧠 Training Pipeline  ·  train_model.py"]
        direction TB
        A[("📂 Customer Dataset")] --> B["🧹 Data Preprocessing"]
        B --> C["🔤 Categorical Encoding"]
        C --> D["✂️ Train-Test Split · 80 / 20"]
        D --> E["🌲 Random Forest Classifier"]
        E --> F["📏 Model Evaluation"]
        F --> G[("💾 Serialized Model · Joblib")]
    end

    subgraph S["🚀 Serving Pipeline  ·  app.py"]
        direction TB
        H["👤 Customer Input"] --> I["⚙️ Flask API"]
        I --> J["🎯 Purchase Prediction"]
        J --> K["📈 Prediction Probability"]
        K --> L[("🗄️ SQLite Database")]
        L --> M["📊 Analytics Dashboard"]
    end

    G -. loaded by .-> I

    classDef red fill:#b71c1c,stroke:#ff1744,color:#ffffff,stroke-width:2px;
    classDef dark fill:#1f1f1f,stroke:#ff1744,color:#ffffff,stroke-width:2px;
    class A,B,C,D,E,F,H,I,J,K,M red;
    class G,L dark;
```

### 🌲 Algorithm: Random Forest Classifier

Random Forest is an **ensemble learning** algorithm that combines multiple decision trees to produce a prediction. It suits this project because it handles both numerical and categorical customer information once preprocessing is done.

### ⚙️ Model Configuration

| Parameter | Value |
|---|:---:|
| Algorithm | `RandomForestClassifier` |
| Number of Estimators | `100` |
| Maximum Depth | `10` |
| Minimum Samples Split | `5` |
| Minimum Samples Leaf | `2` |
| Random State | `42` |
| Test Size | `20%` |
| Prediction Threshold | `0.50` |

### 📏 Model Evaluation Metrics

The training script evaluates the model with:

![Accuracy](https://img.shields.io/badge/Accuracy-E11D48?style=flat-square)
![Precision](https://img.shields.io/badge/Precision-E11D48?style=flat-square)
![Recall](https://img.shields.io/badge/Recall-E11D48?style=flat-square)
![F1-Score](https://img.shields.io/badge/F1--Score-E11D48?style=flat-square)
![ROC-AUC](https://img.shields.io/badge/ROC--AUC-E11D48?style=flat-square)
![Confusion Matrix](https://img.shields.io/badge/Confusion_Matrix-E11D48?style=flat-square)

> 📝 Actual scores depend on the training dataset. Report the results produced by `train_model.py` when you run it.

---

## 📊 Input Features

The model uses **eight** customer-related features.

| # | Feature | Description | Type |
|:-:|---|---|:-:|
| 1 | `Age` | Customer's age | 🔢 Numerical |
| 2 | `Gender` | Customer's gender | 🔤 Categorical |
| 3 | `AnnualIncome` | Customer's annual income | 🔢 Numerical |
| 4 | `NumberOfPurchases` | Previous purchase count | 🔢 Numerical |
| 5 | `ProductCategory` | Product category | 🔤 Categorical |
| 6 | `TimeSpentOnWebsite` | Time spent browsing the website | 🔢 Numerical |
| 7 | `LoyaltyProgram` | Loyalty program participation | 🔤 Categorical |
| 8 | `DiscountsAvailed` | Number of discounts used | 🔢 Numerical |

**🎯 Target variable:** `Purchase`

| Value | Meaning |
|:-:|---|
| `1` | ✅ Customer purchased |
| `0` | ❌ Customer did not purchase |

---

## 📁 Project Structure

```text
PredictAI/
│
├── 📄 app.py                          # Flask application & REST API
├── 🧠 train_model.py                  # Model training & evaluation
├── 📋 requirements.txt                # Python dependencies
├── 🚦 Procfile                        # Gunicorn start command (Render)
├── 📘 README.md
├── 🙈 .gitignore
│
├── 📦 models/
│   └── customer_purchase_model.pkl    # Trained Random Forest model
│
├── 🖼️ templates/
│   └── index.html                     # Main application page
│
├── 🎨 static/
│   ├── css/
│   │   └── style.css                  # Red-and-white theme
│   ├── js/
│   │   └── app.js                     # Frontend interactions
│   └── images/
│
└── 🗄️ customer_predictions.db         # SQLite DB (auto-generated)
```

> 📌 The SQLite database is generated automatically when the Flask app initializes, so it may not be included in the GitHub repository.

---

## ⚙️ Installation and Setup

Run PredictAI locally in a few steps.

**1️⃣ Clone the repository**

```bash
git clone https://github.com/PritwishSaha/PredictAI.git
cd PredictAI
```

**2️⃣ Create a virtual environment**

```bash
python -m venv venv
```

**3️⃣ Activate it**

<table>
<tr>
<td><b>🪟 Windows</b></td>
<td><b>🐧 Linux / 🍎 macOS</b></td>
</tr>
<tr>
<td>

```powershell
venv\Scripts\activate
```

</td>
<td>

```bash
source venv/bin/activate
```

</td>
</tr>
</table>

**4️⃣ Install dependencies**

```bash
pip install -r requirements.txt
```

**5️⃣ Verify the model file**

Make sure this file exists:

```text
models/customer_purchase_model.pkl
```

Need to generate or retrain the model?

```bash
python train_model.py
```

---

## 🚀 Run the Application

Start the Flask development server:

```bash
python app.py
```

Then open your browser at:

```text
http://127.0.0.1:5000
```

✅ **PredictAI should now be running locally.**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|:-:|---|---|
| ![GET](https://img.shields.io/badge/GET-2E7D32?style=flat-square) | `/` | Loads the main application |
| ![GET](https://img.shields.io/badge/GET-2E7D32?style=flat-square) | `/api/health` | Checks application and model status |
| ![POST](https://img.shields.io/badge/POST-E11D48?style=flat-square) | `/api/predict` | Predicts an individual customer's purchase |
| ![GET](https://img.shields.io/badge/GET-2E7D32?style=flat-square) | `/api/history` | Retrieves prediction history |
| ![GET](https://img.shields.io/badge/GET-2E7D32?style=flat-square) | `/api/history/<id>` | Retrieves a specific prediction |
| ![GET](https://img.shields.io/badge/GET-2E7D32?style=flat-square) | `/api/analytics` | Retrieves analytics information |
| ![GET](https://img.shields.io/badge/GET-2E7D32?style=flat-square) | `/api/history/export` | Exports prediction history |
| ![POST](https://img.shields.io/badge/POST-E11D48?style=flat-square) | `/api/batch-predict` | Processes multiple customer records |

<details>
<summary><b>🩺 Try the health check (click to expand)</b></summary>

<br/>

**cURL**

```bash
curl https://predictai-eq5w.onrender.com/api/health
```

**Python**

```python
import requests

url = "https://predictai-eq5w.onrender.com/api/health"

response = requests.get(url)

print(response.status_code)
print(response.json())
```

> ⏳ On Render's free tier the service may take a short while to wake up on the first request.

</details>

---

## ☁️ Deployment

PredictAI is deployed on **Render**.

| Setting | Configuration |
|---|---|
| Hosting Platform | Render |
| Repository | GitHub |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app` |
| Production Server | Gunicorn |

**Procfile**

```text
web: gunicorn app:app
```

<div align="center">

<a href="https://predictai-eq5w.onrender.com">
  <img src="https://img.shields.io/badge/▶_OPEN_LIVE_APP-predictai--eq5w.onrender.com-E11D48?style=for-the-badge&labelColor=7f0000" alt="Open live app"/>
</a>

</div>

---

## 🗄️ Database

PredictAI uses **SQLite** to store customer prediction records. It supports:

- 💾 Saving prediction results
- 🕘 Maintaining prediction history
- 🔎 Retrieving previous predictions
- 📊 Generating analytics
- 📤 Exporting prediction records

The database is initialized automatically by the Flask application.

> [!WARNING]
> **Deployment consideration:** Render's default filesystem is ephemeral, so SQLite records may be lost when the service restarts or is redeployed. Use PostgreSQL or persistent storage for production data retention.

---

## ⚠️ Limitations

> [!NOTE]
> PredictAI is a learning and demonstration project. Treat its output as an estimate, not a guaranteed purchasing decision.

- Prediction quality depends on the quality and representativeness of the training dataset.
- The training script can generate **synthetic demonstration data** when the expected CSV dataset is unavailable.
- Synthetic data does not represent real customer purchasing behavior.
- Model predictions should not be treated as guaranteed purchasing decisions.
- SQLite on Render's default filesystem does not provide permanent storage.

---

## 🔮 Roadmap

- [ ] Integrate a larger real-world customer dataset
- [ ] Improve model performance through hyperparameter tuning
- [ ] Compare Random Forest with Logistic Regression, Decision Tree, and Gradient Boosting
- [ ] Add customer segmentation using clustering algorithms
- [ ] Implement interactive Power BI-style analytics
- [ ] Migrate SQLite to PostgreSQL
- [ ] Add user authentication and role-based access
- [ ] Implement automated model retraining
- [ ] Add explainable AI using SHAP
- [ ] Improve prediction monitoring and model evaluation

---

## 👨‍💻 Author

<div align="center">

### **Pritwish Saha**

*B.Tech — Computer Science and Engineering (AI & ML)*
**Brainware University**

<a href="https://github.com/PritwishSaha">
  <img src="https://img.shields.io/badge/GitHub-PritwishSaha-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
</a>
<a href="https://www.linkedin.com/in/YOUR-LINKEDIN-USERNAME">
  <img src="https://img.shields.io/badge/LinkedIn-Pritwish_Saha-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
</a>
<a href="https://YOUR-PORTFOLIO-URL">
  <img src="https://img.shields.io/badge/Portfolio-Visit-E11D48?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Portfolio"/>
</a>

</div>

---

## ⭐ Support

If you find this project interesting, a ⭐ on GitHub goes a long way. Feedback and suggestions are always welcome!

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=18&duration=3500&pause=1000&color=E11D48&center=true&vCenter=true&width=620&lines=Built+with+Python+%C2%B7+Machine+Learning+%C2%B7+Flask;Thanks+for+stopping+by!+%E2%9D%A4%EF%B8%8F" alt="Footer typing animation" />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:b71c1c,100:ff1744&height=140&section=footer&animation=twinkling" alt="Footer" width="100%"/>

</div>