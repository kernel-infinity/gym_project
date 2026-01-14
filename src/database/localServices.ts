import { getDatabase } from './database';
import { User, Exercise, Workout, WorkoutExercise, ExerciseSet, WeeklyGoal, BodyMetric } from '../types';

// User Services
export const createUser = (name: string, email: string, password: string): User | null => {
  const db = getDatabase();
  try {
    db.runSync(
      'INSERT INTO users (name, email, password, weight_unit, height_unit) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, 'kg', 'cm']
    );
    return getUserByEmail(email);
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

export const getUserByEmail = (email: string): User | null => {
  const db = getDatabase();
  return db.getFirstSync<User>('SELECT * FROM users WHERE email = ?', [email]);
};

export const getUserById = (id: number): User | null => {
  const db = getDatabase();
  return db.getFirstSync<User>('SELECT * FROM users WHERE id = ?', [id]);
};

export const updateUser = (id: number, updates: Partial<User>): void => {
  const db = getDatabase();
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  db.runSync(`UPDATE users SET ${fields} WHERE id = ?`, values);
};

// Exercise Services
export const getAllExercises = (): Exercise[] => {
  const db = getDatabase();
  return db.getAllSync<Exercise>('SELECT * FROM exercises ORDER BY muscle_group, name');
};

export const getExerciseById = (id: number): Exercise | null => {
  const db = getDatabase();
  return db.getFirstSync<Exercise>('SELECT * FROM exercises WHERE id = ?', [id]);
};

export const createExercise = (exercise: Omit<Exercise, 'id'>): Exercise | null => {
  const db = getDatabase();
  db.runSync(
    'INSERT INTO exercises (name, description, muscle_group, equipment, instructions) VALUES (?, ?, ?, ?, ?)',
    [exercise.name, exercise.description || null, exercise.muscle_group, exercise.equipment || null, exercise.instructions || null]
  );
  return db.getFirstSync<Exercise>('SELECT * FROM exercises WHERE id = last_insert_rowid()');
};

// Workout Services
export const getAllWorkouts = (userId: number): Workout[] => {
  const db = getDatabase();
  return db.getAllSync<Workout>('SELECT * FROM workouts WHERE user_id = ? ORDER BY scheduled_at DESC', [userId]);
};

export const getWorkoutById = (id: number): Workout | null => {
  const db = getDatabase();
  return db.getFirstSync<Workout>('SELECT * FROM workouts WHERE id = ?', [id]);
};

export const createWorkout = (workout: Omit<Workout, 'id'>): Workout | null => {
  const db = getDatabase();
  db.runSync(
    'INSERT INTO workouts (user_id, name, notes, status, scheduled_at) VALUES (?, ?, ?, ?, ?)',
    [workout.user_id, workout.name, workout.notes || null, workout.status, workout.scheduled_at || null]
  );
  return db.getFirstSync<Workout>('SELECT * FROM workouts WHERE id = last_insert_rowid()');
};

export const updateWorkout = (id: number, updates: Partial<Workout>): void => {
  const db = getDatabase();
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  db.runSync(`UPDATE workouts SET ${fields} WHERE id = ?`, values);
};

export const deleteWorkout = (id: number): void => {
  const db = getDatabase();
  // Delete related data first
  db.runSync('DELETE FROM exercise_sets WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id = ?)', [id]);
  db.runSync('DELETE FROM workout_exercises WHERE workout_id = ?', [id]);
  db.runSync('DELETE FROM workouts WHERE id = ?', [id]);
};

// Workout Exercise Services
export const getWorkoutExercises = (workoutId: number): WorkoutExercise[] => {
  const db = getDatabase();
  const workoutExercises = db.getAllSync<WorkoutExercise>(
    'SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY order_num',
    [workoutId]
  );

  // Load exercise details and sets for each workout exercise
  return workoutExercises.map(we => {
    const exercise = getExerciseById(we.exercise_id);
    const sets = getExerciseSets(we.id);
    return { ...we, exercise: exercise || undefined, sets };
  });
};

export const createWorkoutExercise = (workoutExercise: Omit<WorkoutExercise, 'id'>): WorkoutExercise | null => {
  const db = getDatabase();
  db.runSync(
    'INSERT INTO workout_exercises (workout_id, exercise_id, order_num, notes) VALUES (?, ?, ?, ?)',
    [workoutExercise.workout_id, workoutExercise.exercise_id, workoutExercise.order_num, workoutExercise.notes || null]
  );
  return db.getFirstSync<WorkoutExercise>('SELECT * FROM workout_exercises WHERE id = last_insert_rowid()');
};

export const deleteWorkoutExercise = (id: number): void => {
  const db = getDatabase();
  db.runSync('DELETE FROM exercise_sets WHERE workout_exercise_id = ?', [id]);
  db.runSync('DELETE FROM workout_exercises WHERE id = ?', [id]);
};

// Exercise Set Services
export const getExerciseSets = (workoutExerciseId: number): ExerciseSet[] => {
  const db = getDatabase();
  return db.getAllSync<ExerciseSet>(
    'SELECT * FROM exercise_sets WHERE workout_exercise_id = ? ORDER BY set_number',
    [workoutExerciseId]
  );
};

export const createExerciseSet = (exerciseSet: Omit<ExerciseSet, 'id'>): ExerciseSet | null => {
  const db = getDatabase();
  db.runSync(
    'INSERT INTO exercise_sets (workout_exercise_id, set_number, weight, reps, rpe, completed) VALUES (?, ?, ?, ?, ?, ?)',
    [exerciseSet.workout_exercise_id, exerciseSet.set_number, exerciseSet.weight || null, exerciseSet.reps, exerciseSet.rpe || null, exerciseSet.completed ? 1 : 0]
  );
  return db.getFirstSync<ExerciseSet>('SELECT * FROM exercise_sets WHERE id = last_insert_rowid()');
};

export const updateExerciseSet = (id: number, updates: Partial<ExerciseSet>): void => {
  const db = getDatabase();
  const updateData = { ...updates };
  if ('completed' in updateData) {
    (updateData as any).completed = updateData.completed ? 1 : 0;
  }
  const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updateData), id];
  db.runSync(`UPDATE exercise_sets SET ${fields} WHERE id = ?`, values);
};

export const deleteExerciseSet = (id: number): void => {
  const db = getDatabase();
  db.runSync('DELETE FROM exercise_sets WHERE id = ?', [id]);
};

// Weekly Goal Services
export const getCurrentWeeklyGoal = (userId: number): WeeklyGoal | null => {
  const db = getDatabase();
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split('T')[0];
  return db.getFirstSync<WeeklyGoal>(
    'SELECT * FROM weekly_goals WHERE user_id = ? AND week_start = ?',
    [userId, weekStart]
  );
};

export const getAllWeeklyGoals = (userId: number): WeeklyGoal[] => {
  const db = getDatabase();
  return db.getAllSync<WeeklyGoal>(
    'SELECT * FROM weekly_goals WHERE user_id = ? ORDER BY week_start DESC',
    [userId]
  );
};

export const createWeeklyGoal = (goal: Omit<WeeklyGoal, 'id'>): WeeklyGoal | null => {
  const db = getDatabase();
  db.runSync(
    'INSERT INTO weekly_goals (user_id, week_start, target_workouts, completed_workouts, notes) VALUES (?, ?, ?, ?, ?)',
    [goal.user_id, goal.week_start, goal.target_workouts, goal.completed_workouts, goal.notes || null]
  );
  return db.getFirstSync<WeeklyGoal>('SELECT * FROM weekly_goals WHERE id = last_insert_rowid()');
};

export const updateWeeklyGoal = (id: number, updates: Partial<WeeklyGoal>): void => {
  const db = getDatabase();
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  db.runSync(`UPDATE weekly_goals SET ${fields} WHERE id = ?`, values);
};

// Body Metrics Services
export const getAllBodyMetrics = (userId: number): BodyMetric[] => {
  const db = getDatabase();
  return db.getAllSync<BodyMetric>(
    'SELECT * FROM body_metrics WHERE user_id = ? ORDER BY recorded_at DESC',
    [userId]
  );
};

export const getLatestBodyMetric = (userId: number): BodyMetric | null => {
  const db = getDatabase();
  return db.getFirstSync<BodyMetric>(
    'SELECT * FROM body_metrics WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 1',
    [userId]
  );
};

export const createBodyMetric = (metric: Omit<BodyMetric, 'id'>): BodyMetric | null => {
  const db = getDatabase();
  db.runSync(
    'INSERT INTO body_metrics (user_id, recorded_at, weight, body_fat_percentage, notes) VALUES (?, ?, ?, ?, ?)',
    [metric.user_id, metric.recorded_at, metric.weight, metric.body_fat_percentage || null, metric.notes || null]
  );
  return db.getFirstSync<BodyMetric>('SELECT * FROM body_metrics WHERE id = last_insert_rowid()');
};

export const deleteBodyMetric = (id: number): void => {
  const db = getDatabase();
  db.runSync('DELETE FROM body_metrics WHERE id = ?', [id]);
};
