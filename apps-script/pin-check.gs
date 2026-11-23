/**
 * PIN check for the manager list (add / remove).
 *
 * The breaksheet page sends the PIN as `pin` with every add or remove.
 * This check is what actually protects the list: without it, anyone with the
 * script link can still change the list, whatever the page does.
 *
 * Setup (Apps Script editor):
 *  1. Project Settings (gear icon) > Script Properties > Add script property:
 *       Property: MANAGER_PIN    Value: your 4-digit PIN
 *     The PIN lives only here, never in the page or in this repository.
 *  2. Paste this whole file into the project (e.g. as a new file pin-check.gs).
 *  3. In doGet(e), BEFORE any add/remove code runs, add:
 *
 *       const denied = checkManagerPin_(e);
 *       if (denied) return ContentService.createTextOutput(JSON.stringify(denied))
 *         .setMimeType(ContentService.MimeType.JSON);
 *
 *  4. Deploy > Manage deployments > edit (pencil) > Version: New version > Deploy.
 *     Editing the existing deployment keeps the same URL, so the page keeps working.
 *
 * Listing managers needs no PIN. After 5 wrong PINs in a row, changes are
 * locked for everyone for 15 minutes, so the PIN can't be guessed quickly.
 * To change the PIN later, just edit MANAGER_PIN in Script Properties.
 */
const PIN_MAX_FAILS = 5;
const PIN_LOCK_MINUTES = 15;

function checkManagerPin_(e) {
  const action = String((e && e.parameter && e.parameter.action) || 'list');
  if (action !== 'add' && action !== 'remove') return null;

  const props = PropertiesService.getScriptProperties();
  const pin = props.getProperty('MANAGER_PIN');
  if (!pin) return { ok: false, code: 'nopin', error: 'No PIN has been set up for the manager list yet.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const lockedMsg = 'Too many wrong PINs. Try again in ' + PIN_LOCK_MINUTES + ' minutes.';
    const until = Number(props.getProperty('PIN_LOCKED_UNTIL') || 0);
    if (Date.now() < until) return { ok: false, code: 'locked', error: lockedMsg };

    if (String(e.parameter.pin || '') === String(pin)) {
      props.deleteProperty('PIN_FAILS');
      return null; // PIN is right: let the add/remove go ahead
    }

    const fails = Number(props.getProperty('PIN_FAILS') || 0) + 1;
    if (fails >= PIN_MAX_FAILS) {
      props.setProperty('PIN_LOCKED_UNTIL', String(Date.now() + PIN_LOCK_MINUTES * 60 * 1000));
      props.deleteProperty('PIN_FAILS');
      return { ok: false, code: 'locked', error: lockedMsg };
    }
    props.setProperty('PIN_FAILS', String(fails));
    return { ok: false, code: 'pin', error: 'Wrong PIN.' };
  } finally {
    lock.releaseLock();
  }
}
