# Smart Habit Tracker - Backend API

Hệ thống Backend cho dự án Smart Habit Tracker xây dựng bằng **Spring Boot 3.x / 4.x**, **MongoDB**, và **Spring Security + JWT**.

## 1. Yêu cầu & Cấu hình môi trường

- **Java JDK**: 21 trở lên
- **MongoDB**: Chạy trên `localhost:27017`, database `smart_habit_tracker`
- Cấu hình bí mật (JWT Secret, MongoDB URI, Gemini API Key) đặt trong `application-local.properties` ở thư mục `backend/` hoặc qua biến môi trường `GEMINI_API_KEY` (được `.gitignore` bảo vệ, không commit lên Git).

### Cấu hình Gemini API Key:
Thêm vào file `backend/application-local.properties`:
```properties
gemini.api.key=YOUR_GEMINI_API_KEY
```

### Khởi chạy Backend:
```bash
cd backend
./gradlew bootRun
```
Backend chạy mặc định tại cổng: `http://localhost:8080`

---

## 2. Quy tắc Chung & Xác thực (Authentication)

- Tất cả các endpoint nghiệp vụ đều bắt đầu với tiền tố `/api`.
- Xác thực: Sử dụng **Bearer Token** trong header HTTP:
  ```http
  Authorization: Bearer <your_jwt_token>
  ```
- **Phân tách dữ liệu người dùng (Isolation)**: `userId` được trích xuất trực tiếp từ token của người dùng đang đăng nhập. Mọi truy vấn đọc/ghi đều ràng buộc theo `userId`, người dùng này không thể xem hoặc chỉnh sửa dữ liệu của người dùng khác.
- **CORS**: Đã cấu hình hỗ trợ `http://localhost:8081` (Expo web/bundler), `http://localhost:3000`, `http://localhost:19006`, cũng như các kết nối từ thiết bị di động trong mạng LAN.

---

## 3. Danh sách Endpoint API

### 3.1. Authentication (`/api/auth`)
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/api/auth/register` | Không | Đăng ký tài khoản mới (`email`, `password`, `name`) |
| `POST` | `/api/auth/login` | Không | Đăng nhập lấy JWT token (`email`, `password`) |
| `GET` | `/api/auth/me` | Có | Lấy thông tin user hiện tại từ token |

### 3.2. Categories (`/api/categories`)
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/categories` | Có | Lấy danh sách danh mục (mặc định `userId=null` + của chính user) |
| `POST` | `/api/categories` | Có | Tạo danh mục tùy chỉnh mới cho user |
| `DELETE` | `/api/categories/{id}` | Có | Xóa danh mục tùy chỉnh của user |

### 3.3. Habits (`/api/habits`)
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/habits` | Có | Lấy danh sách thói quen (hỗ trợ query `?status=active` hoặc `?status=archived`) |
| `GET` | `/api/habits/{id}` | Có | Lấy chi tiết 1 thói quen theo ID |
| `POST` | `/api/habits` | Có | Tạo mới thói quen |
| `PUT` | `/api/habits/{id}` | Có | Cập nhật thói quen |
| `PATCH` | `/api/habits/{id}/archive` | Có | Lưu trữ (archive) thói quen |
| `PATCH` | `/api/habits/{id}/restore` | Có | Khôi phục thói quen về `active` |
| `DELETE` | `/api/habits/{id}` | Có | Xóa vĩnh viễn thói quen và toàn bộ logs liên quan |

### 3.4. Habit Logs (`/api/logs`)
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/logs` | Có | Lấy danh sách log (`?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` hoặc `?habitId=xxx`) |
| `POST` | `/api/logs/toggle` | Có | Check-in / Hủy check-in thói quen theo ngày (`habitId`, `date`, `value`, `notes`) |
| `DELETE` | `/api/logs` | Có | Bỏ check-in thói quen (`?habitId=xxx&date=YYYY-MM-DD`) |

### 3.5. Statistics (`/api/stats`)
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/stats` | Có | Lấy số liệu thống kê tổng hợp (chuỗi ngày hiện tại, chuỗi dài nhất, tỉ lệ tuần/tháng, tổng lần hoàn thành) |
| `GET` | `/api/stats/habit/{habitId}` | Có | Lấy thống kê chi tiết cho riêng 1 thói quen |

---

## 4. Hướng dẫn Test với Postman / cURL

### Bước 1: Đăng nhập lấy Token
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"an.nguyen@example.com\",\"password\":\"password123\"}"
```
Copy giá trị `token` từ response: `data.token`.

### Bước 2: Lấy danh sách thói quen
```bash
curl -X GET "http://localhost:8080/api/habits?status=active" \
  -H "Authorization: Bearer <TOKEN>"
```

### Bước 3: Tạo thói quen mới
```bash
curl -X POST http://localhost:8080/api/habits \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Chạy bộ buổi sáng",
    "description": "Chạy 2km quanh công viên",
    "icon": "run",
    "color": "#10B981",
    "frequency": "daily",
    "timeOfDay": "morning",
    "targetType": "boolean",
    "targetValue": 1,
    "targetUnit": "lần",
    "reminderEnabled": true,
    "reminderTime": "06:30"
  }'
```

### Bước 4: Check-in thói quen (Toggle Log)
```bash
curl -X POST http://localhost:8080/api/logs/toggle \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "habitId": "<HABIT_ID>",
    "date": "2026-11-13",
    "value": 1
  }'
```

### Bước 5: Xem thống kê tổng hợp
```bash
curl -X GET http://localhost:8080/api/stats \
  -H "Authorization: Bearer <TOKEN>"
```
