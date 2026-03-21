import React, { useEffect, useState } from "react";
import axios from "../../services/axiosInstance";

interface Feedback {
  id: number;
  fullName: string;
  email: string;
  message: string;
  createdAt: string;
}

const DoctorFeedbacks: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const doctorId = parseInt(localStorage.getItem("doctorId") || "0", 10);

  useEffect(() => {
    if (doctorId) {
      // ✅ Use relative path
      axios
        .get(`/feedbacks/doctor/${doctorId}`)
        .then((res) => setFeedbacks(res.data));
    }
  }, [doctorId]);

  return (
    <div className="p-4">
      <h2>📋 Phản hồi bệnh nhân dành cho tôi</h2>
      <table>
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Nội dung</th>
            <th>Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {feedbacks.map((fb: Feedback) => (
            <tr key={fb.id}>
              <td>{fb.fullName}</td>
              <td>{fb.email}</td>
              <td>{fb.message}</td>
              <td>{new Date(fb.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DoctorFeedbacks;
