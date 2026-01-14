import { getDatabase } from './database';
import { User, Exercise, Workout, WorkoutExercise, ExerciseSet, WeeklyGoal, BodyMetric, MuscleGroup } from '../types';

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

// Muscle Group Services
export const getAllMuscleGroups = (): MuscleGroup[] => {
  const db = getDatabase();
  return db.getAllSync<MuscleGroup>('SELECT * FROM muscle_groups ORDER BY name');
};

export const getMuscleGroupById = (id: number): MuscleGroup | null => {
  const db = getDatabase();
  return db.getFirstSync<MuscleGroup>('SELECT * FROM muscle_groups WHERE id = ?', [id]);
};

export const createMuscleGroup = (muscleGroup: Omit<MuscleGroup, 'id'>): MuscleGroup | null => {
  const db = getDatabase();
  try {
    db.runSync(
      'INSERT INTO muscle_groups (name, description, color) VALUES (?, ?, ?)',
      [muscleGroup.name, muscleGroup.description || null, muscleGroup.color]
    );
    return db.getFirstSync<MuscleGroup>('SELECT * FROM muscle_groups WHERE id = last_insert_rowid()');
  } catch (error) {
    console.error('Error creating muscle group:', error);
    return null;
  }
};

export const updateMuscleGroup = (id: number, updates: Partial<MuscleGroup>): void => {
  const db = getDatabase();
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  db.runSync(`UPDATE muscle_groups SET ${fields} WHERE id = ?`, values);
};

export const deleteMuscleGroup = (id: number): void => {
  const db = getDatabase();
  // Check if there are exercises using this muscle group
  const exercisesCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises WHERE muscle_group_id = ?',
    [id]
  );
  if (exercisesCount && exercisesCount.count > 0) {
    throw new Error('Cannot delete muscle group with existing exercises');
  }
  db.runSync('DELETE FROM muscle_groups WHERE id = ?', [id]);
};

// Exercise Services
export const getAllExercises = (): Exercise[] => {
  const db = getDatabase();
  const exercises = db.getAllSync<Exercise>('SELECT * FROM exercises ORDER BY muscle_group_id, name');
  // Load muscle group details for each exercise
  return exercises.map(exercise => {
    const muscleGroup = getMuscleGroupById(exercise.muscle_group_id);
    return { ...exercise, muscle_group: muscleGroup || undefined };
  });
};

export const getExercisesByMuscleGroup = (muscleGroupId: number): Exercise[] => {
  const db = getDatabase();
  const exercises = db.getAllSync<Exercise>(
    'SELECT * FROM exercises WHERE muscle_group_id = ? ORDER BY name',
    [muscleGroupId]
  );
  return exercises.map(exercise => {
    const muscleGroup = getMuscleGroupById(exercise.muscle_group_id);
    return { ...exercise, muscle_group: muscleGroup || undefined };
  });
};

export const getExerciseById = (id: number): Exercise | null => {
  const db = getDatabase();
  const exercise = db.getFirstSync<Exercise>('SELECT * FROM exercises WHERE id = ?', [id]);
  if (exercise) {
    const muscleGroup = getMuscleGroupById(exercise.muscle_group_id);
    return { ...exercise, muscle_group: muscleGroup || undefined };
  }
  return null;
};

export const createExercise = (exercise: Omit<Exercise, 'id'>): Exercise | null => {
  const db = getDatabase();
  db.runSync(
    'INSERT INTO exercises (name, description, muscle_group_id, equipment, instructions) VALUES (?, ?, ?, ?, ?)',
    [exercise.name, exercise.description || null, exercise.muscle_group_id, exercise.equipment || null, exercise.instructions || null]
  );
  return db.getFirstSync<Exercise>('SELECT * FROM exercises WHERE id = last_insert_rowid()');
};

export const updateExercise = (id: number, updates: Partial<Exercise>): void => {
  const db = getDatabase();
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  db.runSync(`UPDATE exercises SET ${fields} WHERE id = ?`, values);
};

export const deleteExercise = (id: number): void => {
  const db = getDatabase();
  // Check if exercise is used in any workouts
  const usageCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM workout_exercises WHERE exercise_id = ?',
    [id]
  );
  if (usageCount && usageCount.count > 0) {
    throw new Error('Cannot delete exercise that is used in workouts');
  }
  db.runSync('DELETE FROM exercises WHERE id = ?', [id]);
};

// Workout Services
export const getAllWorkouts = (userId: number): Workout[] => {
  const db = getDatabase();
  return db.getAllSync<Workout>('SELECT * FROM workouts WHERE user_id = ? ORDER BY scheduled_at DESC', [userId]);
};

export const getWorkoutsByDateRange = (userId: number, startDate: string, endDate: string): Workout[] => {
  const db = getDatabase();
  return db.getAllSync<Workout>(
    'SELECT * FROM workouts WHERE user_id = ? AND scheduled_at >= ? AND scheduled_at <= ? ORDER BY scheduled_at',
    [userId, startDate, endDate]
  );
};

export const getWorkoutsByDate = (userId: number, date: string): Workout[] => {
  const db = getDatabase();
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;
  return db.getAllSync<Workout>(
    'SELECT * FROM workouts WHERE user_id = ? AND scheduled_at >= ? AND scheduled_at <= ? ORDER BY scheduled_at',
    [userId, startOfDay, endOfDay]
  );
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
