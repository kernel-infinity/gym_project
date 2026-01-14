import * as SQLite from 'expo-sqlite';
import { User, Exercise, Workout, WorkoutExercise, ExerciseSet, WeeklyGoal, BodyMetric } from '../types';

const DB_NAME = 'gympal.db';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
};

export const initDatabase = async (): Promise<void> => {
  const database = getDatabase();

  // Create tables
  database.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      weight_unit TEXT DEFAULT 'kg',
      height_unit TEXT DEFAULT 'cm'
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      muscle_group TEXT NOT NULL,
      equipment TEXT,
      instructions TEXT
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'planned',
      scheduled_at TEXT,
      started_at TEXT,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      order_num INTEGER NOT NULL,
      notes TEXT,
      FOREIGN KEY (workout_id) REFERENCES workouts (id),
      FOREIGN KEY (exercise_id) REFERENCES exercises (id)
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS exercise_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL,
      reps INTEGER NOT NULL,
      rpe INTEGER,
      completed INTEGER DEFAULT 0,
      FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises (id)
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS weekly_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      target_workouts INTEGER NOT NULL,
      completed_workouts INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS body_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recorded_at TEXT NOT NULL,
      weight REAL NOT NULL,
      body_fat_percentage REAL,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  // Seed demo data
  await seedDemoData(database);
};

const seedDemoData = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  // Check if demo user already exists
  const existingUser = database.getFirstSync<User>('SELECT * FROM users WHERE email = ?', ['demo@gympal.com']);

  if (existingUser) {
    console.log('Demo data already exists');
    return;
  }

  // Create demo user
  database.runSync(
    'INSERT INTO users (name, email, password, weight_unit, height_unit) VALUES (?, ?, ?, ?, ?)',
    ['Demo User', 'demo@gympal.com', 'demo123', 'kg', 'cm']
  );

  const demoUser = database.getFirstSync<User>('SELECT * FROM users WHERE email = ?', ['demo@gympal.com']);
  if (!demoUser) return;

  // Seed predefined exercises
  const exercises = [
    { name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell', description: 'Classic chest exercise' },
    { name: 'Squat', muscle_group: 'Legs', equipment: 'Barbell', description: 'King of leg exercises' },
    { name: 'Deadlift', muscle_group: 'Back', equipment: 'Barbell', description: 'Full body compound movement' },
    { name: 'Pull-ups', muscle_group: 'Back', equipment: 'Pull-up bar', description: 'Bodyweight back exercise' },
    { name: 'Overhead Press', muscle_group: 'Shoulders', equipment: 'Barbell', description: 'Shoulder strength builder' },
    { name: 'Barbell Row', muscle_group: 'Back', equipment: 'Barbell', description: 'Back thickness builder' },
    { name: 'Dumbbell Curl', muscle_group: 'Biceps', equipment: 'Dumbbells', description: 'Bicep isolation' },
    { name: 'Tricep Dips', muscle_group: 'Triceps', equipment: 'Parallel bars', description: 'Tricep builder' },
    { name: 'Leg Press', muscle_group: 'Legs', equipment: 'Machine', description: 'Leg mass builder' },
    { name: 'Lat Pulldown', muscle_group: 'Back', equipment: 'Cable machine', description: 'Lat development' },
  ];

  for (const exercise of exercises) {
    database.runSync(
      'INSERT INTO exercises (name, muscle_group, equipment, description) VALUES (?, ?, ?, ?)',
      [exercise.name, exercise.muscle_group, exercise.equipment, exercise.description]
    );
  }

  // Create sample workouts
  database.runSync(
    'INSERT INTO workouts (user_id, name, notes, status, scheduled_at) VALUES (?, ?, ?, ?, ?)',
    [demoUser.id, 'Push Day', 'Chest, shoulders and triceps', 'planned', new Date().toISOString()]
  );

  database.runSync(
    'INSERT INTO workouts (user_id, name, notes, status, scheduled_at) VALUES (?, ?, ?, ?, ?)',
    [demoUser.id, 'Pull Day', 'Back and biceps', 'planned', new Date().toISOString()]
  );

  database.runSync(
    'INSERT INTO workouts (user_id, name, notes, status, scheduled_at) VALUES (?, ?, ?, ?, ?)',
    [demoUser.id, 'Leg Day', 'Quad and hamstring focus', 'planned', new Date().toISOString()]
  );

  // Add exercises to first workout (Push Day)
  const pushWorkout = database.getFirstSync<Workout>('SELECT * FROM workouts WHERE name = ?', ['Push Day']);
  if (pushWorkout) {
    // Bench Press
    database.runSync(
      'INSERT INTO workout_exercises (workout_id, exercise_id, order_num) VALUES (?, ?, ?)',
      [pushWorkout.id, 1, 1]
    );
    const we1 = database.getFirstSync<WorkoutExercise>('SELECT * FROM workout_exercises WHERE workout_id = ? AND exercise_id = ?', [pushWorkout.id, 1]);
    if (we1) {
      database.runSync('INSERT INTO exercise_sets (workout_exercise_id, set_number, weight, reps, completed) VALUES (?, ?, ?, ?, ?)', [we1.id, 1, 60, 10, 0]);
      database.runSync('INSERT INTO exercise_sets (workout_exercise_id, set_number, weight, reps, completed) VALUES (?, ?, ?, ?, ?)', [we1.id, 2, 60, 10, 0]);
      database.runSync('INSERT INTO exercise_sets (workout_exercise_id, set_number, weight, reps, completed) VALUES (?, ?, ?, ?, ?)', [we1.id, 3, 60, 8, 0]);
    }

    // Overhead Press
    database.runSync(
      'INSERT INTO workout_exercises (workout_id, exercise_id, order_num) VALUES (?, ?, ?)',
      [pushWorkout.id, 5, 2]
    );
    const we2 = database.getFirstSync<WorkoutExercise>('SELECT * FROM workout_exercises WHERE workout_id = ? AND exercise_id = ?', [pushWorkout.id, 5]);
    if (we2) {
      database.runSync('INSERT INTO exercise_sets (workout_exercise_id, set_number, weight, reps, completed) VALUES (?, ?, ?, ?, ?)', [we2.id, 1, 40, 8, 0]);
      database.runSync('INSERT INTO exercise_sets (workout_exercise_id, set_number, weight, reps, completed) VALUES (?, ?, ?, ?, ?)', [we2.id, 2, 40, 8, 0]);
      database.runSync('INSERT INTO exercise_sets (workout_exercise_id, set_number, weight, reps, completed) VALUES (?, ?, ?, ?, ?)', [we2.id, 3, 40, 8, 0]);
    }
  }

  // Create weekly goal
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay())).toISOString();
  database.runSync(
    'INSERT INTO weekly_goals (user_id, week_start, target_workouts, completed_workouts) VALUES (?, ?, ?, ?)',
    [demoUser.id, weekStart, 4, 0]
  );

  // Create initial body metric
  database.runSync(
    'INSERT INTO body_metrics (user_id, recorded_at, weight, body_fat_percentage) VALUES (?, ?, ?, ?)',
    [demoUser.id, new Date().toISOString(), 75.0, 15.0]
  );

  console.log('Demo data seeded successfully');
};

export const clearDatabase = async (): Promise<void> => {
  const database = getDatabase();
  database.execSync('DROP TABLE IF EXISTS body_metrics');
  database.execSync('DROP TABLE IF EXISTS weekly_goals');
  database.execSync('DROP TABLE IF EXISTS exercise_sets');
  database.execSync('DROP TABLE IF EXISTS workout_exercises');
  database.execSync('DROP TABLE IF EXISTS workouts');
  database.execSync('DROP TABLE IF EXISTS exercises');
  database.execSync('DROP TABLE IF EXISTS users');
  await initDatabase();
};
