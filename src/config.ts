// Google Apps Script web-app endpoint serving the quorum data as JSON.
// Rotating it: see design_notes.md → "Change the Apps Script code".
// Emergency rollback: set to '' and the site runs fully on fallback data.
export const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwJ-1ODuIA-WZAsv3W0gPfOUNVH3Zf-Z__4nScO49Lj4UgntLCyaoy7nWdVU0e9NpHYBw/exec';
