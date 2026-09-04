export function getDiffTimeBetweenCurrentDate(
  dateString = "",
  now = new Date()
): string {
  const dayInMilliseconds = 86400000;
  if ([null, undefined, false, true].includes(dateString as never)) {
    return dateString;
  }
  const date = new Date(dateString);
  const isInvalidDate = isNaN(date.getTime());

  if (isInvalidDate) {
    return dateString;
  }

  const month = date.getMonth();
  const day = date.getDate();
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const buildMessage = (label: string, value: number) => {
    if (value !== 1) {
      return `${value} ${label}s atrás`;
    }

    return `${value} ${label} atrás`;
  };
  const notZero = (value: number) => value !== 0;

  if (month !== now.getMonth()) {
    const diff = Math.abs(now.getTime() - date.getTime());
    const days = Math.ceil(diff / dayInMilliseconds);

    return buildMessage("dia", days);
  }

  if (day < now.getDate() && notZero(day)) {
    return buildMessage("dia", now.getDate() - day);
  }
  if (hour < now.getHours() && notZero(hour)) {
    return buildMessage("hora", now.getHours() - hour);
  }
  if (minutes < now.getMinutes() && notZero(minutes)) {
    return buildMessage("minuto", now.getMinutes() - minutes);
  }
  if (seconds < now.getSeconds() && notZero(seconds)) {
    return buildMessage("segundo", now.getSeconds() - seconds);
  }

  return buildMessage("segundo", 1);
}

export function toDateKey(value: string | Date): string {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export function formatTime(value?: string | Date | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
