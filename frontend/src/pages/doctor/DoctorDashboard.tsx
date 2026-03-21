import React, { useEffect, useState } from "react";
import axios from "axios";

interface Doctor {
  id: number;
  fullName: string;
  email: string;
  specialty?: string;
  phone?: string;
  createdAt: string;
}

const DoctorDashboard: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/doctors")
      .then((response) => {
        setDoctors(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Lỗi khi tải danh sách bác sĩ:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Danh sách bác sĩ</h1>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table className="table-auto w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">#</th>
              <th className="px-4 py-2 border">Họ tên</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Chuyên khoa</th>
              <th className="px-4 py-2 border">SĐT</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor, index) => (
              <tr key={doctor.id}>
                <td className="px-4 py-2 border text-center">{index + 1}</td>
                <td className="px-4 py-2 border">{doctor.fullName}</td>
                <td className="px-4 py-2 border">{doctor.email}</td>
                <td className="px-4 py-2 border">{doctor.specialty || "—"}</td>
                <td className="px-4 py-2 border">{doctor.phone || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DoctorDashboard;
