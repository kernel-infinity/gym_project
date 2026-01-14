# 💪 GymPal - Mobilna Aplikacija za Praćenje Treninga

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native"/>
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
</p>

**GymPal** je moderna mobilna aplikacija za praćenje teretana treninga, dizajnirana sa fokusom na **odličan UX/UI** i **potpunu offline funkcionalnost**. Aplikacija omogućava korisnicima da kreiraju vlastite vježbe, sastavljaju trening programe i prate svoj napredak - sve bez potrebe za internet konekcijom.

---

## ✨ Ključne Karakteristike

### 🎯 Potpuno Offline Iskustvo
- **Lokalna SQLite baza** - svi podaci se čuvaju sigurno na vašem uređaju
- **Bez potrebe za internetom** - trenirajte bilo gdje, bilo kada
- **Brzo i responzivno** - nema čekanja na server odgovore

### 🏋️ Upravljanje Vježbama
- **Kreiranje vlastitih vježbi** - dodajte vježbe koje odgovaraju vašem stilu treninga
- **Baza predefiniranih vježbi** - započnite sa gotovim vježbama
- **Kategorizacija po mišićnim grupama** - lako pronađite željenu vježbu
- **Detalji vježbe** - oprema, upute, bilješke

### 📋 Trening Programi
- **Kreirajte vlastite programe** - sastavite treninge prema vašim ciljevima
- **Fleksibilna struktura** - dodajte vježbe, setove, ponavljanja i težine
- **Praćenje RPE** - evidentirajte intenzitet treninga
- **Status treninga** - planirano, u toku, završeno

### 📊 Praćenje Napretka
- **Sedmični ciljevi** - postavite i pratite broj treninga tjedno
- **Tjelesne metrike** - evidentirajte težinu i postotak masti
- **Historija treninga** - pregledajte sve prošle treninge
- **Vizualni prikaz napretka** - progress bar i statistike

### 🎨 Moderan UI/UX Dizajn
- **Čist i intuitivan interfejs** - lako za korištenje
- **Konzistentan dizajn sistem** - profesionalan izgled
- **Responzivan layout** - prilagođen svim veličinama ekrana
- **Prijatne boje i tipografija** - ugodan vizualni doživljaj

---

## 📱 Ekrani Aplikacije

| Ekran | Opis |
|-------|------|
| **Login/Registracija** | Sigurna autentifikacija sa lokalnom bazom |
| **Dashboard** | Pregled sedmičnog cilja, statistike i nedavnih treninga |
| **Treninzi** | Lista svih treninga sa statusom i akcijama |
| **Kreiranje Treninga** | Forma za novi trening sa vježbama i setovima |
| **Detalji Treninga** | Prikaz vježbi, setova i mogućnost pokretanja |
| **Sedmični Ciljevi** | Postavljanje i praćenje sedmičnih ciljeva |
| **Tjelesne Metrike** | Evidencija težine i tjelesne masti |
| **Profil** | Korisničke postavke i jedinice mjere |

---

## 🛠 Tehnologije

| Tehnologija | Namjena |
|-------------|---------|
| **React Native** | Cross-platform mobilni framework |
| **Expo** | Razvojno okruženje i build alati |
| **TypeScript** | Type-safe JavaScript |
| **Expo SQLite** | Lokalna relaciona baza podataka |
| **AsyncStorage** | Perzistentno čuvanje sesije |
| **React Navigation** | Navigacija između ekrana |

---

## 🗄️ Struktura Baze Podataka

```sql
-- Korisnici
users (id, name, email, password, weight_unit, height_unit)

-- Vježbe (preddefinirane + korisničke)
exercises (id, name, description, muscle_group, equipment, instructions)

-- Treninzi
workouts (id, user_id, name, notes, status, scheduled_at, started_at, completed_at)

-- Vježbe u treningu
workout_exercises (id, workout_id, exercise_id, order_num, notes)

-- Setovi
exercise_sets (id, workout_exercise_id, set_number, weight, reps, rpe, completed)

-- Sedmični ciljevi
weekly_goals (id, user_id, week_start, target_workouts, completed_workouts, notes)

-- Tjelesne metrike
body_metrics (id, user_id, recorded_at, weight, body_fat_percentage, notes)
```

---

## 🚀 Instalacija i Pokretanje

### Preduvjeti
- Node.js v18+
- npm ili yarn
- Expo Go aplikacija na mobilnom uređaju

### Koraci

```bash
# 1. Kloniraj repozitorij
git clone <repo-url>

# 2. Navigiraj u folder
cd gympal-mobile

# 3. Instaliraj dependencies
npm install

# 4. Pokreni aplikaciju
npx expo start
```

### Pokretanje na uređaju

1. Instaliraj **Expo Go** aplikaciju (App Store / Google Play)
2. Skeniraj QR kod iz terminala
3. Aplikacija će se učitati na vašem uređaju

---

## 🔐 Demo Pristup

Aplikacija automatski kreira demo korisnika pri prvom pokretanju:

```
📧 Email: demo@gympal.com
🔑 Lozinka: demo123
```

Demo podaci uključuju:
- ✅ 10 predefiniranih vježbi
- ✅ 3 primjera treninga
- ✅ Sedmični cilj
- ✅ Početne tjelesne metrike

---

## 📁 Struktura Projekta

```
gympal-mobile/
├── App.tsx                      # Glavni entry point
├── src/
│   ├── components/
│   │   └── ui/                  # Reusable UI komponente
│   │       ├── Button.tsx       # Dugme sa varijantama
│   │       ├── Input.tsx        # Text input polje
│   │       └── Card.tsx         # Card kontejner
│   ├── context/
│   │   └── LocalAuthContext.tsx # Auth state management
│   ├── database/
│   │   ├── database.ts          # SQLite shema i inicijalizacija
│   │   └── localServices.ts     # CRUD operacije
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Stack i Tab navigacija
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   └── main/
│   │       ├── DashboardScreen.tsx
│   │       ├── WorkoutsScreen.tsx
│   │       ├── CreateWorkoutScreen.tsx
│   │       ├── WorkoutDetailScreen.tsx
│   │       ├── WeeklyGoalsScreen.tsx
│   │       ├── BodyMetricsScreen.tsx
│   │       └── ProfileScreen.tsx
│   └── types/
│       └── index.ts             # TypeScript tipovi
├── package.json
└── tsconfig.json
```

---

## 🎯 Planirane Funkcionalnosti

- [ ] Dodavanje vlastitih vježbi kroz UI
- [ ] Export/Import podataka
- [ ] Grafički prikaz napretka
- [ ] Podsjetnici za trening
- [ ] Tamni mod
- [ ] Sinkronizacija sa cloud-om (opcionalno)

---

## 📦 Build za Produkciju

```bash
# Instaliraj EAS CLI
npm install -g eas-cli

# Login na Expo account
eas login

# Build za Android (APK)
eas build -p android --profile preview

# Build za iOS
eas build -p ios --profile preview
```

---

## 🐛 Troubleshooting

| Problem | Rješenje |
|---------|----------|
| Aplikacija se ne učitava | `npx expo start --clear` |
| Greška pri prijavi | Koristi demo kredencijale ili kreiraj novi račun |
| Metro bundler error | Obriši `node_modules` i ponovo `npm install` |
| SQLite greška | Obriši aplikaciju i ponovo instaliraj |

---

## 👨‍💻 Autor

Razvijeno sa ❤️ za sve ljubitelje fitnessa.

---

## 📄 Licenca

MIT License - slobodno koristite i modificirajte.

---

<p align="center">
  <strong>GymPal</strong> - Tvoj partner za trening 💪
</p>
