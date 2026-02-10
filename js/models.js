// models.js — Grade conversion, GPA calculation, validation, formatting

/**
 * Convert percentage (0-100) to letter grade.
 * Uses standard 10-point scale: A (90+), B (80-89), C (70-79), D (60-69), F (<60)
 */
export function percentageToLetter(pct) {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

/**
 * Convert letter grade to GPA points.
 */
export function letterToGPA(letter) {
  const map = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0 };
  return map[letter] ?? 0.0;
}

/**
 * Convert percentage directly to GPA.
 */
export function percentageToGPA(pct) {
  return letterToGPA(percentageToLetter(pct));
}

/**
 * Calculate overall GPA from an array of active classes.
 * Returns 0 if no classes.
 */
export function calculateGPA(classes) {
  const active = classes.filter(c => c.isActive);
  if (active.length === 0) return 0;
  const total = active.reduce((sum, c) => sum + percentageToGPA(c.currentGrade), 0);
  return total / active.length;
}

/**
 * Get a CSS class name for the grade color.
 */
export function gradeColor(pct) {
  const letter = percentageToLetter(pct);
  return `grade-${letter.toLowerCase()}`;
}

/**
 * Get the numeric rank of a letter grade for comparison.
 * F=0, D=1, C=2, B=3, A=4
 */
export function letterRank(letter) {
  const ranks = { F: 0, D: 1, C: 2, B: 3, A: 4 };
  return ranks[letter] ?? 0;
}

/**
 * Format minutes as a human-readable string.
 * e.g., 95 -> "1h 35m", 45 -> "45m", 120 -> "2h 0m"
 */
export function formatMinutes(min) {
  min = Math.max(0, Math.round(min));
  if (min < 60) return `${min}m`;
  const hours = Math.floor(min / 60);
  const mins = min % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Validate a grade percentage. Returns a number clamped to 0-100.
 */
export function validateGrade(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return Math.min(100, Math.max(0, Math.round(num * 100) / 100));
}

/**
 * Validate missing assignment count. Returns integer >= 0.
 */
export function validateMissing(value) {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0) return 0;
  return num;
}

/**
 * Create a new class object with defaults.
 */
export function createClassDefaults(name, type = 'core') {
  return {
    id: crypto.randomUUID(),
    name,
    type,
    currentGrade: 0,
    missingAssignments: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
