export interface BusinessHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

// Default hours used as fallback for BOTH locations if not set in DB yet
const DEFAULT_HOURS: BusinessHour[] = [
  { day: 'Monday',    open: '10:00', close: '02:00', closed: false },
  { day: 'Tuesday',   open: '10:00', close: '02:00', closed: false },
  { day: 'Wednesday', open: '10:00', close: '02:00', closed: false },
  { day: 'Thursday',  open: '10:00', close: '02:00', closed: false },
  { day: 'Friday',    open: '10:00', close: '02:00', closed: false },
  { day: 'Saturday',  open: '10:00', close: '02:00', closed: false },
  { day: 'Sunday',    open: '10:00', close: '02:00', closed: false },
];

export async function fetchHoursForLocation(locationId: string, supabase: any): Promise<BusinessHour[]> {
  const key = `business_hours_${locationId}`;
  const { data } = await supabase
    .from('site_settings')
    .select('setting_value')
    .eq('setting_key', key)
    .maybeSingle();

  if (data?.setting_value) {
    try {
      const parsed = JSON.parse(data.setting_value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  // Always return default hours as fallback — never return empty
  return DEFAULT_HOURS;
}

export function isRestaurantOpen(hours: BusinessHour[]): { open: boolean; message: string } {
  if (!hours || hours.length === 0) return { open: false, message: 'We are currently closed.' };

  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[now.getDay()];
  const todayHours = hours.find(h => h.day === todayName);

  if (!todayHours) return { open: false, message: 'We are currently closed.' };
  if (todayHours.closed) {
    return { open: false, message: `We are closed today (${todayName}). Please check our hours and try again.` };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;

  // Handle past midnight close (e.g. 2:00 AM)
  if (closeMinutes <= openMinutes) closeMinutes += 24 * 60;

  const adjustedCurrent = currentMinutes < openMinutes ? currentMinutes + 24 * 60 : currentMinutes;

  if (adjustedCurrent < openMinutes || adjustedCurrent >= closeMinutes) {
    return {
      open: false,
      message: `We are currently closed. Today's hours are ${formatHour(todayHours.open)} – ${formatHour(todayHours.close)}.`
    };
  }

  return { open: true, message: '' };
}

export function formatHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}
