import React from "react";
import { IonIcon } from "@ionic/react";
import { logoFacebook, logoTwitter, logoInstagram } from "ionicons/icons";
import "./Footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <h3 className="footer-logo">HealthHub</h3>
          <p className="footer-description">
            Nền tảng tin cậy cho các dịch vụ y tế, chăm sóc sức khỏe.
          </p>
          <div className="footer-socials">
            <a href="#" aria-label="Facebook">
              <IonIcon icon={logoFacebook} />
            </a>
            <a href="#" aria-label="Twitter">
              <IonIcon icon={logoTwitter} />
            </a>
            <a href="#" aria-label="Instagram">
              <IonIcon icon={logoInstagram} />
            </a>
          </div>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>HealthHub</h4>
            <ul>
              <li>
                <a href="#">Trang chủ</a>
              </li>
              <li>
                <a href="#">Đặt lịch khám</a>
              </li>
              <li>
                <a href="#">Tìm bác sĩ</a>
              </li>
              <li>
                <a href="#">Hồ sơ y tế</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Hỗ trợ</h4>
            <ul>
              <li>
                <a href="#">Câu hỏi thường gặp</a>
              </li>
              <li>
                <a href="#">Hướng dẫn sử dụng</a>
              </li>
              <li>
                <a href="#">Chính sách bảo mật</a>
              </li>
              <li>
                <a href="#">Điều khoản dịch vụ</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Liên hệ</h4>
            <ul className="contact-info">
              <li>Email: support@healthhub.com</li>
              <li>Hotline: 1900 1234</li>
              <li>Địa chỉ: Hà Nội, Việt Nam</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 HealthHub. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
