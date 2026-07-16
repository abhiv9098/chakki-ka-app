# Chakki Mitra (चक्की मित्र) 🌾

Chakki Mitra is a professional native Android application designed for **Flour Mill (Atta Chakki)** owners to manage their customers, daily grinding orders, ledger accounts (Khata), and business reports. It features complete bilingual support (English & Hindi) and a modern Material Design 3 interface with a Green theme.

---

## 🚀 Key Features

*   **Bilingual Localization:** Complete English & Hindi font/labels support. Prompted on first launch and switchable anytime from settings.
*   **Business Dashboard:** View today's total orders, earnings, customer directory status, and outstanding credit (Khata) at a glance.
*   **Interactive Grinding Orders:** Log customer details, weights, rates per kg, auto-calculate totals, and choose cash/credit billing.
*   **Customer & Ledger Management:** Search customer details, track grinding history, add manual credits, log customer payments, and track live outstanding balances.
*   **Intelligent Business Reports:** Live daily, weekly, and monthly earnings analysis, along with grain performance distribution metrics.
*   **PDF Invoice Generator:** Generate premium PDF bills in the background and view them.
*   **WhatsApp Sharing:** Share generated bills directly to WhatsApp or general messaging channels.
*   **Backup & Restore:** Locally export the database structure to a single JSON backup file and restore it from settings.
*   **Dark Mode Support:** Smooth night usage theme toggle.

---

## 🛠️ Technology Stack & Architecture

*   **Programming Language:** Kotlin
*   **IDE:** Android Studio (supported on Hedgehog / Iguana / Jellyfish / Ladybug+)
*   **Database:** Room ORM with SQLITE
*   **UI Components:** XML with Material Design 3 and ViewBinding
*   **Architecture Pattern:** MVVM (Model-View-ViewModel) with Repository pattern
*   **Navigation:** Jetpack Navigation Component
*   **Multilingual Support:** Localization resources (`values/strings.xml` and `values-hi/strings.xml`)

---

## 📂 Project Structure

All files are structured cleanly in standard Android Studio package configurations:
```text
Chakki Mitra/
├── app/
│   ├── build.gradle.kts          # App dependencies (Room, Navigation, Material3)
│   └── src/main/
│       ├── AndroidManifest.xml   # Application manifest and FileProvider configuration
│       ├── java/com/chakkimitra/app/
│       │   ├── ChakkiApp.kt      # Application initialization & Dark Mode prefs
│       │   ├── data/
│       │   │   ├── local/
│       │   │   │   ├── dao/             # Room Database access interfaces
│       │   │   │   │   ├── CustomerDao.kt
│       │   │   │   │   ├── OrderDao.kt
│       │   │   │   │   └── CreditDao.kt
│       │   │   │   ├── entity/          # Room DB entity classes
│       │   │   │   │   ├── Customer.kt
│       │   │   │   │   ├── Order.kt
│       │   │   │   │   └── CreditRecord.kt
│       │   │   │   └── AppDatabase.kt   # Database class with singleton builder
│       │   │   └── repository/
│       │   │       └── ChakkiRepository.kt # Combined repository logic
│       │   ├── ui/
│       │   │   ├── adapter/             # RecyclerView item adapters
│       │   │   │   ├── CustomerAdapter.kt
│       │   │   │   ├── OrderAdapter.kt
│       │   │   │   └── CreditRecordAdapter.kt
│       │   │   ├── credit/              # Khata fragment & viewmodel
│       │   │   ├── customer/            # Customer directories fragments
│       │   │   ├── dashboard/           # Dashboard views & quick cards
│       │   │   ├── language/            # Language selection activities
│       │   │   ├── order/               # Placing order fragments
│       │   │   ├── reports/             # Daily/weekly/monthly stats
│       │   │   ├── settings/            # Backup, dark mode, language controls
│       │   │   └── MainActivity.kt      # Toolbar & bottom navigation host
│       │   └── utils/
│       │       ├── BackupRestoreHelper.kt  # Local JSON Backup/Restore functions
│       │       ├── LocaleHelper.kt         # Runtime language config utility
│       │       ├── PdfGenerator.kt         # Native PDF canvas invoice renderer
│       │       └── PreferencesManager.kt   # SharedPreferences manager
│       └── res/
│           ├── drawable/                   # UI backgrounds and shape vectors
│           ├── layout/                     # XML view files
│           ├── menu/                       # Bottom navigation menu mappings
│           ├── navigation/                 # Jetpack navigation controller graph
│           ├── xml/                        # Backup permissions and file sharing directories
│           ├── values/                     # Colors, themes, and English strings
│           └── values-hi/                  # Hindi translated strings
├── gradle/
│   └── libs.versions.toml        # Gradle Version Catalog configurations
├── settings.gradle.kts           # Gradle plugin management
└── build.gradle.kts              # Top-level dependencies configurations
```

---

## 💻 Step-by-Step Setup Guide

Follow these steps to load and run the project:

### Step 1: Open the Project in Android Studio
1. Launch **Android Studio**.
2. Select **File -> Open...** (or click **Open** on the Welcome screen).
3. Select the root folder where these files are located (`C:\Users\abhi\Desktop\chakki ka app`).
4. Wait for Android Studio to sync the Gradle build files.

### Step 2: Set SDK and JDK Settings
1. Go to **File -> Settings** (or **Android Studio -> Preferences** on macOS).
2. Go to **Build, Execution, Deployment -> Build Tools -> Gradle**.
3. Set the **Gradle JDK** to version **17** (or above) as required by newer Android Gradle plugin versions.
4. Go to **File -> Project Structure** and verify that your **SDK Version** is set to Android API 34.

### Step 3: Run the Application
1. Connect a physical Android device via USB (with **USB Debugging** enabled in Developer Options) OR start an Android Virtual Device (AVD Emulator).
2. Select `app` in the run configurations dropdown in the top toolbar.
3. Click the green **Run** button (or press `Shift + F10`).
4. The app will build, install, and open the Language Selection screen!

---

## 🛡️ Data Backup & Share Guidelines

1. **Backup File Location:** When you click **Backup Data** in Settings, the app generates a `ChakkiMitra_Backup.json` file inside the local app folder (`/Android/data/com.chakkimitra.app/files/`).
2. **Restore:** Place a valid `ChakkiMitra_Backup.json` file in that folder, and click **Restore Data** in Settings to reset your database values.
3. **Sharing Invoices:** The app uses Android's modern `FileProvider` to share PDF bills. When you share via WhatsApp, the secure file URI is temporarily shared with the platform, complying with target SDK 34 permissions.
