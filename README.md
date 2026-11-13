# 🌟 Smart Habit Tracker - Ứng Dụng Rèn Luyện Thói Quen Thông Minh

Ứng dụng đa nền tảng (Web & Mobile) giúp người dùng xây dựng, duy trì thói quen tích cực, tính toán chuỗi ngày liên tiếp (Streak), theo dõi lượng nước uống, mở khóa huy hiệu và trò chuyện cùng **Trợ lý AI Gemini** (chuẩn Atomic Habits).

---

## 🚀 1. Hướng dẫn Dựng Cơ sở dữ liệu (MongoDB)

Ứng dụng sử dụng **MongoDB** làm cơ sở dữ liệu chính.

### Cách 1: Sử dụng MongoDB Cài đặt trên máy (Local)
1. Cài đặt MongoDB Community Server và MongoDB Compass (nếu chưa có).
2. Khởi động dịch vụ MongoDB:
   - Port mặc định: `27017`
   - Database name: `smart_habit_tracker`
   - Chuỗi kết nối mặc định: `mongodb://localhost:27017/smart_habit_tracker`
3. (Tùy chọn) Nạp dữ liệu mẫu ban đầu:
   ```bash
   mongosh mongodb://localhost:27017/smart_habit_tracker backend/database/smart-habit-db.js
   ```

### Cách 2: Chạy MongoDB bằng Docker
```bash
docker run -d --name smart-habit-mongo -p 27017:27017 -v mongo_habit_data:/data/db mongo:latest
```

---

## 🔑 2. Cách Đặt API Key Gemini (Bảo Mật)

Ứng dụng sử dụng Google Gemini AI để hỗ trợ gợi ý và trò chuyện cùng huấn luyện viên kỷ luật. **Tuyệt đối không commit API key lên Git**. Bạn có thể cài đặt theo 2 cách bảo mật sau:

### Cách 1: Sử dụng file cấu hình nội bộ `application-local.properties` (Khuyên dùng)
Tạo file `backend/application-local.properties` (file này đã nằm trong `.gitignore` nên an toàn tuyệt đối):
```properties
gemini.api.key=YOUR_GEMINI_API_KEY_HERE
```

### Cách 2: Đặt biến môi trường hệ thống
- **Trên Windows (PowerShell):**
  ```powershell
  $env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
  ```
- **Trên Linux / macOS:**
  ```bash
  export GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
  ```

---

## ⚙️ 3. Hướng dẫn Chạy Backend (Spring Boot)

### Yêu cầu:
- **Java JDK**: 21 trở lên
- **Gradle**: Đã tích hợp sẵn Gradle Wrapper (`./gradlew`)

### Các bước khởi chạy:
```bash
cd backend
./gradlew bootRun
```
*Trên Windows PowerShell nếu gặp chính sách thực thi:*
```powershell
.\gradlew.bat bootRun
```
Backend sẽ khởi chạy tại: `http://localhost:8080` (API base: `http://localhost:8080/api`).

---

## 📱 4. Hướng dẫn Chạy Frontend (React Native / Expo)

### Yêu cầu:
- **Node.js**: Phiên bản 18 trở lên
- **Expo CLI**

### Các bước khởi chạy:
```bash
cd frontend
npm install
npx expo start
```

### Các tùy chọn mở ứng dụng:
- Bấm phím **`w`**: Chạy trên trình duyệt Web (`http://localhost:8081`).
- Bấm phím **`a`**: Chạy trên máy ảo Android (nếu có Android Emulator).
- Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại (đảm bảo máy tính và điện thoại cùng kết nối 1 mạng Wi-Fi).

---

## 👤 5. Tài khoản Demo Dùng Thử

Bạn có thể đăng nhập ngay với tài khoản mẫu đã nạp sẵn dữ liệu:

| Tài khoản | Email | Mật khẩu | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Demo User** | `an.nguyen@example.com` | `password123` | Có sẵn thói quen, streak và lịch sử check-in |

*(Bạn cũng có thể bấm **Đăng ký** trên màn hình để tạo tài khoản mới độc lập).*

---

## 🏆 6. Các Tính Năng Nổi Bật

1. **Hôm nay (Home Screen)**: Vòng tròn tiến độ hoàn thành, phân nhóm buổi Sáng / Trưa / Chiều / Tối, chuông thông báo nhắc nhở, hiệu ứng pháo hoa khi đạt 100%.
2. **Quản lý Thói quen**: Tìm kiếm nhanh, lọc theo danh mục, quản lý chi tiết thói quen, tần suất linh hoạt (hằng ngày, theo thứ trong tuần).
3. **Lịch theo dõi (Calendar)**: Trực quan hóa tiến độ check-in theo tháng với hệ thống chấm màu trạng thái.
4. **Trợ lý AI Gemini (Atomic Habits)**: Trò chuyện tư vấn kế hoạch rèn luyện kỷ luật, chống bỏ cuộc, nút `+ Thêm thói quen` 1 chạm trực tiếp từ câu trả lời của AI.
5. **Hồ sơ Cá nhân & Theo dõi Uống Nước (Profile)**: 
   - Thẻ theo dõi 2L nước mỗi ngày kèm nút bấm nhanh +250ml, +500ml và chuỗi Thủy thần.
   - Thống kê 4 chỉ số vàng (Tổng thói quen, Số lần tick, Streak kỷ lục, Tỉ lệ duy trì).
   - Kho danh hiệu & huy hiệu thành tích mở khóa tự động.
6. **Ràng buộc Chuỗi Streak**: Áp dụng quy tắc ngọn lửa Streak 🔥 chỉ xuất hiện khi hoàn thành liên tục từ 3 ngày trở lên.
