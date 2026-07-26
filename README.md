# Neuro-Diet

**Neuro-Diet is a mobile app that recommends Indian food, workouts, and mindfulness exercises based on both your physical goals (like muscle gain or fat loss) and your mental/cognitive goals (like focus or stress reduction).**

If you've never touched this project before, this document is written for you. It explains what the app does, how its two halves talk to each other, and exactly how to get it running on your own machine — no prior context assumed.

---

## Table of Contents

1. [What this project actually is](#1-what-this-project-actually-is)
2. [The big picture: two separate programs working together](#2-the-big-picture-two-separate-programs-working-together)
3. [Tech stack, explained](#3-tech-stack-explained)
4. [What the app can do (feature tour)](#4-what-the-app-can-do-feature-tour)
5. [Project structure](#5-project-structure)
6. [Running it yourself](#6-running-it-yourself)
7. [Where the food/exercise data comes from](#7-where-the-foodexercise-data-comes-from)
8. [Known quirks & things to watch out for](#8-known-quirks--things-to-watch-out-for)

---

## 1. What this project actually is

Most diet/fitness apps treat "what should I eat" and "how should I train" as two unrelated questions, and almost none of them are tuned for Indian cuisine specifically (most nutrition databases are US-centric).

Neuro-Diet asks a different question: **given what you want physically *and* mentally, what's the single best plan?** A user picks a physical goal (Muscle Gain, Fat Loss, Stamina/Endurance) *and* a cognitive goal (Enhance Focus, Stress Reduction, Improve Sleep, Reduce Brain Fog) during onboarding, and every recommendation — meals, exercises, mindfulness sessions — is scored against **both** goals at once, using real nutrient data (protein, carbs, magnesium, zinc, omega-3, L-theanine, flavonoids) and a curated database of Indian staple foods.

It's a portfolio/learning project, not a published commercial app — there's no real backend server, no real user accounts on a company's servers, and no App Store listing. Everything runs locally on your own computer.

## 2. The big picture: two separate programs working together

This repository actually contains **two independent projects** that only communicate over a local network connection:

```
┌─────────────────────────┐         HTTP requests        ┌──────────────────────────┐
│   neuro-diet/            │  ────────────────────────▶  │  neuro-diet-backend/     │
│   (the app you see)      │  ◀────────────────────────   │  (the "brain")           │
│                           │         JSON responses       │                          │
│  React Native + Expo      │                               │  Python + FastAPI        │
│  Runs on your phone/      │                               │  A small API server that │
│  browser as the UI        │                               │  answers questions like  │
│                           │                               │  "give me 5 meals for a  │
│                           │                               │  vegetarian trying to    │
│                           │                               │  gain muscle and focus"  │
└─────────────────────────┘                               └──────────────────────────┘
```

- **`neuro-diet/`** is the app itself — every screen you tap through (login, onboarding, dashboard, meal plans, exercises, profile). It has **no food or exercise data of its own**; it just displays whatever the backend sends it and lets you log in, favorite things, track streaks, etc. All of that user-specific data (accounts, goals, favorites, history) is stored **only on your own device** (browser local storage / on-device storage), never sent to any external server.
- **`neuro-diet-backend/`** is a small Python web server. It owns the actual food and exercise database and does the "smart" part: given your goals, it ranks hundreds of foods/exercises by how well they match, and returns the best ones.

**Both must be running at the same time** for the app to show real data — the frontend literally can't work without the backend answering its requests (though the login/onboarding/profile screens will still work, since those don't need food or exercise data).

## 3. Tech stack, explained

If you're unfamiliar with any of these, here's the one-sentence version of each:

| Piece | What it is | Why it's here |
|---|---|---|
| **React Native** | A framework for building mobile apps using JavaScript/TypeScript instead of native Swift/Kotlin | Lets one codebase run on iOS, Android, *and* a web browser |
| **Expo** | A toolkit built on top of React Native that handles a lot of the native-device plumbing for you | Makes it possible to run the app in a normal web browser during development, no phone required |
| **TypeScript** | JavaScript with type-checking added | Catches a whole category of bugs (wrong types, typos in property names) before the app even runs |
| **Zustand** | A small state-management library | Holds the app's shared data (current user, onboarding answers, favorites, theme) in one place that any screen can read/update |
| **FastAPI** | A Python web framework for building APIs | Powers the backend server that answers "what should I eat/do" questions |
| **SQLAlchemy + SQLite** | An ORM (lets Python code talk to a database using Python objects instead of raw SQL) + a lightweight, file-based database | Stores the ~900 foods and exercises the recommendations are drawn from, in a single portable `.db` file |
| **pandas** | A data-analysis library | Used one time, offline, to clean and merge the raw USDA/FooDB nutrition spreadsheets into the SQLite database |

## 4. What the app can do (feature tour)

**Authentication** — Register with a username, email, and password, or log in. Passwords are SHA-256 hashed before being stored (this is a local demo app, not a bank — treat it as "basic" auth, not production-grade security). Each account keeps its own separate onboarding answers, goals, favorites, and history; switching accounts on the same device never mixes up one person's data with another's.

**Onboarding questionnaire** — A multi-step, mandatory-answer questionnaire (with Back/Next navigation and a color-coded progress bar) covering: cognitive goal, physical goal, diet (vegetarian/non-vegetarian), gender (with an optional menstrual-cycle-day question for cycle-aware recommendations), age, activity level, workout experience, sleep quality, stress level, and daily screen time (with research-backed feedback on how screen time affects focus/stress/sleep). Ends with picking one of 25 avatar images.

**Dashboard (Home)** — A personalized daily overview: today's step count and estimated calories burned (via the phone's pedometer, where available), today's recommended meal/exercise/mindfulness session, daily calorie/macro targets (computed from your actual weight/height/age via the Mifflin-St Jeor formula), a weekly mindfulness challenge, a "Digital Wellbeing" card with research-cited screen-time advice, a mood logger, a 7-day trend chart, and dynamic trophies/achievements.

**Meal Plans** — Two tabs: synthesized Indian recipes (e.g. Palak Paneer, Chana Masala, Rajma Chawal) and raw ingredients, each ranked by how well they serve *both* your physical and cognitive goals. Cards flip over to show the science: which specific compound (L-Theanine, Magnesium, Omega-3, Zinc, Flavonoids) the food is rich in and how many milligrams, scaled to your current portion size. A portion stepper live-recalculates macros; favoriting and filtering are built in.

**Exercises** — Physical exercises (strength, cardio, stretching) and mindfulness/breathing sessions, filtered by category and capped to your stated experience level. Includes a rest timer with an animated progress ring, a breathing-guide animation for mindfulness sessions, drag-to-reorder favorites, and an undo-able "mark done" action that feeds your streak.

**Profile** — Editable bio and avatar, a level/XP bar that grows with your total completed sessions, lifetime stats (sessions, best streak, favorites, member-since date), a 5-week activity heatmap, dynamic achievement badges, and a full settings panel: dark mode, metric/imperial units, reminder notifications on/off, update weight & height, change password, export your own data as JSON, share your progress, restart onboarding, log out, and delete account.

**Camera (placeholder)** — A visual mockup of a planned "scan your meal" feature. It does not currently perform any real image recognition; it's a static screen describing what that feature would eventually do.

## 5. Project structure

```
EEG/
├── README.md                    ← you are here
├── .gitignore                   ← root-level, covers both projects
│
├── neuro-diet/                  ← the mobile app (frontend)
│   ├── App.tsx                  ← app entry point (font loading, error boundary, portals)
│   ├── app.json                 ← Expo configuration
│   ├── package.json             ← JS/TS dependencies
│   └── src/
│       ├── screens/             ← one file per screen (Auth, Onboarding, Dashboard, MealPlans, Exercises, Profile, Camera)
│       ├── navigation/          ← how screens are wired together (AppNavigator, TabNavigator)
│       ├── components/          ← reusable UI pieces (buttons, cards, counters, progress rings, toasts...)
│       ├── store/               ← Zustand stores: useAppStore (per-account app data), useAuthStore (accounts/sessions), useToastStore
│       ├── theme/                ← colors, spacing, shared style helpers
│       ├── utils/                ← nutrition math (BMR/TDEE), screen-time research helpers
│       └── constants/            ← the 25 avatar image references
│
└── neuro-diet-backend/          ← the API server (backend)
    ├── main.py                  ← the FastAPI app + both API endpoints
    ├── models.py                ← database table definitions (SQLAlchemy)
    ├── etl.py                   ← one-time script that builds the food database from raw USDA/FooDB CSVs
    ├── exercises_etl.py         ← same idea, for the exercise database
    ├── indian_foods_supplement.py    ← ~40 hand-curated Indian foods not well-covered by USDA data
    ├── mindfulness_supplement.py     ← ~20 hand-curated mindfulness/breathing exercises
    ├── engine.py                 ← (legacy) simpler recommendation logic, superseded by main.py's ranking
    ├── requirements.txt          ← Python dependencies
    └── neuro_diet.db             ← the pre-built SQLite database (ships with the repo, ready to use)
```

## 6. Running it yourself

You need two things running **at the same time**, in **two separate terminals**.

### Step 1 — Start the backend (the "brain")

```bash
cd neuro-diet-backend
python -m venv venv
```

Activate the virtual environment:
- **Windows (PowerShell):** `venv\Scripts\Activate.ps1`
- **macOS/Linux:** `source venv/bin/activate`

Then install dependencies and start the server:

```bash
pip install -r requirements.txt
python main.py
```

You should see `Uvicorn running on http://127.0.0.1:8090`. Leave this terminal open.

> **Note:** the backend used to default to port 8080, but on some machines that port is already claimed by other local software (VPN clients, ad-blockers, and similar tools commonly use it), which silently breaks *all* of that software's network traffic while the backend is running. It now defaults to **8090** to avoid that collision. If you ever change the port, update it in every `API_URL`/`PROTOCOL_URL`/`EXERCISE_URL` constant in `neuro-diet/src/screens/*.tsx` to match.

### Step 2 — Start the frontend (the app)

In a **new** terminal:

```bash
cd neuro-diet
npm install
npx expo start --web
```

This opens the app in your browser at `http://localhost:8081`. You can also scan the QR code it prints with the **Expo Go** app on your phone to run it on a real device (on the same Wi-Fi network as your computer) — just be aware the backend URLs are currently hardcoded to `127.0.0.1`, which only means "this machine," so a physical phone won't be able to reach a backend running on your laptop without changing those URLs to your computer's actual local network IP address.

### Step 3 — Use the app

Register a new account, complete the onboarding questionnaire, and you'll land on the dashboard with real, personalized meal and exercise recommendations pulled live from the backend.

## 7. Where the food/exercise data comes from

The pre-built `neuro_diet.db` file already contains everything the app needs — you don't have to do anything extra to get real data. For context on how it was built:

- **Nutrition data** is merged from the **USDA FoodData Central** database (standard macros: calories, protein, carbs, fat) and **FooDB** (neuro-active compounds: omega-3, flavonoids, zinc, magnesium, L-theanine), plus ~40 Indian foods that are hand-curated in `indian_foods_supplement.py` because mainstream US nutrition databases under-represent Indian cuisine.
- **Exercise data** comes from the open-source **free-exercise-db** project, plus ~20 hand-curated mindfulness/breathing exercises.
- The scripts that do this merging (`etl.py`, `exercises_etl.py`) expect the *raw* USDA/FooDB CSV exports in a `data/` folder, which are large public downloads **not included in this repo** (that's what the root `.gitignore`'s `neuro-diet-backend/data/` rule is for). You only need to run these scripts if you want to rebuild the database from scratch with different source data; otherwise the shipped `.db` file is all you need.

## 8. Known quirks & things to watch out for

- **Both servers must be running.** If you only start the frontend, the app still loads and you can register/log in/onboard, but the Dashboard, Meal Plans, and Exercises screens will show fetch errors instead of data.
- **Haptics (vibration feedback) are a no-op in a web browser.** They only actually do something on a real iOS/Android device via Expo Go or a built app. Don't be alarmed if you don't feel anything while testing in a browser.
- **The phone step-counter (pedometer) is unavailable on web** for the same reason — it requires real device hardware, so step count shows 0 in a browser.
- **This is local-only data, not a real backend service.** There's no cloud database, no real password-reset emails, no analytics being sent anywhere. Everything lives in your browser's local storage (or your phone's on-device storage) and disappears if you clear that storage.
- **The Camera screen is a visual mockup**, not a working feature — see the feature tour above.
