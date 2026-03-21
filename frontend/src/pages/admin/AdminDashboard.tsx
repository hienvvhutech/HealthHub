import React, { useEffect, useState } from "react";
import { IonContent, IonPage } from "@ionic/react";
import axios from "../../services/axiosInstance";
import AdminSidebar from "../../components/AdminSidebar";

import "./AdminDashboard.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyChart {
  month: number;
  total: number;
}

interface RecentAppointment {
  id: number;
  patient: { fullName: string };
  doctor: { fullName: string };
  date: string;
  time: string;
  status: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    totalPatients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    completed: 0,
    pending: 0,
  });

  const [monthlyChart, setMonthlyChart] = useState<MonthlyChart[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<
    RecentAppointment[]
  >([]);

  const loadDashboard = async () => {
    try {
      const res = await axios.get("/dashboard");

      const data = res.data.data;

      setStats({
        revenue: data.totalRevenue || 0,
        totalPatients: data.totalPatients || 0,
        totalAppointments: data.totalAppointments || 0,
        todayAppointments: data.todayAppointments || 0,
        completed: data.completed || 0,
        pending: data.pending || 0,
      });

      setMonthlyChart(data.monthlyChart || []);
      setRecentAppointments(data.recentAppointments || []);
    } catch (err) {
      console.error("Dashboard Error:", err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <IonPage className="admin-container">
      <AdminSidebar />

      <div id="main">
        <IonContent className="ion-padding">
          {/* HEADER */}
          <div className="page-header">
            <h1>Dashboard</h1>
            <p>Chào mừng bạn quay lại với hệ thống quản trị</p>
          </div>

          {/* KPI CARDS */}
          <div className="kpi-group">
            <div className="kpi-card green">
              <div className="kpi-title">Tổng doanh thu</div>
              <div className="kpi-value">
                {stats.revenue.toLocaleString("vi-VN")} VND
              </div>
            </div>

            <div className="kpi-card blue">
              <div className="kpi-title">Lịch hẹn hôm nay</div>
              <div className="kpi-value">{stats.todayAppointments}</div>
            </div>

            <div className="kpi-card purple">
              <div className="kpi-title">Tổng bệnh nhân</div>
              <div className="kpi-value">{stats.totalPatients}</div>
            </div>
          </div>
          <div className="block-card">
            <h2>Biểu đồ doanh thu (12 tháng gần nhất)</h2>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  label={{ value: "Tháng", position: "insideBottom", dy: 10 }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Doanh thu (VND)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip formatter={(v: number) => `${v.toLocaleString()} đ`} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  dot={{ r: 5, strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* MONTHLY REVENUE */}
          <div className="block-card">
            <h2>Doanh thu 6 tháng gần nhất</h2>

            <div className="chart-container">
              {monthlyChart.length === 0 ? (
                <p className="no-data">Chưa có dữ liệu</p>
              ) : (
                monthlyChart.map((item) => (
                  <div className="chart-row" key={item.month}>
                    <span className="chart-label">T{item.month}</span>

                    <div className="chart-bar">
                      <div
                        className="chart-fill"
                        style={{
                          width: `${Math.min(item.total / 20000, 100)}%`,
                        }}
                      ></div>

                      <span className="chart-value">
                        {item.total.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* APPOINTMENT STATUS */}
          <div className="block-card status-list">
            <h2>Trạng thái lịch hẹn</h2>

            <div className="status-box green-bg">
              <span>Đã hoàn thành</span>
              <strong>{stats.completed}</strong>
              <span className="percent">
                {stats.totalAppointments > 0
                  ? Math.round(
                      (stats.completed / stats.totalAppointments) * 100
                    )
                  : 0}
                %
              </span>
            </div>

            <div className="status-box yellow-bg">
              <span>Đang chờ</span>
              <strong>{stats.pending}</strong>
              <span className="percent">
                {stats.totalAppointments > 0
                  ? Math.round((stats.pending / stats.totalAppointments) * 100)
                  : 0}
                %
              </span>
            </div>

            <div className="status-box lightblue-bg">
              <span>Tổng lịch hẹn</span>
              <strong>{stats.totalAppointments}</strong>
            </div>
          </div>

          {/* RECENT APPOINTMENTS */}
          <div className="block-card">
            <h2>Lịch hẹn gần đây</h2>

            <table className="styled-table">
              <thead>
                <tr>
                  <th>Bệnh nhân</th>
                  <th>Bác sĩ</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {recentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : (
                  recentAppointments.map((a) => (
                    <tr key={a.id}>
                      <td>{a.patient?.fullName}</td>
                      <td>{a.doctor?.fullName}</td>
                      <td>
                        {a.date} - {a.time}
                      </td>
                      <td>{a.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </IonContent>
      </div>
    </IonPage>
  );
};

export default AdminDashboard;
