import * as SQLite from "expo-sqlite";

let db = null;

async function getDB() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("exercises.db");
  return db;
}

export async function initDB() {
  const database = await getDB();

  // Create exercises table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      muscle TEXT,
      sets INTEGER,
      reps INTEGER,
      weight TEXT,
      day TEXT,
      date TEXT
    );
  `);

  // Count existing rows
  const count = await database.getFirstAsync(
    "SELECT COUNT(*) as c FROM exercises"
  );

  // If empty → seed
  if (count.c === 0) {
    const initial = [
      { name: 'Deadlift', muscle: 'Back', sets: 3, reps: 3, weight: '120 kg', day: 'Saturday', date: 'Oct 20, 2025' },
      { name: 'Shoulder press', muscle: 'Shoulders', sets: 4, reps: 10, weight: '50 kg', day: 'Saturday', date: 'Oct 20, 2025' },
      { name: 'Triceps Dips', muscle: 'Triceps', sets: 3, reps: 12, weight: '20 kg', day: 'Saturday', date: 'Oct 20, 2025' },
      { name: 'Biceps Curls', muscle: 'Biceps', sets: 3, reps: 12, weight: '20 kg', day: 'Saturday', date: 'Oct 20, 2025' },
    ];

    console.log("Seeding initial exercises...");

    for (const ex of initial) {
      await database.runAsync(
        `INSERT INTO exercises (name, muscle, sets, reps, weight, day, date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ex.name, ex.muscle, ex.sets, ex.reps, ex.weight, ex.day, ex.date]
      );
    }
  }
}



export async function getAllExercises() {
  const database = await getDB();
  return await database.getAllAsync("SELECT * FROM exercises ORDER BY id DESC");
}

export async function createExercise(ex) {
  const database = await getDB();
  const result = await database.runAsync(
    `INSERT INTO exercises (name, muscle, sets, reps, weight, day, date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ex.name, ex.muscle, ex.sets, ex.reps, ex.weight, ex.day, ex.date]
  );

  return { ...ex, id: result.lastInsertRowId };
}


// New: create using server-provided id (INSERT OR REPLACE)
export async function createExerciseWithId(id, ex) {
  const database = await getDB();
  // Use explicit id so local row uses server id
  await database.runAsync(
    `INSERT OR REPLACE INTO exercises (id, name, muscle, sets, reps, weight, day, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, ex.name, ex.muscle, ex.sets, ex.reps, ex.weight, ex.day, ex.date]
  );
  return { ...ex, id };
}

export async function updateExerciseDB(id, changes) {
  const database = await getDB();
  await database.runAsync(
    `UPDATE exercises
     SET name=?, muscle=?, sets=?, reps=?, weight=?, day=?, date=?
     WHERE id=?`,
    [
      changes.name,
      changes.muscle,
      changes.sets,
      changes.reps,
      changes.weight,
      changes.day,
      changes.date,
      id,
    ]
  );
}

export async function deleteExerciseDB(id) {
  const database = await getDB();
  await database.runAsync("DELETE FROM exercises WHERE id=?", [id]);
}
