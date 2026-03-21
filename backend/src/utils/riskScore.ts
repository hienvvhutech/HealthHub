export interface RiskInput {
  age: number | null;
  gender: string | null;
  bpSys?: number | null;
  bpDia?: number | null;
  glucose?: number | null;
}
const normalize = (value: number | null | undefined): number => {
  if (value === null || value === undefined || isNaN(Number(value))) return 0;
  return Number(value);
};

export const calculateRiskScore = (data: RiskInput): number => {
  let score = 0;

  const age = normalize(data.age);
  const bpSys = normalize(data.bpSys);
  const bpDia = normalize(data.bpDia);
  const glucose = normalize(data.glucose);
  // ----- Age -----
  if (age >= 60) score += 25;
  else if (age >= 45) score += 15;
  else if (age >= 30) score += 5;
  // ----- Gender -----
  if (data.gender === "Male") {
    score += 3;
  }
  // ----- Blood Pressure -----
  if (bpSys > 0 && bpDia > 0) {
    if (bpSys >= 140 || bpDia >= 90) score += 20;
    else if (bpSys >= 130 || bpDia >= 85) score += 10;
  }
  // ----- Glucose -----
  if (glucose > 0) {
    if (glucose >= 180) score += 20;
    else if (glucose >= 140) score += 10;
  }
  return Math.min(score, 100);
};
export const getRiskLevel = (
  score: number | null
): "low" | "medium" | "high" => {
  if (!score || score < 30) return "low";
  if (score < 60) return "medium";
  return "high";
};
