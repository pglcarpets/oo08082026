export function formatKpiNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.max(0, value));
}

export function formatKpiValuePlus(value: number): string {
  return `${formatKpiNumber(value)}+`;
}

export function formatKpiAsOf(dateIso: string): string {
  const parsed = new Date(dateIso);
  if (Number.isNaN(parsed.getTime())) {
    return "As of latest verified update";
  }

  const formatted = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(parsed);

  return `As of ${formatted}`;
}

export function formatTrustedClientsFooter(clientCount: number): string {
  return `${formatKpiValuePlus(clientCount)} clients across Government, Finance, Energy, Manufacturing & more`;
}
