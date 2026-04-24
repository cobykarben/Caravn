// totalTripCost is set by the driver; driver + accepted riders split equally
export function calculateCostShare(totalTripCost: number, acceptedRiderCount: number): number {
  if (totalTripCost === 0 || acceptedRiderCount === 0) return 0
  return Math.round((totalTripCost / (acceptedRiderCount + 1)) * 100) / 100
}
