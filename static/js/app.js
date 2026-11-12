/* ============================================================
   CUSTOMER PURCHASE PREDICTION
   Dashboard JavaScript
   API: Flask Backend
   ============================================================ */

"use strict";

/* =========================
   CONFIGURATION
========================= */

const API = {
    health: "/api/health",
    predict: "/api/predict",
    analytics: "/api/analytics",
    history: "/api/history",
    historyExport: "/api/history/export",
    batchPredict: "/api/batch-predict"
};

const REFRESH_INTERVAL = 30000;

let purchaseDistributionChart = null;
let purchaseComparisonChart = null;
let probabilityChart = null;
let categoryChart = null;
let loyaltyChart = null;
let dailyActivityChart = null;

let historyRecords = [];
let currentHistoryFilter = "all";


/* =========================
   DOM HELPERS
========================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

function getElement(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = getElement(id);
    if (element) element.textContent = value ?? "--";
}

function showElement(element) {
    if (element) {
        element.hidden = false;
        element.style.display = "";
    }
}

function hideElement(element) {
    if (element) element.style.display = "none";
}

function formatNumber(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) return "--";

    return number.toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function formatCurrency(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) return "--";

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(number);
}

function formatDate(value) {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}


/* =========================
   API REQUEST HANDLER
========================= */

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body instanceof FormData
                ? {}
                : { "Content-Type": "application/json" }),
            ...options.headers
        }
    });

    let data;

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.message ||
            `Request failed (${response.status})`
        );
    }

    return data;
}


/* =========================
   NOTIFICATION SYSTEM
========================= */

function showToast(message, type = "success") {
    let container = getElement("toastContainer");

    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";

        document.body.appendChild(container);
    }

    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;

    const icons = {
        success: "✓",
        error: "✕",
        warning: "!",
        info: "i"
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || "i"}</span>
        <span class="toast-message">${escapeHTML(message)}</span>
        <button class="toast-close" aria-label="Close notification">
            &times;
        </button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    const closeButton = $(".toast-close", toast);

    closeButton.addEventListener("click", () => {
        removeToast(toast);
    });

    setTimeout(() => {
        removeToast(toast);
    }, 4500);
}

function removeToast(toast) {
    if (!toast) return;

    toast.classList.remove("show");

    setTimeout(() => {
        toast.remove();
    }, 300);
}


/* =========================
   LOADING OVERLAY
========================= */

function setLoading(isLoading, message = "Processing...") {
    const overlay = getElement("loadingOverlay");

    if (!overlay) return;

    const messageElement = $(
        ".loading-message",
        overlay
    );

    if (messageElement) {
        messageElement.textContent = message;
    }

    overlay.style.display = isLoading ? "flex" : "none";
}


/* =========================
   SIDEBAR NAVIGATION
========================= */

function initializeNavigation() {
    const navLinks = $$("[data-section]");

    navLinks.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();

            const sectionName = link.dataset.section;

            if (!sectionName) return;

            navigateToSection(sectionName);
        });
    });

    window.addEventListener("hashchange", () => {
        const sectionName = window.location.hash.slice(1);

        if ($$(".dashboard-section").some(
            section => section.id === sectionName
        )) {
            navigateToSection(sectionName);
        }
    });

    const mobileToggle = getElement("mobileMenuBtn");
    const sidebar = $(".sidebar");
    const overlay = getElement("sidebarOverlay");
    const sidebarClose = getElement("sidebarClose");

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");

            if (overlay) {
                overlay.classList.toggle("active");
            }
        });
    }

    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener("click", () => {
            sidebar.classList.remove("open");
            if (overlay) overlay.classList.remove("active");
        });
    }

    if (overlay && sidebar) {
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("active");
        });
    }

    const requestedSection = window.location.hash.slice(1);
    const initialSection = $$(".dashboard-section").some(
        section => section.id === requestedSection
    )
        ? requestedSection
        : "overview";

    navigateToSection(initialSection, false);
}

function navigateToSection(sectionName, refreshSectionData = true) {
    const sections = $$(".dashboard-section");

    sections.forEach(section => {
        section.classList.remove("active");
        section.style.display = "none";
    });

    const target =
        getElement(`${sectionName}Section`) ||
        getElement(sectionName);

    if (target) {
        target.style.display = "block";
        target.classList.add("active");
        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } else {
        console.error(`Section not found: ${sectionName}`);
    }

    $$("[data-section]").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.section === sectionName
        );
    });

    const pageTitle = getElement("currentPageTitle");
    const activeLink = $$("[data-section]").find(
        link => link.dataset.section === sectionName
    );
    const activeLabel = activeLink?.querySelector(
        "span:not(.nav-badge)"
    );

    if (pageTitle && activeLabel) {
        pageTitle.textContent = activeLabel.textContent.trim();
    }

    if (window.location.hash !== `#${sectionName}`) {
        window.history.replaceState(null, "", `#${sectionName}`);
    }

    const sidebar = $(".sidebar");
    const overlay = getElement("sidebarOverlay");

    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("active");

    if (refreshSectionData) {
        if (sectionName === "analytics") {
            loadAnalytics();
        }

        if (sectionName === "history") {
            loadHistory();
        }

        if (sectionName === "overview" || sectionName === "dashboard") {
            loadDashboard();
        }
    }
}


/* =========================
   SYSTEM HEALTH
========================= */

async function loadHealth() {
    try {
        const data = await apiRequest(API.health);

        updateSystemStatus(data);

        return data;

    } catch (error) {
        console.error("Health check failed:", error);

        setText("headerStatusText", "Offline");
        updateStatusIndicator("apiStatus", false);
        updateStatusIndicator("serviceStatus", false);

        return null;
    }
}

function updateStatusIndicator(id, isOnline) {
    const element = getElement(id);

    if (!element) return;

    element.textContent = isOnline ? "Online" : "Offline";

    element.classList.remove(
        "online",
        "offline",
        "success",
        "error"
    );

    element.classList.add(
        isOnline ? "online" : "offline"
    );
}

function updateSystemStatus(data) {
    const status = String(
        data.status || data.service_status || "online"
    ).toLowerCase();

    const isOnline = [
        "online",
        "healthy",
        "ok",
        "running"
    ].includes(status);

    setText("headerStatusText", isOnline ? "Online" : "Offline");

    updateStatusIndicator("apiStatus", isOnline);
    updateStatusIndicator("serviceStatus", isOnline);

    const modelLoaded =
        data.model_loaded ??
        data.model_status ??
        data.model_available;

    if (modelLoaded !== undefined) {
        updateStatusIndicator(
            "modelStatus",
            Boolean(modelLoaded)
        );
    }

    const databaseConnected =
        data.database_connected ??
        data.db_connected ??
        data.database_status;

    if (databaseConnected !== undefined) {
        updateStatusIndicator(
            "dbStatus",
            databaseConnected === true ||
            String(databaseConnected).toLowerCase() === "connected"
        );
    }

    const metrics = data.metrics || {};

    /*
       Supports both metric naming conventions.

       train_model.py saves:
       accuracy, precision, recall, f1_score, roc_auc

       The current health endpoint may return:
       test_accuracy, test_precision, test_recall,
       test_f1, test_roc_auc
    */

    const accuracy =
        metrics.test_accuracy ??
        metrics.accuracy;

    const precision =
        metrics.test_precision ??
        metrics.precision;

    const recall =
        metrics.test_recall ??
        metrics.recall;

    const f1 =
        metrics.test_f1 ??
        metrics.f1_score;

    const rocAuc =
        metrics.test_roc_auc ??
        metrics.roc_auc;

    updateMetric("modelAccuracy", accuracy);
    updateMetric("modelPrecision", precision);
    updateMetric("modelRecall", recall);
    updateMetric("modelF1", f1);
    updateMetric("modelRocAuc", rocAuc);
}

function updateMetric(id, value) {
    const element = getElement(id);

    if (!element || value === undefined || value === null) {
        return;
    }

    let number = Number(value);

    if (!Number.isFinite(number)) return;

    /*
       Convert decimal metrics such as 0.89
       into percentage values such as 89%.
    */

    if (number <= 1) {
        number *= 100;
    }

    element.textContent = `${number.toFixed(2)}%`;
}


/* =========================
   SINGLE CUSTOMER PREDICTION
========================= */

function initializePredictionForm() {
    const form = getElement("predictionForm");

    if (!form) return;

    const result = getElement("predictionResult");
    const initialResultMarkup = result?.innerHTML ?? "";

    form.addEventListener("submit", async event => {
        event.preventDefault();

        await submitPrediction(form);
    });

    form.addEventListener("reset", () => {
        const formMessage = getElement("formMessage");

        if (result) {
            result.innerHTML = initialResultMarkup;
            showElement(result);
        }

        if (formMessage) {
            formMessage.textContent = "";
            formMessage.className = "form-message";
        }
    });
}

async function submitPrediction(form) {
    const formData = new FormData(form);

    const payload = {
        Age: Number(formData.get("Age")),
        Gender: formData.get("Gender"),
        AnnualIncome: Number(formData.get("AnnualIncome")),
        NumberOfPurchases: Number(
            formData.get("NumberOfPurchases")
        ),
        ProductCategory: formData.get("ProductCategory"),
        TimeSpentOnWebsite: Number(
            formData.get("TimeSpentOnWebsite")
        ),
        LoyaltyProgram: formData.get("LoyaltyProgram"),
        DiscountsAvailed: Number(
            formData.get("DiscountsAvailed")
        )
    };

    const validationError = validatePrediction(payload);

    if (validationError) {
        showToast(validationError, "warning");
        return;
    }

    const submitButton = $('button[type="submit"]', form);
    const originalButtonContent = submitButton?.innerHTML;

    try {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.setAttribute("aria-busy", "true");
            submitButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Predicting...';
        }

        const data = await apiRequest(API.predict, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (data.success === false) {
            throw new Error(
                data.error || "Prediction could not be generated."
            );
        }

        displayPredictionResult(data);

        showToast(
            "Customer prediction completed successfully.",
            "success"
        );

        void refreshDashboardData();

    } catch (error) {
        console.error("Prediction error:", error);

        showToast(error.message, "error");

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.removeAttribute("aria-busy");
            if (originalButtonContent !== null) {
                submitButton.innerHTML = originalButtonContent;
            }
        }
    }
}

function validatePrediction(data) {
    const requiredFields = [
        "Age",
        "Gender",
        "AnnualIncome",
        "NumberOfPurchases",
        "ProductCategory",
        "TimeSpentOnWebsite",
        "LoyaltyProgram",
        "DiscountsAvailed"
    ];

    for (const field of requiredFields) {
        if (
            data[field] === null ||
            data[field] === undefined ||
            data[field] === ""
        ) {
            return `Please provide ${field}.`;
        }
    }

    if (data.Age < 1 || data.Age > 120) {
        return "Age must be between 1 and 120.";
    }

    if (data.AnnualIncome < 0) {
        return "Annual income cannot be negative.";
    }

    if (data.NumberOfPurchases < 0) {
        return "Number of purchases cannot be negative.";
    }

    if (data.TimeSpentOnWebsite < 0) {
        return "Website time cannot be negative.";
    }

    if (data.DiscountsAvailed < 0) {
        return "Discounts availed cannot be negative.";
    }

    return null;
}

function displayPredictionResult(data) {
    const result = getElement("predictionResult");

    if (!result) return;

    const prediction = String(
        data.prediction ?? data.result ?? ""
    ).toLowerCase();

    const willBuy = [
        "1",
        "true",
        "yes",
        "will buy",
        "purchase",
        "likely"
    ].includes(prediction);

    const probability = Number(
        data.probability ??
        data.purchase_probability ??
        0
    );

    const safeProbability = Math.min(
        100,
        Math.max(0, probability)
    );

    const predictionLabel =
        willBuy ? "Will Purchase" : "Will Not Purchase";

    const resultClass =
        willBuy ? "prediction-success" : "prediction-danger";

    result.innerHTML = `
        <div class="result-card ${resultClass}">
            <div class="result-icon">
                ${willBuy ? "✓" : "✕"}
            </div>

            <div class="result-content">
                <span class="result-label">
                    Prediction Result
                </span>

                <h3>${predictionLabel}</h3>

                <p>
                    Purchase Probability:
                    <strong>${safeProbability.toFixed(2)}%</strong>
                </p>

                <div class="probability-track">
                    <div
                        class="probability-fill"
                        style="width: ${safeProbability}%"
                    ></div>
                </div>

                <div class="result-meta">
                    <span>
                        Prediction ID:
                        ${escapeHTML(data.prediction_id ?? "--")}
                    </span>

                    <span>
                        ${escapeHTML(formatDate(data.created_at))}
                    </span>
                </div>
            </div>
        </div>
    `;

    showElement(result);

    result.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


/* =========================
   BATCH PREDICTION
========================= */

function initializeBatchPrediction() {
    const form = getElement("batchPredictionForm");

    if (!form) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();

        await submitBatchPrediction(form);
    });

    const fileInput = getElement("batchFile");
    const uploadArea = $(".upload-area", form);

    if (fileInput) {
        fileInput.addEventListener("change", () => {
            updateSelectedBatchFile(fileInput.files[0], fileInput);
        });
    }

    if (uploadArea && fileInput) {
        ["dragenter", "dragover"].forEach(eventName => {
            uploadArea.addEventListener(eventName, event => {
                event.preventDefault();
                uploadArea.classList.add("drag-over");
            });
        });

        ["dragleave", "drop"].forEach(eventName => {
            uploadArea.addEventListener(eventName, event => {
                event.preventDefault();
                uploadArea.classList.remove("drag-over");
            });
        });

        uploadArea.addEventListener("drop", event => {
            const file = event.dataTransfer?.files[0];
            if (!file) return;

            const transfer = new DataTransfer();
            transfer.items.add(file);
            fileInput.files = transfer.files;
            updateSelectedBatchFile(file, fileInput);
        });
    }
}

function updateSelectedBatchFile(file, fileInput) {
    const selectedFile = getElement("selectedFile");
    const selectedFileName = getElement("selectedFileName");

    if (!file) {
        selectedFile?.classList.remove("show");
        if (selectedFileName) {
            selectedFileName.textContent = "No file selected";
        }
        return false;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
        showToast("Please select a CSV file.", "warning");
        fileInput.value = "";
        selectedFile?.classList.remove("show");
        return false;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast("CSV files must be 10 MB or smaller.", "warning");
        fileInput.value = "";
        selectedFile?.classList.remove("show");
        return false;
    }

    if (selectedFileName) {
        const sizeInKb = Math.max(1, Math.round(file.size / 1024));
        selectedFileName.textContent = `${file.name} (${formatNumber(sizeInKb)} KB)`;
    }
    selectedFile?.classList.add("show");
    return true;
}

async function submitBatchPrediction(form) {
    const fileInput = getElement("batchFile");

    if (!fileInput || !fileInput.files.length) {
        showToast("Please select a CSV file first.", "warning");
        return;
    }
    const file = fileInput.files[0];

    if (!updateSelectedBatchFile(file, fileInput)) {
        return;
    }

    const formData = new FormData();

    /*
       The backend should read the uploaded file
       using the key "file".
    */

    formData.append("file", file);

    const submitButton = getElement("batchSubmitButton");
    const originalButtonContent = submitButton?.innerHTML;

    try {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.setAttribute("aria-busy", "true");
            submitButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Processing CSV...';
        }

        const data = await apiRequest(API.batchPredict, {
            method: "POST",
            body: formData
        });

        if (data.success === false) {
            throw new Error(data.error || "Batch prediction failed.");
        }

        displayBatchResults(data);

        const failed = Number(data.failed ?? 0);
        const successful = Number(data.successfully_processed ?? 0);

        if (failed > 0 && successful === 0) {
            showToast(
                `No rows were processed successfully. ${failed} row(s) failed; see the results below.`,
                "error"
            );
        } else if (failed > 0) {
            showToast(
                `Batch completed with ${successful} successful and ${failed} failed row(s).`,
                "warning"
            );
        } else {
            showToast("Batch prediction completed successfully.", "success");
        }

        void refreshDashboardData();

    } catch (error) {
        console.error("Batch prediction error:", error);

        showToast(error.message, "error");

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.removeAttribute("aria-busy");
            if (originalButtonContent !== null) {
                submitButton.innerHTML = originalButtonContent;
            }
        }
    }
}

function displayBatchResults(data) {
    const container = getElement("batchResults");

    if (!container) return;

    const results =
        data.results ||
        data.predictions ||
        [];

    const total =
        data.total_rows ??
        data.total ??
        results.length;

    const successful =
        data.successfully_processed ??
        data.successful ??
        results.filter(item => item.success !== false).length;

    const failed =
        data.failed ??
        Math.max(0, total - successful);

    const willBuy =
        data.will_buy ??
        results.filter(item =>
            isPurchasePrediction(item.prediction)
        ).length;

    const willNotBuy =
        data.will_not_buy ??
        Math.max(0, successful - willBuy);

    container.innerHTML = `
        <div class="batch-summary-grid">
            <div class="batch-summary-card">
                <span>Total Rows</span>
                <strong>${formatNumber(total)}</strong>
            </div>

            <div class="batch-summary-card">
                <span>Processed</span>
                <strong>${formatNumber(successful)}</strong>
            </div>

            <div class="batch-summary-card">
                <span>Will Buy</span>
                <strong>${formatNumber(willBuy)}</strong>
            </div>

            <div class="batch-summary-card">
                <span>Will Not Buy</span>
                <strong>${formatNumber(willNotBuy)}</strong>
            </div>

            <div class="batch-summary-card">
                <span>Failed</span>
                <strong>${formatNumber(failed)}</strong>
            </div>
        </div>

        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Prediction</th>
                        <th>Probability</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    ${results.map((item, index) => {
                        const prediction =
                            item.prediction ?? "--";

                        const probability = item.probability === null ||
                            item.probability === undefined
                            ? null
                            : Number(item.probability);

                        const failedRow =
                            item.success === false ||
                            item.status === "failed";

                        return `
                            <tr>
                                <td>
                                    ${escapeHTML(
                                        item.row ??
                                        item.customer_id ??
                                        item.id ??
                                        `Row ${index + 1}`
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(prediction)}
                                </td>

                                <td>
                                    ${probability !== null &&
                                        Number.isFinite(probability)
                                        ? `${probability.toFixed(2)}%`
                                        : "--"}
                                </td>

                                <td>
                                    <span class="badge ${
                                        failedRow
                                            ? "badge-danger"
                                            : "badge-success"
                                    }">
                                        ${failedRow
                                            ? `Failed${item.error
                                                ? `: ${escapeHTML(item.error)}`
                                                : ""}`
                                            : "Success"}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;

    showElement(container);
}

function isPurchasePrediction(value) {
    const prediction = String(value).toLowerCase();

    return [
        "1",
        "true",
        "yes",
        "will buy",
        "purchase"
    ].includes(prediction);
}


/* =========================
   CSV TEMPLATE DOWNLOAD
========================= */

function downloadCSVTemplate() {
    const headers = [
        "Age",
        "Gender",
        "AnnualIncome",
        "NumberOfPurchases",
        "ProductCategory",
        "TimeSpentOnWebsite",
        "LoyaltyProgram",
        "DiscountsAvailed"
    ];

    const example = [
        "25",
        "Male",
        "50000",
        "5",
        "Electronics",
        "30",
        "Yes",
        "2"
    ];

    const csv = [
        headers.join(","),
        example.join(",")
    ].join("\n");

    downloadFile(
        csv,
        "customer_prediction_template.csv",
        "text/csv"
    );

    showToast("CSV template downloaded.", "success");
}


/* =========================
   DASHBOARD ANALYTICS
========================= */

async function loadDashboard() {
    try {
        const data = await apiRequest(API.analytics);

        updateDashboardStats(data);
        updateCharts(data);
        return true;

    } catch (error) {
        console.error("Dashboard analytics error:", error);
        return false;
    }
}

async function loadAnalytics() {
    try {
        const data = await apiRequest(API.analytics);

        updateDashboardStats(data);
        updateCharts(data);
        return true;

    } catch (error) {
        console.error("Analytics error:", error);

        showToast(
            "Unable to load analytics.",
            "error"
        );
        return false;
    }
}

function updateDashboardStats(data) {
    const stats = data.stats || data;
    const analytics = data.analytics || data;

    const mappings = {
        totalPredictions: [
            "total_predictions",
            "total"
        ],

        totalCustomers: [
            "total_customers"
        ],

        willBuyCount: [
            "will_buy",
            "purchase_count"
        ],

        willNotBuyCount: [
            "will_not_buy",
            "no_purchase_count"
        ],

        averageProbability: [
            "average_probability",
            "avg_probability"
        ],

        purchaseRate: [
            "purchase_rate"
        ]
    };

    Object.entries(mappings).forEach(([elementId, keys]) => {
        const element = getElement(elementId);

        if (!element) return;

        let value;

        for (const key of keys) {
            if (stats[key] !== undefined && stats[key] !== null) {
                value = stats[key];
                break;
            }
        }

        if (value === undefined) return;

        const isPercentage = [
            "averageProbability",
            "purchaseRate"
        ].includes(elementId);

        element.textContent = isPercentage
            ? `${Number(value).toFixed(2)}%`
            : formatNumber(value);
    });

    // Update analytics-specific stats
    const analyticsTotal = getElement("analyticsTotal");
    if (analyticsTotal && stats.total_predictions !== undefined) {
        analyticsTotal.textContent = formatNumber(stats.total_predictions);
    }

    const analyticsBuy = getElement("analyticsBuy");
    if (analyticsBuy && stats.will_buy !== undefined) {
        analyticsBuy.textContent = formatNumber(stats.will_buy);
    }

    const analyticsNotBuy = getElement("analyticsNotBuy");
    if (analyticsNotBuy && stats.will_not_buy !== undefined) {
        analyticsNotBuy.textContent = formatNumber(stats.will_not_buy);
    }

    const analyticsPurchaseRate = getElement("analyticsPurchaseRate");
    if (analyticsPurchaseRate && stats.purchase_rate !== undefined) {
        analyticsPurchaseRate.textContent = `${Number(stats.purchase_rate).toFixed(2)}%`;
    }

    const analyticsAverageProbability = getElement("analyticsAverageProbability");
    if (analyticsAverageProbability && stats.average_probability !== undefined) {
        analyticsAverageProbability.textContent = `${Number(stats.average_probability).toFixed(2)}%`;
    }

    // Update top category
    const categoryComparison =
        analytics.category_comparison ||
        analytics.purchase_comparison ||
        {};
    const topCategory = getElement("analyticsTopCategory");
    if (topCategory) {
        const categories = Object.entries(categoryComparison)
            .filter(([, count]) => Number(count) > 0);
        const maxCategory = categories.reduce(
            (highest, current) =>
                !highest || Number(current[1]) > Number(highest[1])
                    ? current
                    : highest,
            null
        );
        topCategory.textContent = maxCategory?.[0] || "-";
    }

    const insight = getElement("analyticsInsight");
    if (insight) {
        const total = Number(stats.total_predictions ?? stats.total ?? 0);

        if (!total) {
            insight.textContent =
                "No prediction records are available yet. Generate a single or batch prediction to start seeing customer and purchase insights.";
        } else {
            const purchaseRate = Number(stats.purchase_rate ?? 0);
            const averageProbability = Number(
                stats.average_probability ?? 0
            );
            const bestCategory = topCategory?.textContent;
            const categoryInsight = bestCategory && bestCategory !== "-"
                ? ` ${bestCategory} is the top category with ${formatNumber(categoryComparison[bestCategory])} predicted purchases.`
                : "";

            insight.textContent =
                `${formatNumber(total)} predictions analyzed. ` +
                `${purchaseRate.toFixed(1)}% are predicted purchases, ` +
                `with an average purchase probability of ` +
                `${averageProbability.toFixed(1)}%.${categoryInsight}`;
        }
    }
}


/* =========================
   CHARTS
   Requires Chart.js in index.html
========================= */

function updateCharts(data) {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js is not loaded.");
        return;
    }

    const analytics = data.analytics || data;

    const purchaseData =
        analytics.purchase_distribution ||
        analytics.prediction_distribution ||
        {};

    const comparisonData =
        analytics.purchase_distribution ||
        analytics.prediction_distribution ||
        {};

    const probabilityData =
        analytics.probability_distribution ||
        {};

    const categoryData =
        analytics.category_comparison ||
        analytics.purchase_comparison ||
        {};

    const loyaltyData = analytics.loyalty_analysis || [];

    const dailyActivityData =
        analytics.daily_activity ||
        [];

    createPurchaseDistributionChart(purchaseData);
    createPurchaseComparisonChart(comparisonData);
    createProbabilityChart(probabilityData);
    createCategoryChart(categoryData);
    createLoyaltyChart(loyaltyData);
    createDailyActivityChart(dailyActivityData);
}

function createPurchaseDistributionChart(data) {
    const canvas = getElement("purchaseDistributionChart");

    if (!canvas) return;

    const labels = Object.keys(data);
    const values = Object.values(data).map(Number);

    // Update legend values
    const buyValue = getElement("buyChartValue");
    const notBuyValue = getElement("notBuyChartValue");

    if (buyValue && data["Will Buy"] !== undefined) {
        buyValue.textContent = formatNumber(data["Will Buy"]);
    }
    if (notBuyValue && data["Will Not Buy"] !== undefined) {
        notBuyValue.textContent = formatNumber(data["Will Not Buy"]);
    }

    if (purchaseDistributionChart) {
        purchaseDistributionChart.destroy();
    }

    purchaseDistributionChart = new Chart(canvas, {
        type: "doughnut",

        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    "#dc2626",
                    "#f87171",
                    "#fecaca",
                    "#991b1b"
                ],
                borderWidth: 3,
                borderColor: "#ffffff",
                hoverOffset: 10
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            cutout: "68%",

            animation: {
                animateRotate: true,
                duration: 1200
            },

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

function createPurchaseComparisonChart(data) {
    const canvas = getElement("purchaseComparisonChart");

    if (!canvas) return;

    const labels = Object.keys(data);
    const values = Object.values(data).map(Number);

    if (purchaseComparisonChart) {
        purchaseComparisonChart.destroy();
    }

    purchaseComparisonChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels,
            datasets: [{
                label: "Customers",
                data: values,
                backgroundColor: [
                    "#dc2626",
                    "#f87171",
                    "#fca5a5",
                    "#991b1b"
                ],
                borderRadius: 8,
                maxBarThickness: 55
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            animation: {
                duration: 1200
            },

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

function createProbabilityChart(data) {
    const canvas = getElement("probabilityChart");

    if (!canvas) return;

    const labels = Object.keys(data);
    const values = Object.values(data).map(Number);

    if (probabilityChart) {
        probabilityChart.destroy();
    }

    probabilityChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels,
            datasets: [{
                label: "Predictions",
                data: values,
                backgroundColor: [
                    "#fecaca",
                    "#f87171",
                    "#ef4444",
                    "#dc2626",
                    "#991b1b"
                ],
                borderRadius: 8,
                maxBarThickness: 55
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            animation: {
                duration: 1400
            },

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createCategoryChart(data) {
    const canvas = getElement("categoryChart");

    if (!canvas) return;

    const labels = Object.keys(data);
    const values = Object.values(data).map(Number);

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels,
            datasets: [{
                label: "Purchases",
                data: values,
                backgroundColor: [
                    "#dc2626",
                    "#ef4444",
                    "#f87171",
                    "#fca5a5",
                    "#fecaca"
                ],
                borderRadius: 8,
                maxBarThickness: 55
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            animation: {
                duration: 1200
            },

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

function createLoyaltyChart(data) {
    const canvas = getElement("loyaltyChart");

    if (!canvas) return;

    const labels = data.map(item => item.loyalty_program);
    const willBuy = data.map(item => Number(item.will_buy));
    const willNotBuy = data.map(item => Number(item.will_not_buy));

    if (loyaltyChart) {
        loyaltyChart.destroy();
    }

    loyaltyChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels,
            datasets: [
                {
                    label: "Will Buy",
                    data: willBuy,
                    backgroundColor: "#16a36a",
                    borderRadius: 6
                },
                {
                    label: "Will Not Buy",
                    data: willNotBuy,
                    backgroundColor: "#d92332",
                    borderRadius: 6
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1200 },

            plugins: {
                legend: { position: "bottom" }
            },
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

function createDailyActivityChart(data) {
    const canvas = getElement("dailyActivityChart");

    if (!canvas) return;

    const labels = data.map(item => {
        const date = new Date(`${item.date}T00:00:00`);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short"
        });
    });
    const values = data.map(item => item.count);

    if (dailyActivityChart) {
        dailyActivityChart.destroy();
    }

    dailyActivityChart = new Chart(canvas, {
        type: "line",

        data: {
            labels,
            datasets: [{
                label: "Predictions",
                data: values,
                borderColor: "#dc2626",
                backgroundColor: "rgba(220, 38, 38, 0.12)",
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            animation: {
                duration: 1400
            },

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}


/* =========================
   PREDICTION HISTORY
========================= */

async function loadHistory() {
    try {
        const data = await apiRequest(API.history);

        historyRecords = Array.isArray(data)
            ? data
            : data.history || data.records || [];

        renderHistory(historyRecords);

    } catch (error) {
        console.error("History loading error:", error);

        showToast(
            "Unable to load prediction history.",
            "error"
        );
    }
}

function renderHistory(records) {
    const tbody = getElement("historyTableBody");

    if (!tbody) return;

    if (!records.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    No prediction records found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = records.map(record => {
        const prediction =
            record.prediction ?? record.result ?? "--";

        const probability = Number(
            record.probability ?? 0
        );

        return `
            <tr>
                <td>
                    ${escapeHTML(
                        record.id ??
                        record.prediction_id ??
                        "--"
                    )}
                </td>

                <td>
                    ${escapeHTML(record.Gender ?? record.gender ?? "--")}
                </td>

                <td>
                    ${escapeHTML(
                        record.ProductCategory ??
                        record.product_category ??
                        "--"
                    )}
                </td>

                <td>
                    ${escapeHTML(prediction)}
                </td>

                <td>
                    ${Number.isFinite(probability)
                        ? `${probability.toFixed(2)}%`
                        : "--"}
                </td>

                <td>
                    ${escapeHTML(
                        formatDate(
                            record.created_at ??
                            record.timestamp
                        )
                    )}
                </td>

                <td>
                    <button
                        class="btn btn-sm btn-outline"
                        data-view-id="${escapeHTML(
                            record.id ?? record.prediction_id ?? ""
                        )}"
                    >
                        View
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    $$("[data-view-id]", tbody).forEach(button => {
        button.addEventListener("click", () => {
            viewHistoryDetails(button.dataset.viewId);
        });
    });
}


/* =========================
   HISTORY SEARCH AND FILTER
========================= */

function initializeHistoryFilters() {
    const search = getElement("historySearch");
    const filter = getElement("historyFilter");

    if (search) {
        search.addEventListener("input", filterHistory);
    }

    if (filter) {
        filter.addEventListener("change", () => {
            currentHistoryFilter = filter.value;
            filterHistory();
        });
    }
}

function filterHistory() {
    const searchValue = (
        getElement("historySearch")?.value || ""
    ).toLowerCase();

    const filtered = historyRecords.filter(record => {
        const searchable = JSON.stringify(record).toLowerCase();

        const matchesSearch =
            searchable.includes(searchValue);

        const prediction = String(
            record.prediction ?? record.result ?? ""
        ).toLowerCase();

        let matchesFilter = true;

        if (currentHistoryFilter === "will_buy") {
            matchesFilter = isPurchasePrediction(prediction);
        }

        if (currentHistoryFilter === "will_not_buy") {
            matchesFilter = !isPurchasePrediction(prediction);
        }

        return matchesSearch && matchesFilter;
    });

    renderHistory(filtered);
}


/* =========================
   HISTORY DETAILS MODAL
========================= */

async function viewHistoryDetails(id) {
    if (!id) return;

    try {
        const data = await apiRequest(
            `${API.history}/${encodeURIComponent(id)}`
        );

        const record = data.record || data;

        displayHistoryModal(record);

    } catch (error) {
        console.error("History details error:", error);

        showToast(
            "Unable to retrieve prediction details.",
            "error"
        );
    }
}

function displayHistoryModal(record) {
    let modal = getElement("historyDetailsModal");

    if (!modal) {
        modal = document.createElement("div");

        modal.id = "historyDetailsModal";
        modal.className = "modal";

        document.body.appendChild(modal);
    }

    const excludedKeys = [];

    const fields = Object.entries(record)
        .filter(([key]) => !excludedKeys.includes(key));

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Prediction Details</h3>

                <button
                    class="modal-close"
                    aria-label="Close modal"
                >
                    &times;
                </button>
            </div>

            <div class="modal-body">
                <div class="details-grid">
                    ${fields.map(([key, value]) => `
                        <div class="detail-item">
                            <span>${escapeHTML(key)}</span>
                            <strong>${escapeHTML(value)}</strong>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `;

    showElement(modal);
    modal.classList.add("active");

    $(".modal-close", modal).addEventListener("click", () => {
        modal.classList.remove("active");
    });

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.classList.remove("active");
        }
    });
}


/* =========================
   CSV EXPORT
========================= */

function initializeExport() {
    const exportButton = getElement("exportHistory");

    if (exportButton) {
        exportButton.addEventListener("click", exportHistory);
    }
}

async function exportHistory() {
    try {
        const response = await fetch(API.historyExport);

        if (!response.ok) {
            throw new Error("Unable to export history.");
        }

        const blob = await response.blob();

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "customer_prediction_history.csv";

        document.body.appendChild(link);
        link.click();

        link.remove();

        URL.revokeObjectURL(url);

        showToast("History exported successfully.", "success");

    } catch (error) {
        console.error("Export error:", error);

        showToast(error.message, "error");
    }
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob(
        [content],
        { type: mimeType }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}


/* =========================
   REFRESH CONTROLS
========================= */

async function refreshDashboardData() {
    const activeSection = $(".dashboard-section.active")?.id;
    const requests = [
        loadHealth(),
        activeSection === "analytics"
            ? loadAnalytics()
            : loadDashboard(),
        loadHistory()
    ];

    await Promise.allSettled(requests);
}

function initializeRefreshButtons() {
    const refreshButton = getElement("refreshDashboard");

    if (refreshButton) {
        refreshButton.addEventListener("click", async () => {
            refreshButton.classList.add("rotating");

            await refreshDashboardData();

            refreshButton.classList.remove("rotating");

            showToast(
                "Dashboard refreshed.",
                "success"
            );
        });
    }

    const refreshAnalytics = getElement("refreshAnalytics");

    if (refreshAnalytics) {
        refreshAnalytics.addEventListener("click", async () => {
            refreshAnalytics.classList.add("rotating");

            try {
                const loaded = await loadAnalytics();
                if (loaded) {
                    showToast("Analytics refreshed.", "success");
                }
            } finally {
                refreshAnalytics.classList.remove("rotating");
            }
        });
    }
}


/* =========================
   ANIMATED NUMBER COUNTERS
========================= */

function animateCounter(element, targetValue) {
    if (!element) return;

    const target = Number(targetValue);

    if (!Number.isFinite(target)) return;

    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;

        const progress = Math.min(
            elapsed / duration,
            1
        );

        const eased = 1 - Math.pow(1 - progress, 3);

        const currentValue = target * eased;

        element.textContent = Math.round(
            currentValue
        ).toLocaleString("en-IN");

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}


/* =========================
   CURRENT DATE
========================= */

function displayCurrentDate() {
    const element = getElement("currentDate");

    if (!element) return;

    element.textContent = new Date().toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


/* =========================
   INITIALIZE APPLICATION
========================= */

document.addEventListener("DOMContentLoaded", async () => {
    console.log(
        "%cCustomer Purchase Prediction Dashboard",
        "color:#dc2626;font-size:18px;font-weight:bold;"
    );

    // Hide app loader after page loads
    const appLoader = getElement("appLoader");
    if (appLoader) {
        setTimeout(() => {
            appLoader.classList.add("hide");
        }, 1500);
    }

    initializeNavigation();

    initializePredictionForm();

    initializeBatchPrediction();

    initializeHistoryFilters();

    initializeExport();

    initializeRefreshButtons();

    displayCurrentDate();

    const templateButton = getElement("downloadTemplate");

    if (templateButton) {
        templateButton.addEventListener(
            "click",
            downloadCSVTemplate
        );
    }

    await refreshDashboardData();

    /*
       Automatically refresh system health.
    */

    setInterval(loadHealth, REFRESH_INTERVAL);

    console.log("Dashboard initialized successfully.");
});