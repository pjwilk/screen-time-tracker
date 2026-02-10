// rewards.js — Reward calculation engine

import { percentageToLetter, letterRank } from './models.js';

/**
 * Find the most recent previous grade for a class (from a day before today).
 */
function getMostRecentPreviousGrade(classId, gradeHistory) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = gradeHistory
    .filter(h => h.classId === classId && h.recordedAt.slice(0, 10) !== today)
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
  return entries.length > 0 ? entries[0].grade : null;
}

/**
 * Calculate screen time based on classes, grade history, and settings.
 *
 * Returns a breakdown object:
 * {
 *   baseline, missingPenalty, dGradePenalty, fGradePenalty,
 *   zeroMissingBonus, improvementBonus, aClassBonus,
 *   total, details[]
 * }
 */
export function calculateScreenTime(classes, gradeHistory, settings) {
  const active = classes.filter(c => c.isActive);
  const details = [];

  // Baseline
  const baseline = settings.baseline;
  details.push(`Baseline: ${baseline} min`);

  // Penalty: missing assignments
  const totalMissing = active.reduce((sum, c) => sum + c.missingAssignments, 0);
  const missingPenalty = totalMissing * settings.penalties.perMissing;
  if (totalMissing > 0) {
    details.push(`Missing assignments (${totalMissing} x -${settings.penalties.perMissing}): -${missingPenalty} min`);
  }

  // Penalty: D grades
  const dCount = active.filter(c => percentageToLetter(c.currentGrade) === 'D').length;
  const dGradePenalty = dCount * settings.penalties.classWithD;
  if (dCount > 0) {
    details.push(`D grades (${dCount} x -${settings.penalties.classWithD}): -${dGradePenalty} min`);
  }

  // Penalty: F grades
  const fCount = active.filter(c => percentageToLetter(c.currentGrade) === 'F').length;
  const fGradePenalty = fCount * settings.penalties.classWithF;
  if (fCount > 0) {
    details.push(`F grades (${fCount} x -${settings.penalties.classWithF}): -${fGradePenalty} min`);
  }

  // Bonus: zero missing assignments
  const zeroMissingBonus = (totalMissing === 0 && active.length > 0) ? settings.bonuses.zeroMissingAll : 0;
  if (zeroMissingBonus > 0) {
    details.push(`Zero missing assignments: +${zeroMissingBonus} min`);
  }

  // Bonus: grade improvement
  let improvementBonus = 0;
  for (const cls of active) {
    const prevGrade = getMostRecentPreviousGrade(cls.id, gradeHistory);
    if (prevGrade !== null) {
      const currentLetter = percentageToLetter(cls.currentGrade);
      const prevLetter = percentageToLetter(prevGrade);
      const steps = letterRank(currentLetter) - letterRank(prevLetter);
      if (steps > 0) {
        const bonus = steps * settings.bonuses.classImproved;
        improvementBonus += bonus;
        details.push(`${cls.name} improved ${prevLetter} → ${currentLetter}: +${bonus} min`);
      }
    }
  }

  // Bonus: A grades
  const aCount = active.filter(c => percentageToLetter(c.currentGrade) === 'A').length;
  const aClassBonus = aCount * settings.bonuses.classWithA;
  if (aCount > 0) {
    details.push(`A grades (${aCount} x +${settings.bonuses.classWithA}): +${aClassBonus} min`);
  }

  // Total
  let total = baseline - missingPenalty - dGradePenalty - fGradePenalty
    + zeroMissingBonus + improvementBonus + aClassBonus;

  // Apply floor
  total = Math.max(total, settings.minimumScreenTime);

  details.push(`Total: ${total} min`);

  return {
    baseline,
    missingPenalty,
    dGradePenalty,
    fGradePenalty,
    zeroMissingBonus,
    improvementBonus,
    aClassBonus,
    total,
    details,
  };
}
