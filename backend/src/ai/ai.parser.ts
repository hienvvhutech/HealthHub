export interface AIResult {
  answer: string;
  intent?: string;
  specialty?: string;
  suggestedDoctorId?: number;
  riskLevel?: "low" | "medium" | "high";
}

export const parseAIResponse = (raw: string): AIResult => {
  try {
    const json = JSON.parse(raw);

    return {
      answer: json.answer || "",
      intent: json.intent || null,
      specialty: json.specialty || null,
      suggestedDoctorId: json.suggestedDoctorId || null,
      riskLevel: json.riskLevel || null,
    };
  } catch (err) {
    console.error("❌ JSON_PARSE_ERROR:", err);

    return {
      answer: "Xin lỗi, tôi không thể hiểu yêu cầu của bạn.",
      intent: "unknown",
    };
  }
};
