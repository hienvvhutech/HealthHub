import symptomSpecialty from "../data/symptomSpecialty.json";
import specialtyTests from "../data/specialtyTests.json";
import systemRules from "../data/systemRules.json";
import prisma from "../../prisma/client";

import { calculateRiskScore } from "../utils/riskScore";

export interface AIContextParams {
  patientId: number;
}

/**
 * Convert dữ liệu HealthData (metric/value) thành 1 object để tính Risk Score
 */
const extractVitalsFromHealthData = (records: any[]) => {
  const vitals: any = {
    bpSys: null,
    bpDia: null,
    glucose: null,
  };

  for (const r of records) {
    if (r.metric === "bpSys") vitals.bpSys = Number(r.value);
    if (r.metric === "bpDia") vitals.bpDia = Number(r.value);
    if (r.metric === "glucose") vitals.glucose = Number(r.value);
  }

  return vitals;
};

export const buildAIContext = async ({ patientId }: AIContextParams) => {
  // Lấy 10 record gần nhất để phân tích
  const healthData = await prisma.healthData.findMany({
    where: { patientId },
    orderBy: { collectedAt: "desc" },
    take: 10,
  });

  // Convert metric/value thành các chỉ số đo chuẩn
  const vitals = extractVitalsFromHealthData(healthData);

  const riskScore =
    vitals.bpSys || vitals.bpDia || vitals.glucose
      ? calculateRiskScore({
          age: null,
          gender: null,
          bpSys: vitals.bpSys,
          bpDia: vitals.bpDia,
          glucose: vitals.glucose,
        })
      : null;

  return {
    symptomSpecialty,
    specialtyTests,
    systemRules,
    patientHealthData: healthData,
    vitals,
    riskScore,
  };
};
