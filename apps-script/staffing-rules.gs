/**
 * Staffing rules, shared by every device (Settings > Staffing rules, behind the Who's in PIN).
 *
 * The breaksheet page asks for the rules with  action=rules  (no PIN needed) and saves them with
 * action=rules_save&rules=…&pin=…  (needs the manager PIN, checked by checkManagerPin_ in pin-check.gs).
 * The rules are kept in Script Properties as STAFF_RULES.
 *
 * Setup (Apps Script editor), one time:
 *  1. Paste this whole file into the project as a new file, e.g. staffing-rules.gs.
 *  2. Replace pin-check.gs with the new version from this repository (it now also protects rules_save).
 *  3. At the very top of doGet(e), before anything else, add:
 *
 *       const rulesReply = handleRules_(e);
 *       if (rulesReply) return rulesReply;
 *
 *  4. Deploy > Manage deployments > edit (pencil) > Version: New version > Deploy.
 *     Editing the existing deployment keeps the same URL, so the page keeps working.
 *
 * Until this is done the page still works: rules are then kept on each device only.
 */
function handleRules_(e) {
  const action = String((e && e.parameter && e.parameter.action) || '');
  if (action !== 'rules' && action !== 'rules_save') return null;
  const reply = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  const props = PropertiesService.getScriptProperties();

  if (action === 'rules') {
    const saved = props.getProperty('STAFF_RULES');
    return reply({ ok: true, rules: saved ? JSON.parse(saved) : null });
  }

  const denied = checkManagerPin_(e);
  if (denied) return reply(denied);

  let rules;
  try { rules = JSON.parse(String(e.parameter.rules || '')); } catch (err) { rules = null; }
  if (!Array.isArray(rules) || rules.length > 40) return reply({ ok: false, error: 'The rules could not be read.' });
  const text = JSON.stringify(rules);
  if (text.length > 8500) return reply({ ok: false, error: 'Too many rules to save.' });
  props.setProperty('STAFF_RULES', text);
  return reply({ ok: true, rules: rules });
}
