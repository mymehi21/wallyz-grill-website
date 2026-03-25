export function getRelativeDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return 'Today';
  } else if (date.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }
}

export function getFormattedTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function groupItemsByDate<T extends { created_at: string }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  items.forEach(item => {
    const dateLabel = getRelativeDateLabel(item.created_at);
    if (!grouped.has(dateLabel)) {
      grouped.set(dateLabel, []);
    }
    grouped.get(dateLabel)!.push(item);
  });

  return grouped;
}

export function sortDateGroups(groups: Map<string, any[]>): [string, any[]][] {
  const entries = Array.from(groups.entries());

  return entries.sort((a, b) => {
    const [labelA] = a;
    const [labelB] = b;

    if (labelA === 'Today') return -1;
    if (labelB === 'Today') return 1;
    if (labelA === 'Yesterday') return -1;
    if (labelB === 'Yesterday') return 1;

    const dateA = new Date(labelA);
    const dateB = new Date(labelB);
    return dateB.getTime() - dateA.getTime();
  });
}

export function formatTimeTo12Hour(time24: string): string {
  if (!time24) return '';

  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;

  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}
