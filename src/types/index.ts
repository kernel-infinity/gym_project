// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  weight_unit: 'kg' | 'lbs';
  height_unit: 'cm' | 'in';
}

// Exercise Types
export interface Exercise {
  id: number;
  name: string;
  description?: string;
  muscle_group: string;
  equipment?: string;
  instructions?: string;
}

// Workout Types
export type WorkoutStatus = 'planned' | 'in_progress' | 'completed';

export interface Workout {
  id: number;
  user_id: number;
  name: string;
  notes?: string;
  status: WorkoutStatus;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
}

// Workout Exercise Types
export interface WorkoutExercise {
  id: number;
  workout_id: number;
  exercise_id: number;
  order_num: number;
  notes?: string;
  exercise?: Exercise;
  sets?: ExerciseSet[];
}

// Exercise Set Types
export interface ExerciseSet {
  id: number;
  workout_exercise_id: number;
  set_number: number;
  weight?: number;
  reps: number;
  rpe?: number;
  completed: boolean;
}

// Weekly Goal Types
export interface WeeklyGoal {
  id: number;
  user_id: number;
  week_start: string;
  target_workouts: number;
  completed_workouts: number;
  notes?: string;
}

// Body Metrics Types
export interface BodyMetric {
  id: number;
  user_id: number;
  recorded_at: string;
  weight: number;
  body_fat_percentage?: number;
  notes?: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Workouts: undefined;
  Profile: undefined;
};

export type WorkoutStackParamList = {
  WorkoutsList: undefined;
  CreateWorkout: undefined;
  WorkoutDetail: { workoutId: number };
  WeeklyGoals: undefined;
  BodyMetrics: undefined;
};
