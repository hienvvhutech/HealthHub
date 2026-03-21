import { Request, Response } from "express";
import prisma from "../../prisma/client";

export const getScreeningPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { age, gender, history, symptom } = req.body; // Added symptom

        // 1. Phân tích chuyên khoa dựa trên lịch sử bệnh & triệu chứng
        let targetSpecialty = "Đa khoa";
        let reasoning = "Khám tổng quát định kỳ để đánh giá sức khỏe toàn diện.";
        let suggestedTests = ["Công thức máu", "Tổng phân tích nước tiểu", "Đường huyết lúc đói"];
        let reminderText = "Khuyên nên khám định kỳ mỗi năm một lần.";

        const historyStr = Array.isArray(history) ? history.join(", ").toLowerCase() : (history || "").toLowerCase();
        const symptomStr = (symptom || "").toLowerCase();

        // --- LOGIC PHÂN TÍCH MỞ RỘNG ---
        
        // Tim mạch
        if (historyStr.includes("hypertension") || historyStr.includes("heartdisease") || symptomStr.includes("đau ngực") || symptomStr.includes("tim đập nhanh")) {
            targetSpecialty = "Tim mạch";
            reasoning = "Dựa trên tiền sử tim mạch/huyết áp hoặc triệu chứng đau ngực, cần kiểm tra chức năng tim.";
            suggestedTests.push("Điện tâm đồ (ECG)", "Siêu âm tim", "Mỡ máu (Lipid profile)");
            reminderText = "Khuyên khám định kỳ 3-6 tháng/lần để theo dõi huyết áp và tim mạch.";
        }
        // Nội tiết (Tiểu đường)
        else if (historyStr.includes("diabetes") || symptomStr.includes("khát nước") || symptomStr.includes("sụt cân")) {
            targetSpecialty = "Nội tiết";
            reasoning = "Nghi ngờ hoặc có tiền sử tiểu đường, cần đánh giá đường huyết chuyên sâu.";
            suggestedTests.push("HbA1c", "Chức năng thận", "Khám mắt (biến chứng)");
            reminderText = "Tuân thủ chế độ ăn và tái khám 3 tháng/lần.";
        }
        // Hô hấp
        else if (historyStr.includes("asthma") || historyStr.includes("copd") || symptomStr.includes("ho") || symptomStr.includes("khó thở")) {
            targetSpecialty = "Hô hấp";
            reasoning = "Có dấu hiệu bệnh lý đường hô hấp (hen suyễn, ho kéo dài).";
            suggestedTests.push("Chụp X-quang phổi", "Đo chức năng hô hấp");
            reminderText = "Tránh khói bụi, tái khám khi có triệu chứng khó thở tăng.";
        }
        // Tiêu hóa
        else if (historyStr.includes("gastritis") || historyStr.includes("gerd") || symptomStr.includes("đau bụng") || symptomStr.includes("ợ chua") || symptomStr.includes("khó tiêu")) {
            targetSpecialty = "Tiêu hóa";
            reasoning = "Triệu chứng gợi ý bệnh lý dạ dày hoặc đường tiêu hóa.";
            suggestedTests.push("Nội soi dạ dày", "Siêu âm bụng", "Xét nghiệm HP");
            reminderText = "Ăn uống đúng giờ, hạn chế chua cay.";
        }
        // Cơ xương khớp
        else if (historyStr.includes("arthritis") || symptomStr.includes("đau lưng") || symptomStr.includes("đau khớp") || symptomStr.includes("mỏi gối")) {
            targetSpecialty = "Cơ xương khớp";
            reasoning = "Triệu chứng đau nhức xương khớp, cần kiểm tra vận động.";
            suggestedTests.push("Chụp X-quang khớp", "Đo mật độ xương (nếu lớn tuổi)");
            reminderText = "Tập vật lý trị liệu nhẹ nhàng, bổ sung Canxi.";
        }
        // Thần kinh
        else if (historyStr.includes("headache") || symptomStr.includes("đau đầu") || symptomStr.includes("chóng mặt") || symptomStr.includes("mất ngủ")) {
            targetSpecialty = "Thần kinh";
            reasoning = "Triệu chứng thần kinh (đau đầu, chóng mặt), cần loại trừ bệnh lý não bộ.";
            suggestedTests.push("Điện não đồ", "MRI sọ não (nếu cần)", "Đo lưu huyết não");
            reminderText = "Ngủ đủ giấc, tránh căng thẳng.";
        }
         // Da liễu
         else if (historyStr.includes("dermatitis") || symptomStr.includes("ngứa") || symptomStr.includes("nổi mẩn") || symptomStr.includes("mụn")) {
            targetSpecialty = "Da liễu";
            reasoning = "Các vấn đề về da liễu cần được soi da và tư vấn chuyên sâu.";
            suggestedTests.push("Soi da", "Xét nghiệm dị ứng");
            reminderText = "Tránh tiếp xúc hóa chất lạ, dưỡng ẩm da.";
        }
         // Mắt
         else if (symptomStr.includes("mờ mắt") || symptomStr.includes("đau mắt")) {
            targetSpecialty = "Mắt";
            reasoning = "Triệu chứng về thị lực.";
            suggestedTests.push("Đo thị lực", "Soi đáy mắt");
        }
        // Tai mũi họng
        else if (symptomStr.includes("đau họng") || symptomStr.includes("ù tai") || symptomStr.includes("sổ mũi")) {
            targetSpecialty = "Tai mũi họng";
            reasoning = "Triệu chứng viêm đường hô hấp trên.";
            suggestedTests.push("Nội soi tai mũi họng");
        }

        // Logic tuổi tác
        if (age > 50) {
             reasoning += " (Lưu ý: Bệnh nhân trên 50 tuổi cần tầm soát kỹ hơn).";
             suggestedTests.push("Tầm soát ung thư (Marker)");
        }

        // 2. Tìm bác sĩ phù hợp trong DB
        const doctor = await prisma.doctor.findFirst({
            where: {
                specialty: {
                    name: {
                        contains: targetSpecialty // Tìm bác sĩ có chuyên khoa tương ứng
                    }
                }
            },
            include: { specialty: true } // Kèm thông tin chuyên khoa
        });
        
        // Fallback nếu không tìm thấy bác sĩ đúng chuyên khoa
        const finalDoctor = doctor || await prisma.doctor.findFirst({ include: { specialty: true }});

        res.json({
            success: true,
            data: {
                specialty: targetSpecialty,
                doctor: finalDoctor,
                advice: `Dựa trên triệu chứng, bạn nên khám chuyên khoa ${targetSpecialty}.`,
                tests: suggestedTests,
                reasoning: reasoning,
                reminder: reminderText
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "AI Error" });
    }
};

export const seedData = async (req: Request, res: Response) => {
    res.send("Seed data endpoint");
}
