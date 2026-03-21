import React, { useEffect, useState } from "react";
import axios from "../../services/axiosInstance";

type Medicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  note: string;
};

type Appointment = {
  id: number;
  date: string;
  note: string;
  status: string;
  patient?: {
    fullName: string;
  };
  canLamSangs?: {
    type: string;
    result: string;
    note: string;
  }[];
  prescription?: {
    instructions: string;
    medications: Medicine[];
  };
};

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [noteById, setNoteById] = useState<Record<number, string>>({});
  const [clsDataById, setClsDataById] = useState<
    Record<number, { type: string; result: string; note: string }>
  >({});
  const [prescriptionsById, setPrescriptionsById] = useState<
    Record<number, Medicine[]>
  >({});
  const [instructionsById, setInstructionsById] = useState<
    Record<number, string>
  >({});
  const [reExamDateById, setReExamDateById] = useState<Record<number, string>>(
    {}
  );

  const fetchAppointments = async () => {
    const token = localStorage.getItem("token");
    // ✅ Use relative path
    const res = await axios.get(
      "/appointments/doctor/me",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setAppointments(res.data);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    const reExamDate = reExamDateById[id];
    const note = noteById[id] || "";

    // ✅ Use relative path
    await axios.put(
      `/appointments/${id}/status`,
      { status, reExamDate, note },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchAppointments();
  };

  const handleSubmitCLS = async (id: number) => {
    const token = localStorage.getItem("token");
    const clsData = clsDataById[id];
    // ✅ Use relative path
    await axios.post(
      "/cls",
      {
        appointmentId: id,
        ...clsData,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    alert("Đã lưu kết quả CLS!");
    fetchAppointments();
  };

  const handleAddMedicine = (id: number) => {
    setPrescriptionsById((prev) => ({
      ...prev,
      [id]: [
        ...(prev[id] || []),
        { name: "", dosage: "", frequency: "", duration: "", note: "" },
      ],
    }));
  };

  const handlePrescriptionChange = (
    id: number,
    index: number,
    field: keyof Medicine,
    value: string
  ) => {
    const updated = [...(prescriptionsById[id] || [])];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptionsById((prev) => ({ ...prev, [id]: updated }));
  };

  const handleSubmitPrescription = async (appointmentId: number) => {
    const token = localStorage.getItem("token");
    const reExamDate = reExamDateById[appointmentId];

    // ✅ Use relative path
    await axios.post(
      "/doctors/prescriptions",
      {
        appointmentId,
        instructions: instructionsById[appointmentId] || "",
        medications: prescriptionsById[appointmentId] || [],
        reExamDate: reExamDate ? reExamDate + "T00:00:00Z" : null,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    alert("Đã lưu đơn thuốc!");
    fetchAppointments();
  };

  return (
    <div style={{ maxHeight: "80vh", overflowY: "auto", padding: "1rem" }}>
      <h2>Lịch Khám</h2>
      {appointments.map((item) => {
        const cls = clsDataById[item.id] || { type: "", result: "", note: "" };
        const prescriptionList = prescriptionsById[item.id] || [
          { name: "", dosage: "", frequency: "", duration: "", note: "" },
        ];
        const instructions = instructionsById[item.id] || "";
        const note = noteById[item.id] || "";

        return (
          <div
            key={item.id}
            style={{ border: "1px solid #ccc", padding: 10, marginBottom: 15 }}
          >
            <p>
              <strong>Bệnh nhân:</strong>{" "}
              {item.patient?.fullName ?? (
                <em style={{ color: "gray" }}>[Không có thông tin]</em>
              )}
            </p>
            <p>
              <strong>Ngày khám:</strong> {new Date(item.date).toLocaleString()}
            </p>
            <p>
              <strong>Ghi chú:</strong> {item.note || "Không có"}
            </p>
            <p>
              <strong>Trạng thái:</strong> {item.status}
            </p>

            <label>Ngày tái khám:</label>
            <input
              type="date"
              value={reExamDateById[item.id] || ""}
              onChange={(e) =>
                setReExamDateById({
                  ...reExamDateById,
                  [item.id]: e.target.value,
                })
              }
            />

            <label>Ghi chú:</label>
            <textarea
              value={note}
              onChange={(e) =>
                setNoteById({ ...noteById, [item.id]: e.target.value })
              }
            />

            <select
              onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
              defaultValue={item.status}
            >
              <option value="scheduled">Chờ khám</option>
              <option value="completed">Đã khám</option>
              <option value="cancelled">Đã huỷ</option>
            </select>

            <h4>🧪 Nhập kết quả CLS:</h4>
            <input
              placeholder="Loại CLS"
              value={cls.type}
              onChange={(e) =>
                setClsDataById({
                  ...clsDataById,
                  [item.id]: { ...cls, type: e.target.value },
                })
              }
            />
            <input
              placeholder="Kết quả"
              value={cls.result}
              onChange={(e) =>
                setClsDataById({
                  ...clsDataById,
                  [item.id]: { ...cls, result: e.target.value },
                })
              }
            />
            <textarea
              placeholder="Ghi chú"
              value={cls.note}
              onChange={(e) =>
                setClsDataById({
                  ...clsDataById,
                  [item.id]: { ...cls, note: e.target.value },
                })
              }
            />
            <button onClick={() => handleSubmitCLS(item.id)}>
              Lưu kết quả CLS
            </button>

            <h4>💊 Đơn thuốc:</h4>
            {prescriptionList.map((med, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <input
                  placeholder="Tên thuốc"
                  value={med.name}
                  onChange={(e) =>
                    handlePrescriptionChange(
                      item.id,
                      index,
                      "name",
                      e.target.value
                    )
                  }
                />
                <input
                  placeholder="Liều dùng"
                  value={med.dosage}
                  onChange={(e) =>
                    handlePrescriptionChange(
                      item.id,
                      index,
                      "dosage",
                      e.target.value
                    )
                  }
                />
                <input
                  placeholder="Tần suất"
                  value={med.frequency}
                  onChange={(e) =>
                    handlePrescriptionChange(
                      item.id,
                      index,
                      "frequency",
                      e.target.value
                    )
                  }
                />
                <input
                  placeholder="Số ngày"
                  value={med.duration}
                  onChange={(e) =>
                    handlePrescriptionChange(
                      item.id,
                      index,
                      "duration",
                      e.target.value
                    )
                  }
                />
                <input
                  placeholder="Ghi chú"
                  value={med.note}
                  onChange={(e) =>
                    handlePrescriptionChange(
                      item.id,
                      index,
                      "note",
                      e.target.value
                    )
                  }
                />
              </div>
            ))}
            <button onClick={() => handleAddMedicine(item.id)}>
              + Thêm thuốc
            </button>

            <textarea
              placeholder="Hướng dẫn sử dụng"
              value={instructions}
              onChange={(e) =>
                setInstructionsById({
                  ...instructionsById,
                  [item.id]: e.target.value,
                })
              }
              style={{ width: "100%", marginTop: 8 }}
            />
            <button onClick={() => handleSubmitPrescription(item.id)}>
              Lưu đơn thuốc
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default DoctorAppointments;
