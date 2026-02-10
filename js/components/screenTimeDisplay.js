// screenTimeDisplay.js — Prominent screen time hero component

import { formatMinutes } from '../models.js';

export function createScreenTimeDisplay(screenTimeData, override = null, locked = false) {
  const div = document.createElement('div');
  div.className = 'screen-time-hero';

  let displayMinutes = screenTimeData.total;
  let label = 'Daily Screen Time Earned';

  if (locked) {
    displayMinutes = 0;
    label = 'Screen Time LOCKED';
    div.classList.add('locked');
  } else if (override !== null) {
    displayMinutes = override;
    label = 'Daily Screen Time (Override)';
  }

  // Determine level class
  if (!locked) {
    if (displayMinutes >= 150) {
      div.classList.add('level-great');
    } else if (displayMinutes >= 90) {
      div.classList.add('level-good');
    } else if (displayMinutes >= 45) {
      div.classList.add('level-ok');
    } else {
      div.classList.add('level-low');
    }
  }

  const timeValue = document.createElement('div');
  timeValue.className = 'time-value';
  timeValue.textContent = formatMinutes(displayMinutes);

  const timeLabel = document.createElement('p');
  timeLabel.className = 'time-label';
  timeLabel.textContent = label;

  div.appendChild(timeValue);
  div.appendChild(timeLabel);

  return div;
}
