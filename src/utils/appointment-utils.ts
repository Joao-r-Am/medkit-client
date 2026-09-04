export const STATUS_OPTIONS = [
  { label: "Todos os status", value: "" },
  { label: "Agendado", value: "SCHEDULED" },
  { label: "Confirmado", value: "CONFIRMED" },
  { label: "Concluído", value: "COMPLETED" },
  { label: "Cancelado", value: "CANCELLED" }
];

type StatusStyleMap = Record<string, { chip?: string; dot?: string }>;

const statusStyles: StatusStyleMap = {
  SCHEDULED: {
    chip: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500"
  },
  CONFIRMED: {
    chip: "bg-green-100 text-green-700",
    dot: "bg-green-500"
  },
  COMPLETED: {
    chip: "bg-gray-200 text-gray-700",
    dot: "bg-gray-400"
  },
  CANCELLED: {
    chip: "bg-red-100 text-red-700",
    dot: "bg-red-500"
  }
};

const statusLabelsMap: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado"
};

export function statusClass(status: string) {
  return statusStyles[status]?.chip ?? "bg-gray-100 text-gray-600";
}

export function statusDotClass(status: string) {
  return statusStyles[status]?.dot ?? "bg-gray-400";
}

export function statusLabel(status: string) {
  return statusLabelsMap[status] ?? status;
}

export function serviceLabel(appointment: {
  exam?: { name?: string } | null;
  procedure?: { name?: string } | null;
}) {
  return appointment.exam?.name ?? appointment.procedure?.name ?? "-";
}

export function isSlotTaken(slot: {
  appointments?: { deletedAt?: string | null }[];
}) {
  return (
    slot.appointments?.some(appointment => !appointment.deletedAt) ?? false
  );
}

function mixChannel(channel: number, target: number, amount: number) {
  return Math.round(channel + (target - channel) * amount);
}

export function professionalColor(id?: string): string {
  const hex = (id ?? "").replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  if (hex.length < 6) return "#9CA3AF";
  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (luminance > 215) {
    r = mixChannel(r, 0, 0.3);
    g = mixChannel(g, 0, 0.3);
    b = mixChannel(b, 0, 0.3);
  } else if (luminance < 60) {
    r = mixChannel(r, 255, 0.45);
    g = mixChannel(g, 255, 0.45);
    b = mixChannel(b, 255, 0.45);
  }
  return `#${[r, g, b].map(c => c.toString(16).padStart(2, "0")).join("")}`;
}

export function readableTextColor(color?: string): string {
  const hex = /^#[0-9a-fA-F]{6}$/.test(color ?? "")
    ? (color as string).slice(1)
    : "9ca3af";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150 ? "#1F2937" : "#FFFFFF";
}
