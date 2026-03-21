import React, { useEffect, useState } from "react";
import axios from "axios";

interface Patient {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  dob?: string;
  gender?: string;
  createdAt: string;
}

const PatientDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/patients")
      .then((res) => {
        setPatients(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi khi tải danh sách bệnh nhân:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Danh sách bệnh nhân</h1>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <table className="table-auto w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">#</th>
              <th className="px-4 py-2 border">Họ tên</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">SĐT</th>
              <th className="px-4 py-2 border">Giới tính</th>
              <th className="px-4 py-2 border">Ngày sinh</th>
              <th className="px-4 py-2 border">Địa chỉ</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p, index) => (
              <tr key={p.id}>
                <td className="px-4 py-2 border text-center">{index + 1}</td>
                <td className="px-4 py-2 border">{p.fullName}</td>
                <td className="px-4 py-2 border">{p.email}</td>
                <td className="px-4 py-2 border">{p.phone || "—"}</td>
                <td className="px-4 py-2 border">{p.gender || "—"}</td>
                <td className="px-4 py-2 border">
                  {p.dob ? new Date(p.dob).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2 border">{p.address || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PatientDashboard;
