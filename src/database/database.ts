import * as SQLite from 'expo-sqlite';
import { User, Exercise, Workout, WorkoutExercise, ExerciseSet, WeeklyGoal, BodyMetric, MuscleGroup } from '../types';

const DB_NAME = 'gympal.db';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
};

const runMigrations = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  // Check if old exercises table exists with muscle_group as TEXT
  try {
    const tableInfo = database.getAllSync<any>('PRAGMA table_info(exercises)');
    const hasMuscleGroupColumn = tableInfo.some((col: any) => col.name === 'muscle_group');

    if (hasMuscleGroupColumn) {
      console.log('Migrating exercises table to use muscle_group_id...');

      // Create muscle_groups table if it doesn't exist
      database.execSync(`
        CREATE TABLE IF NOT EXISTS muscle_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          color TEXT DEFAULT '#3b82f6'
        );
      `);

      // Get all unique muscle groups from exercises
      const oldExercises = database.getAllSync<any>('SELECT DISTINCT muscle_group FROM exercises');
      const muscleGroupMap: { [key: string]: number } = {};

      // Create muscle groups from old data
      for (const ex of oldExercises) {
        if (ex.muscle_group) {
          const existing = database.getFirstSync<MuscleGroup>(
            'SELECT * FROM muscle_groups WHERE name = ?',
            [ex.muscle_group]
          );
          if (!existing) {
            database.runSync(
              'INSERT INTO muscle_groups (name, description, color) VALUES (?, ?, ?)',
              [ex.muscle_group, '', '#3b82f6']
            );
          }
          const group = database.getFirstSync<MuscleGroup>(
            'SELECT * FROM muscle_groups WHERE name = ?',
            [ex.muscle_group]
          );
          if (group) {
            muscleGroupMap[ex.muscle_group] = group.id;
          }
        }
      }

      // Rename old exercises table
      database.execSync('ALTER TABLE exercises RENAME TO exercises_old');

      // Create new exercises table with muscle_group_id
      database.execSync(`
        CREATE TABLE exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          muscle_group_id INTEGER NOT NULL,
          equipment TEXT,
          instructions TEXT,
          FOREIGN KEY (muscle_group_id) REFERENCES muscle_groups (id)
        );
      `);

      // Copy data from old table to new table
      const allOldExercises = database.getAllSync<any>('SELECT * FROM exercises_old');
      for (const ex of allOldExercises) {
        const muscleGroupId = muscleGroupMap[ex.muscle_group] || 1;
        database.runSync(
          'INSERT INTO exercises (id, name, description, muscle_group_id, equipment, instructions) VALUES (?, ?, ?, ?, ?, ?)',
          [ex.id, ex.name, ex.description, muscleGroupId, ex.equipment, ex.instructions]
        );
      }

      // Drop old table
      database.execSync('DROP TABLE exercises_old');

      console.log('Migration completed successfully');
    }
  } catch (error) {
    console.log('Migration not needed or already completed');
  }
};

export const initDatabase = async (): Promise<void> => {
  const database = getDatabase();

  // Run migrations
  await runMigrations(database);

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
    CREATE TABLE IF NOT EXISTS muscle_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT DEFAULT '#3b82f6'
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      muscle_group_id INTEGER NOT NULL,
      equipment TEXT,
      instructions TEXT,
      FOREIGN KEY (muscle_group_id) REFERENCES muscle_groups (id)
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

  // Seed muscle groups
  const muscleGroups = [
    { name: 'Prsa', description: 'Prsni mišići', color: '#ef4444' },
    { name: 'Leđa', description: 'Gornji i donji dio leđa', color: '#3b82f6' },
    { name: 'Ramena', description: 'Deltoidni mišići', color: '#f59e0b' },
    { name: 'Biceps', description: 'Prednji dio ruke', color: '#10b981' },
    { name: 'Triceps', description: 'Stražnji dio ruke', color: '#8b5cf6' },
    { name: 'Noge', description: 'Kvadriceps i hamstrinzi', color: '#ec4899' },
    { name: 'Trbuh', description: 'Trbušni mišići', color: '#14b8a6' },
    { name: 'Gluteus', description: 'Stražnjica', color: '#f97316' },
  ];

  for (const group of muscleGroups) {
    database.runSync(
      'INSERT INTO muscle_groups (name, description, color) VALUES (?, ?, ?)',
      [group.name, group.description, group.color]
    );
  }

  // Get muscle group IDs
  const getMuscleGroupId = (name: string): number => {
    const group = database.getFirstSync<MuscleGroup>('SELECT * FROM muscle_groups WHERE name = ?', [name]);
    return group?.id || 1;
  };

  // Seed predefined exercises
  const exercises = [
    { name: 'Bench Press', muscle_group: 'Prsa', equipment: 'Šipka', description: 'Klasična vježba za prsa' },
    { name: 'Incline Dumbbell Press', muscle_group: 'Prsa', equipment: 'Bučice', description: 'Gornji dio prsa' },
    { name: 'Cable Flyes', muscle_group: 'Prsa', equipment: 'Sajla', description: 'Izolacija prsa' },
    { name: 'Squat', muscle_group: 'Noge', equipment: 'Šipka', description: 'Kralj vježbi za noge' },
    { name: 'Leg Press', muscle_group: 'Noge', equipment: 'Mašina', description: 'Masa nogu' },
    { name: 'Leg Curl', muscle_group: 'Noge', equipment: 'Mašina', description: 'Hamstrinzi' },
    { name: 'Leg Extension', muscle_group: 'Noge', equipment: 'Mašina', description: 'Kvadriceps' },
    { name: 'Deadlift', muscle_group: 'Leđa', equipment: 'Šipka', description: 'Cijelo tijelo pokret' },
    { name: 'Pull-ups', muscle_group: 'Leđa', equipment: 'Šipka za zgibove', description: 'Vlastita težina leđa' },
    { name: 'Barbell Row', muscle_group: 'Leđa', equipment: 'Šipka', description: 'Debljina leđa' },
    { name: 'Lat Pulldown', muscle_group: 'Leđa', equipment: 'Sajla', description: 'Razvoj latova' },
    { name: 'Overhead Press', muscle_group: 'Ramena', equipment: 'Šipka', description: 'Građenje snage ramena' },
    { name: 'Lateral Raises', muscle_group: 'Ramena', equipment: 'Bučice', description: 'Bočna ramena' },
    { name: 'Face Pulls', muscle_group: 'Ramena', equipment: 'Sajla', description: 'Stražnja ramena' },
    { name: 'Barbell Curl', muscle_group: 'Biceps', equipment: 'Šipka', description: 'Klasična biceps vježba' },
    { name: 'Hammer Curl', muscle_group: 'Biceps', equipment: 'Bučice', description: 'Biceps i podlaktica' },
    { name: 'Tricep Dips', muscle_group: 'Triceps', equipment: 'Paralele', description: 'Građenje tricepsa' },
    { name: 'Skull Crushers', muscle_group: 'Triceps', equipment: 'EZ šipka', description: 'Triceps izolacija' },
    { name: 'Plank', muscle_group: 'Trbuh', equipment: 'Bez opreme', description: 'Core stabilizacija' },
    { name: 'Crunches', muscle_group: 'Trbuh', equipment: 'Bez opreme', description: 'Gornji trbuh' },
    { name: 'Hip Thrusts', muscle_group: 'Gluteus', equipment: 'Šipka', description: 'Jačanje gluteusa' },
  ];

  for (const exercise of exercises) {
    const muscleGroupId = getMuscleGroupId(exercise.muscle_group);
    database.runSync(
      'INSERT INTO exercises (name, muscle_group_id, equipment, description) VALUES (?, ?, ?, ?)',
      [exercise.name, muscleGroupId, exercise.equipment, exercise.description]
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
  database.execSync('DROP TABLE IF EXISTS muscle_groups');
  database.execSync('DROP TABLE IF EXISTS users');
  await initDatabase();
};
