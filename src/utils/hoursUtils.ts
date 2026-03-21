export interface BusinessHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export async function fetchHoursForLocation(locationId: string, supabase: any): Promise<BusinessHour[]> {
  const key = `business_hours_${locationId}`;
  const { data } = await supabase
    .from('site_settings')
    .select('setting_value')
    .eq('setting_key', key)
    .maybeSingle();
  
  if (data?.setting_value) {
    try { return JSON.parse(data.setting_value); } catch {}
  }
  return [];
}

export function isRestaurantOpen(hours: BusinessHour[]): { open: boolean; message: string } {
  if (!hours || hours.length === 0) return { open: true, message: '' };

  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[now.getDay()];
  const todayHours = hours.find(h => h.day === todayName);

  if (!todayHours) return { open: true, message: '' };
  if (todayHours.closed) return { open: false, message: `We are closed today (${todayName}). Please select another day.` };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [openH, openM] = todayHours.open.split(':').map(Number);
  let [closeH, closeM] = todayHours.close.split(':').map(Number);
  
  const openMinutes = openH * 60 + openM;
  // Handle past midnight (e.g. close at 2:00 AM = 26:00)
  let closeMinutes = closeH * 60 + closeM;
  if (closeMinutes < openMinutes) closeMinutes += 24 * 60;
  
  const adjustedCurrent = currentMinutes < openMinutes ? currentMinutes + 24 * 60 : currentMinutes;

  if (adjustedCurrent < openMinutes || adjustedCurrent >= closeMinutes) {
    const fmt = (h: number, m: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    return {
      open: false,
      message: `We are currently closed. Today's hours are ${fmt(openH, openM)} – ${fmt(closeH, closeM)}.`
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
