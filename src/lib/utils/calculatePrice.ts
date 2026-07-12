export function calculatePrice(input: { baseFee: number; perKmFee: number; distanceKm: number; codPercent?: number; codAmount?: number }) {
  return input.baseFee + input.perKmFee * input.distanceKm + ((input.codAmount ?? 0) * (input.codPercent ?? 0)) / 100;
}
