# 📋 Hệ Thống Quản Lý Kanban Tích Hợp AI (Python Flask)

Dự án xây dựng ứng dụng quản lý công việc (Kanban Board) trực quan, được tích hợp trực tiếp Trợ lý trí tuệ nhân tạo (Google Gemini AI) để tự động hóa quy trình quản lý dự án. Phần giao diện (Frontend) được đóng gói dưới dạng ứng dụng trang đơn tĩnh, giao tiếp với máy chủ Python Flask (Backend) qua API.

## 🚀 Tính năng nổi bật
* **Quản lý Kéo/Thả trực quan:** Theo dõi vòng đời công việc qua các trạng thái (Cần làm, Đang làm, Đánh giá, Hoàn thành).
* **AI Tự động Phân loại:** Sử dụng Xử lý Ngôn ngữ Tự nhiên (NLP) để tự động nhận diện và gán Nhãn (Category) cùng Độ ưu tiên (Priority) cho công việc mới.
* **AI Phân tách Task:** Trợ lý ảo đóng vai trò Project Manager, tự động chia nhỏ một đầu việc phức tạp thành các checklist hành động chi tiết.
* **Trích xuất Báo cáo Tiến độ:** AI phân tích dữ liệu toàn bảng theo thời gian thực, phát hiện "nút thắt cổ chai" và đề xuất hướng xử lý.

## ⚙️ Hướng dẫn Cài đặt & Khởi chạy

**Bước 1: Cài đặt thư viện**
Đảm bảo máy tính đã được cài đặt Python. Mở Terminal tại thư mục gốc của dự án và chạy lệnh sau để nạp các gói phụ thuộc:
```bash
pip install -r requirements.txt
```

**Bước 2: Cấu hình Khóa API (Môi trường)**
Dự án yêu cầu khóa API của Google Gemini để kích hoạt các tính năng thông minh.
Mở file .env tại thư mục gốc.
Khai báo khóa API theo cú pháp sau:
GEMINI_API_KEY="điền_khóa_api_của_bạn_vào_đây"

**Bước 3: Khởi động Máy chủ**
Kích hoạt máy chủ Flask bằng lệnh:

```Bash
python app.py
```

**Bước 4: Sử dụng Ứng dụng**
Mở trình duyệt web và truy cập vào địa chỉ: http://localhost:3000

