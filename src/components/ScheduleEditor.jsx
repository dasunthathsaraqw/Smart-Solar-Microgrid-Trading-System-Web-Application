// ScheduleEditor.jsx — edits the existing station schedule string as times and days.
// Author: M.K.E Dharmarathne it23142732

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Reads the common persisted schedule format without discarding custom legacy text.
function parseSchedule(value) {
  const match = /^(\d{2}:\d{2})?-(\d{2}:\d{2})?(?:\s+(.+))?$/.exec(value || "");
  if (!match) return null;
  const names = !match[3] ? [] : match[3] === "Mon-Sun" ? DAYS : match[3] === "Mon-Fri" ? DAYS.slice(0, 5) : match[3].split(",").map((day) => day.trim());
  if (names.some((day) => !DAYS.includes(day))) return null;
  return { open: match[1] || "", close: match[2] || "", days: names };
}

// Composes times and selected days into the API's unchanged schedule string field.
function composeSchedule({ open, close, days }) {
  const dayText = days.length === 7 ? "Mon-Sun" : days.length === 5 && DAYS.slice(0, 5).every((day) => days.includes(day)) ? "Mon-Fri" : DAYS.filter((day) => days.includes(day)).join(",");
  return `${open}-${close} ${dayText}`.trim();
}

// Offers structured editing for known formats and preserves custom schedules as plain text.
export default function ScheduleEditor({ value, onChange }) {
  const parsed = parseSchedule(value);
  if (!parsed && value) {
    return (
      <div>
        <label htmlFor="station-schedule-custom" className="mb-1 block text-sm font-medium text-brand-black">Schedule</label>
        <input id="station-schedule-custom" required value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-brand-border px-3 py-2" />
        <p className="mt-1 text-xs text-brand-muted">This station uses a custom schedule format. Its text is preserved.</p>
      </div>
    );
  }

  const current = parsed || { open: "", close: "", days: [] };
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-brand-black">Schedule</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm text-brand-black">Open time
          <input type="time" value={current.open} onChange={(event) => onChange(composeSchedule({ ...current, open: event.target.value }))} className="mt-1 block w-full rounded-md border border-brand-border px-3 py-2" />
        </label>
        <label className="text-sm text-brand-black">Close time
          <input type="time" value={current.close} onChange={(event) => onChange(composeSchedule({ ...current, close: event.target.value }))} className="mt-1 block w-full rounded-md border border-brand-border px-3 py-2" />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day) => (
          <label key={day} className="flex items-center gap-1 text-sm text-brand-black">
            <input type="checkbox" checked={current.days.includes(day)} onChange={(event) => onChange(composeSchedule({ ...current, days: event.target.checked ? [...current.days, day] : current.days.filter((item) => item !== day) }))} />
            {day}
          </label>
        ))}
      </div>
      <p className="text-xs text-brand-muted">Saved as: {value || "Choose times and days"}</p>
    </fieldset>
  );
}
