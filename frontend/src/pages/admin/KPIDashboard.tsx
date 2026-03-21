import React, { useEffect, useState } from "react";
import { IonPage, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner } from "@ionic/react";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "../../services/axiosInstance";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import "./KPIDashboard.css";

// Dữ liệu mặc định (fallback nếu API lỗi hoặc chưa có data)
const INITIAL_KPI_DATA = {
  uptakeScreeningPlan: 0,
  reExamOnTimePercentage: 0,
  reminderCompletionPercentage: 0,
  iotMeasurementsPerWeek: 0,
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const KPIDashboard: React.FC = () => {
  const [kpiData, setKpiData] = useState(INITIAL_KPI_DATA);
  const [uptakeChartData, setUptakeChartData] = useState<any[]>([]);
  const [reExamChartData, setReExamChartData] = useState<any[]>([]);
  const [iotChartData, setIotChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        //  Gọi API từ Backend
        const response = await axios.get("/dashboard/kpi-summary");
        
        console.log("KPI Data:", response.data);

        setKpiData(response.data.kpi);
        setUptakeChartData(response.data.uptakeChart || []);
        setReExamChartData(response.data.reExamChart || []);
        setIotChartData(response.data.iotChart || []);
        
      } catch (error) {
        console.error("Failed to fetch KPI data", error);
        // Fallback to initial if error
        setKpiData(INITIAL_KPI_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <IonPage>
        <AdminSidebar />
        <div id="main">
          <IonContent className="ion-padding">
            <div className="loading-container">
              <IonSpinner name="crescent" />
              <p>Đang tải dữ liệu KPI từ hệ thống...</p>
            </div>
          </IonContent>
        </div>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <AdminSidebar />
      <div id="main">
        <IonContent className="ion-padding">
          <div className="kpi-header">
            <h1>Dashboard - Chỉ số hiệu suất chính (KPI)</h1>
            <p>Phân tích các chỉ số quan trọng dựa trên dữ liệu thực tế.</p>
          </div>

          {/* KPI Cards */}
          <IonGrid>
            <IonRow>
              <IonCol size="12" size-md="6" size-lg="3">
                <IonCard className="kpi-card uptake">
                  <IonCardHeader>
                    <IonCardTitle>Tổng Gợi Ý Gói Khám</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className="kpi-value">{kpiData.uptakeScreeningPlan}</IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" size-md="6" size-lg="3">
                <IonCard className="kpi-card reexam">
                  <IonCardHeader>
                    <IonCardTitle>% Tái khám đúng hạn</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className="kpi-value">{kpiData.reExamOnTimePercentage}%</IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" size-md="6" size-lg="3">
                <IonCard className="kpi-card reminder">
                  <IonCardHeader>
                    <IonCardTitle>% Hoàn thành nhắc nhở</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className="kpi-value">{kpiData.reminderCompletionPercentage}%</IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" size-md="6" size-lg="3">
                <IonCard className="kpi-card iot">
                  <IonCardHeader>
                    <IonCardTitle>Số lần đo IoT/tuần</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className="kpi-value">{kpiData.iotMeasurementsPerWeek}</IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
          
          {/* Charts */}
          <IonGrid>
            <IonRow>
              {/* Uptake Gói Khám */}
              <IonCol size="12" size-lg="6">
                <IonCard className="chart-card">
                  <IonCardHeader>
                    <IonCardTitle>Phân bổ Gói khám (AI Gợi ý)</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      {uptakeChartData.length > 0 ? (
                        <PieChart>
                          <Pie data={uptakeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                            {uptakeChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      ) : (
                        <div style={{textAlign: 'center', paddingTop: '100px'}}>Chưa có dữ liệu</div>
                      )}
                    </ResponsiveContainer>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              {/* % Tái khám đúng hạn */}
              <IonCol size="12" size-lg="6">
                <IonCard className="chart-card">
                  <IonCardHeader>
                    <IonCardTitle>Tỷ lệ Tái khám (Demo Chart)</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reExamChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis unit="%" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="onTime" stackId="a" fill="#82ca9d" name="Đúng hạn" />
                        <Bar dataKey="late" stackId="a" fill="#ffc658" name="Trễ hạn/Bỏ lỡ" />
                      </BarChart>
                    </ResponsiveContainer>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              {/* Số lần đo IoT/tuần */}
              <IonCol size="12" size-lg="6">
                 <IonCard className="chart-card">
                  <IonCardHeader>
                    <IonCardTitle>Số lần đo IoT (4 tuần gần nhất)</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={iotChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="measurements" name="Số lần đo" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                  </IonCardContent>
                </IonCard>
              </IonCol>

               {/* % Hoàn thành nhắc nhở (Sử dụng lại Pie Chart làm ví dụ) */}
              <IonCol size="12" size-lg="6">
                <IonCard className="chart-card">
                  <IonCardHeader>
                    <IonCardTitle>Tỷ lệ Hoàn thành Nhắc nhở</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={[{name: 'Hoàn thành', value: kpiData.reminderCompletionPercentage}, {name: 'Chưa hoàn thành', value: 100 - kpiData.reminderCompletionPercentage}]}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                label
                            >
                                <Cell fill="#00C49F" />
                                <Cell fill="#FF8042" />
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </div>
    </IonPage>
  );
};

export default KPIDashboard;
