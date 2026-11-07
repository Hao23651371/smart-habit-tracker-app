# Smart Habit Tracker - Mobile App (Frontend)

Ứng dụng theo dõi thói quen thông minh xây dựng bằng **React Native (Expo SDK 58)**, **TamaGUI**, **TypeScript**, **Expo Router**, **Redux Toolkit** và **TanStack Query**.

---

## 🚀 Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Cài đặt thư viện dependencies:
```bash
cd frontend
npm install
```

### 2. Chạy ứng dụng trên Trình duyệt Web (Ưu tiên kiểm tra):
```bash
npm run web
```
Trình duyệt sẽ tự động mở tại địa chỉ: `http://localhost:8081`

### 3. Chạy trên Thiết bị Thật / Giả lập (Expo Go):
```bash
npx expo start
```
* Bấm phím `a` để mở trên Android Emulator.
* Quét mã QR bằng ứng dụng Expo Go trên điện thoại thật.

---

## ⚙️ Cấu hình Mock Data & Backend API

Mọi cấu hình hệ thống nằm trong file: `src/config.ts`

```typescript
// Bật/tắt chế độ Mock Data
export const USE_MOCK = true; // true: dùng Mock Data; false: gọi API Backend thật

// Địa chỉ endpoint Backend Spring Boot
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';
```

* **Chế độ Mock (mặc định):** Sử dụng toàn bộ dữ liệu mẫu trong `src/mock/` với tài khoản test:
  * **Email:** `an@email.com`
  * **Mật khẩu:** `123456`
  * **Tên:** Nguyễn Minh An
  * *(Có nút chip "Điền tài khoản test" ở màn hình Đăng nhập để tự động điền nhanh 1 chạm)*
* **Chế độ Live API:** Đổi `USE_MOCK = false` để ứng dụng kết nối trực tiếp đến Spring Boot Backend (chạy ở port 8080).

---

## 📱 Cấu trúc Điều hướng & Màn hình

* **Nhóm Xác thực `(auth)`:**
  * `login.tsx`: Đăng nhập, Quên mật khẩu (BottomSheet), link Đăng ký.
  * `register.tsx`: Đăng ký tài khoản mới.
* **5 Tab chính `(tabs)`:**
  * `index.tsx` (Hôm nay): Lời chào theo giờ, Streak, Thẻ tiến độ hôm nay, Filter Sáng/Chiều/Tối, Danh sách HabitCard check/uncheck động.
  * `habits.tsx` (Thói quen): Tìm kiếm, Filter danh mục, Tab Đang theo dõi / Đã lưu trữ, dải tiến độ 7 ngày.
  * `calendar.tsx` (Lịch & Thống kê): Lưới lịch tháng màu ô, 3 StatCard, chi tiết ngày; tab Thống kê có biểu đồ cột tiến độ tuần và nhận xét AI.
  * `ai.tsx` (Trợ lý AI): Khung chat AI kèm chip gợi ý nhanh và 3-4 thẻ gợi ý thói quen (có kế hoạch 7 ngày).
  * `profile.tsx` (Cá nhân): Avatar, thống kê tổng, huy hiệu gần nhất, mục tiêu, menu Cài đặt & Đăng xuất.
* **Màn phụ:**
  * `habit/[id].tsx`: Chi tiết thói quen, lịch sử check-in, nút Sửa/Lưu trữ/Xoá.
  * `habit/form.tsx`: Form Thêm/Sửa thói quen (tự động nhận dữ liệu điền sẵn khi bấm từ AI gợi ý).
  * `achievements.tsx`: Bảng thành tích đầy đủ 11 huy hiệu chia 4 nhóm.
  * `settings.tsx`: Bật tắt thông báo, giờ nhắc mặc định, chế độ tối, đổi ngôn ngữ, đổi mật khẩu.

---

## 🎨 Responsive Design
* **Chế độ Mobile (width < 768px):** Tab bar nằm ở đáy màn hình, nội dung căn giữa với `maxWidth: 480px`.
* **Chế độ Màn hình Rộng (width >= 768px):** Tự động chuyển đổi thành thanh **Navigation Rail bên trái**, bố cục 2 cột (Home: streak + danh sách; Habits: master-detail; Calendar: lịch + chi tiết ngày), nội dung giới hạn `maxWidth: 1100px`.
