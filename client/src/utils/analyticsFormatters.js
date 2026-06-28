export function truncateLabel(label, maxLength = 18) {
  const text = String(label || "");
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

export function formatDateTime(timestamp) {
  if (!timestamp) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

export function formatPercentage(value) {
  const numberValue = Number(value) || 0;
  return `${Math.round(numberValue)}%`;
}

export function formatCount(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
}

export function toSafeArray(data) {
  return Array.isArray(data) ? data.filter(Boolean) : [];
}

export function groupSmallCategories(data, labelKey, valueKey, limit = 8) {
  const safeData = toSafeArray(data)
    .map((item) => ({
      ...item,
      [valueKey]: Number(item?.[valueKey]) || 0
    }))
    .filter((item) => item[labelKey] && item[valueKey] > 0)
    .sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]));

  if (safeData.length <= limit) {
    return safeData;
  }

  const visibleItems = safeData.slice(0, limit);
  const otherCount = safeData.slice(limit).reduce((sum, item) => sum + Number(item[valueKey] || 0), 0);

  return [
    ...visibleItems,
    {
      [labelKey]: "Others",
      [valueKey]: otherCount
    }
  ];
}

export function getStatusFromScore(score) {
  const value = Number(score) || 0;

  if (value >= 80) {
    return "Likely eligible";
  }

  if (value >= 50) {
    return "Partially eligible";
  }

  return "Not eligible";
}
