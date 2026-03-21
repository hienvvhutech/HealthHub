import prisma from "../../prisma/client";
import { buildAIContext } from "../ai/ai.context";
import { callAIModel } from "./ai.service";
import { extractSymptoms, normalizeText } from "../ai/ai.helper";

import symptomSpecialtyRaw from "../data/symptomSpecialty.json";
import specialtyTestsRaw from "../data/specialtyTests.json";

const symptomSpecialty = symptomSpecialtyRaw as Record<string, string>;
const specialtyTests = specialtyTestsRaw as Record<string, string[]>;

// Doctor type
type DoctorResult = {
  id: number;
  fullName: string;
  experience: number | null;
};

export const getRecommendation = async (
  patientId: number,
  userMessage: string
) => {
  if (!userMessage || userMessage.trim().length === 0) {
    return {
      message: "Vui lòng mô tả triệu chứng của bạn.",
    };
  }

  const text = normalizeText(userMessage);
  const symptoms = extractSymptoms(text);

  // ===== LAYER 1: Mapping triệu chứng ===== //
  let detectedSpecialty: string | null = null;

  for (const symptom of symptoms) {
    if (symptomSpecialty[symptom]) {
      detectedSpecialty = symptomSpecialty[symptom];
      break;
    }
  }

  // ===== BUILD CONTEXT ===== //
  const context = await buildAIContext({ patientId });

  // ===== CALL AI ===== //
  const aiResponse = await callAIModel({
    messages: [{ role: "user", content: userMessage }],
    context,
  });

  const finalSpecialty = aiResponse.specialty || detectedSpecialty;

  // ===== LAYER 3: BACKEND LOGIC ===== //
  let doctors: DoctorResult[] = [];
  let tests: string[] = [];

  if (finalSpecialty) {
    doctors = await prisma.doctor.findMany({
      where: {
        specialty: {
          name: finalSpecialty,
        },
      },
      select: {
        id: true,
        fullName: true,
        experience: true,
      },
    });

    tests = specialtyTests[finalSpecialty] || [];
  }

  return {
    message: aiResponse.answer,
    specialty: finalSpecialty,
    riskLevel: aiResponse.riskLevel,
    doctors,
    tests,
  };
};
