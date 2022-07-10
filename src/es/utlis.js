const precision = 1e2;

/**
 * @param {string} id
 * @return {HTMLElement}
 */
export function pickById(id) {
  return document.getElementById(id);
}

export function fixFloatOverflow(value) {
  if ((value + '').length > 15) {
    value = Math.round(value * precision) / precision;
  }
  return value;
}
