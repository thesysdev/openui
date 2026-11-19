const tooltipNumberFormatter = (value: number) => {
  const isNegative = value < 0;
  const absValue = Math.abs(value);

  if (absValue < 100000) {
    return (isNegative ? "-" : "") + absValue.toLocaleString();
  }

  const units = ["", "K", "M", "B", "T"];
  let unitIndex = 0;
  let scaledValue = absValue;

  while (scaledValue >= 1000 && unitIndex < units.length - 1) {
    scaledValue /= 1000;
    unitIndex++;
  }

  const formattedValue = Math.floor(scaledValue * 10) / 10;

  return (isNegative ? "-" : "") + `${formattedValue}${units[unitIndex]}`;
};

export { tooltipNumberFormatter };
