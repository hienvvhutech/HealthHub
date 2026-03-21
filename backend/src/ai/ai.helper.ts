// Tách triệu chứng từ câu nói tiếng Việt
export const extractSymptoms = (text: string): string[] => {
  if (!text) return [];

  return text
    .toLowerCase()
    .split(/[.,;:!?]/)
    .map((part) => part.trim())
    .filter((p) => p.length > 0);
};

// Kiểm tra nội dung tin nhắn có hợp lệ không
export const validateUserMessage = (msg: string): boolean => {
  if (!msg) return false;
  if (msg.length < 2) return false;
  return true;
};

// Chuẩn hoá text để AI dễ hiểu
export const normalizeText = (text: string): string => {
  return text.trim().toLowerCase();
};
