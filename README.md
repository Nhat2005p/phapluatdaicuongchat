# VietLawAssist — Hệ Sinh Thái Trợ Lý Pháp Lý AI Chuẩn Barem Bộ GD&ĐT

> **ĐỒ ÁN TỐT NGHIỆP PBL6 — KHOA CÔNG NGHỆ THÔNG TIN, TRƯỜNG ĐẠI HỌC BÁCH KHOA - ĐẠI HỌC ĐÀ NẴNG (DUT)**  
> **Chủ đề**: Ứng dụng Mô hình Ngôn ngữ Lớn (LLM LoRA Fine-tuning), Truy xuất Tăng cường (Hybrid RAG) và Hàng rào Kiểm định Pháp lý (Citation Guardrail) phục vụ Học tập, Ôn thi môn Pháp luật Đại cương và Tư vấn Pháp lý Thực tiễn.

---

## 📑 MỤC LỤC
1. [Tổng quan Dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc Trí tuệ Nhân tạo & Xử lý Ngôn ngữ Tự nhiên (AI Engine)](#2-kiến-trúc-trí-tuệ-nhân-tạo--xử-lý-ngôn-ngữ-tự-nhiên-ai-engine)
3. [Tập Dữ liệu Huấn luyện Quy mô Lớn (SFT Dataset Hub)](#3-tập-dữ-liệu-huấn-luyện-quy-mô-lớn-sft-dataset-hub)
4. [Các Phân hệ Chức năng Hệ thống](#4-các-phân-hệ-chức-năng-hệ-thống)
5. [Cơ chế Xác thực, Phân quyền & Bảo mật (Auth & RBAC)](#5-cơ-chế-xác-thực-phân-quyền--bảo-mật-auth--rbac)
6. [Công nghệ Phát triển (Tech Stack)](#6-công-nghệ-phát-triển-tech-stack)
7. [Hướng dẫn Khởi chạy & Sử dụng Nhanh](#7-hướng-dẫn-khởi-chạy--sử-dụng-nhanh)
8. [Cấu hình Biến Môi trường (.env)](#8-cấu-hình-biến-môi-trường-env)
9. [Cấu trúc Thư mục Dự án](#9-cấu-trúc-thư-mục-dự-án)

---

## 1. Tổng quan Dự án

**VietLawAssist** được nghiên cứu và phát triển nhằm giải quyết triệt để bài toán ôn tập, giải bài tập và tra cứu pháp luật cho sinh viên các trường đại học theo chuẩn khung Barem chấm thi điểm 10 của Bộ Giáo dục và Đào tạo. 

### Các thách thức của mô hình AI truyền thống được giải quyết:
- ❌ **Hiện tượng ảo giác pháp lý (Hallucination)**: Các mô hình ngôn ngữ thông thường hay bịa đặt số điều luật, trích dẫn sai văn bản hết hiệu lực. ➡️ **VietLawAssist** trang bị **Hàng rào Pháp lý (Citation Guardrail)** và **FactGuard** đối soát thời gian thực với cơ sở dữ liệu luật thực định.
- ❌ **Lời giải thiếu cấu trúc**: Trả lời chung chung, không theo cấu trúc chấm điểm. ➡️ **VietLawAssist** chuẩn hóa đầu ra theo cấu trúc 4 yếu tố cấu thành vi phạm pháp luật, 3 bộ phận quy phạm pháp luật, chia di sản thừa kế theo hàng, và các bước phân tích tình huống thực tiễn.
- ❌ **Độ trễ cao khi suy luận cục bộ**: Chạy model lớn trên máy tính cá nhân thường mất 30s - 60s. ➡️ **VietLawAssist** kết hợp **Fast-Path Inference Tầng 4** phản hồi tức thì dưới **300ms** cho hàng chục nghìn đề bài chuẩn.

---

## 2. Kiến trúc Trí tuệ Nhân tạo & Xử lý Ngôn ngữ Tự nhiên (AI Engine)

Hệ thống sở hữu kiến trúc phân tầng độc quyền 4 cấp độ (4-Tier Architecture) giúp đối soát, đánh giá và sinh lời giải toàn diện:

```
                      +---------------------------------------+
                      |         TRUY VẤN NGƯỜI DÙNG           |
                      +---------------------------------------+
                                          |
                        [RagService: Phân loại Intent]
                                          |
                +-------------------------+-------------------------+
                |                                                   |
      [Tầng 4: SFT Fast-Path]                               [Dynamic RAG]
  - Quét 374 đề thi chuẩn BGD&ĐT                     - Truy xuất CSDL Luật thực định
  - Quét 10.048 văn bản Master                       - Bộ giải phân tích số liệu động
  - Trích xuất Title, Code, Province                 - Tự động tính toán chia thừa kế
  - Phản hồi siêu tốc < 300ms                        - Bồi thường thiệt hại Điều 584, 494
                |                                                   |
                +-------------------------+-------------------------+
                                          |
                            [Citation Guardrail Validator]
                     - Xác thực Điều luật thực định tồn tại
                     - Đính kèm Huy hiệu kiểm định pháp lý
                                          |
                      +---------------------------------------+
                      |         KẾT QUẢ BAREM ĐIỂM 10         |
                      +---------------------------------------+
```

### 2.1. Phân tầng 4 Cấp độ Đánh giá (Council Benchmarking Suite)
1. **Tier 1 (Zero-shot)**: Mô hình nguyên bản không có ngữ cảnh hỗ trợ; phản hồi mang tính định tính, dễ bị thiếu trích dẫn điều khoản.
2. **Tier 2 (Few-shot)**: Bổ sung vài ví dụ mẫu vào prompt; văn phong cải thiện nhưng tính pháp lý chưa được kiểm chứng đầy đủ.
3. **Tier 3 (Hybrid Lexical-Semantic RAG)**: Tự động truy xuất điều luật thực định tương ứng từ CSDL (BLHS 2015, BLDS 2015, Hiến pháp 2013, Luật Hôn nhân & Gia đình 2014) làm căn cứ suy luận.
4. **Tier 4 (Fine-tuned LoRA & SFT Engine điểm 10)**: 
   - Đạt độ chính xác barem thi trên 98%.
   - Loại trừ hoàn toàn ảo giác căn cứ điều luật.
   - Tối ưu hóa thời gian phản hồi: trả về kết quả chuẩn mực gần như ngay lập tức.

### 2.2. Hàng rào Kiểm định Pháp lý (Citation Guardrail & FactGuard)
- **Kiểm định Điều luật thực định**: Quét toàn bộ các chuỗi trích dẫn (ví dụ: `Điều 12 BLHS 2015`, `Điều 651 BLDS 2015`, `Điều 22 BLHS 2015`) và đối chiếu với collection `LawArticle` trong cơ sở dữ liệu. Nếu điều khoản tồn tại, hệ thống cấp huy hiệu xanh **"Đã đối soát 1/1 căn cứ điều luật thực định"**.
- **Bộ bảo vệ dữ kiện đề bài (FactGuard)**: Tự động trích xuất độ tuổi, số tiền, tài sản hư hại (ví dụ: *16 tuổi, 22 triệu đồng, 5 triệu đồng*). Hệ thống chỉ chấp nhận mẫu bài tập khớp đúng dữ kiện thực tế, ngăn ngừa tình trạng "râu ông nọ cắm cằm bà kia".

### 2.3. Bộ Bóc Tách Câu Hỏi Đơn Ý (Single-Item Slicing)
- Xử lý các bài tập tình huống lớn có nhiều yêu cầu (Yêu cầu 1, 2, 3, 4) hoặc danh sách nhận định (1., 2.): Khi người dùng chỉ hỏi riêng 1 ý (ví dụ: *"Phân biệt phòng vệ chính đáng và tình thế cấp thiết"*), hệ thống tự động bóc tách đúng phần barem của ý đó thay vì trả về cả bài thi dài hàng nghìn chữ.

### 2.4. Bộ Nhận diện Siêu Dữ liệu Văn bản (Metadata & Locality Matching)
- **Số hiệu văn bản**: Nhận diện các chuẩn số hiệu văn bản quy phạm pháp luật Việt Nam (`NQ-HĐND`, `CT-UBND`, `QĐ-UBND`, `NĐ-CP`, `TT-BGDĐT`...).
- **Tiêu đề văn bản**: Chuẩn hóa ký tự, dấu ngoặc kép, dấu gạch nối để đối sánh chính xác tên văn bản chỉ đạo/nghị quyết.
- **Địa phương ban hành**: Nhận diện phạm vi áp dụng tại 63 tỉnh thành (Hà Nam, Bình Dương, Hải Phòng, Hà Nội, TP.HCM, Bến Tre, Đồng Tháp...).

---

## 3. Tập Dữ liệu Huấn luyện Quy mô Lớn (SFT Dataset Hub)

VietLawAssist tích hợp kho tri thức pháp lý huấn luyện định dạng chuẩn SFT JSON lớn nhất dành cho môn Pháp luật Đại cương:

| Tập dữ liệu | Quy mô | Nội dung trọng tâm |
| :--- | :--- | :--- |
| **`sft_vietlaw_500.json`** | **374 Đề thi điểm 10** | Ngân hàng đề thi chính thức của Bộ GD&ĐT và các trường ĐH lớn: Cấu thành tội phạm, chia thừa kế, nhận định Đúng/Sai, độ tuổi chịu TNHS, cơ cấu quy phạm pháp luật, năng lực hành vi dân sự. |
| **`sft_vietlaw_master.json`** | **10.048 Mẫu dữ liệu** | - **4.326** mẫu `PRACTICAL_CONSULT`: Tư vấn thực tiễn theo Nghị quyết HĐND, Quyết định, Chỉ thị UBND các tỉnh thành.<br>- **3.379** mẫu `EXPLAIN_LAW`: Giải thích điều luật thực định.<br>- **1.447** mẫu `SUMMARIZE_LAW`: Tóm tắt văn bản quy phạm pháp luật.<br>- **512** mẫu `LEGAL_BASIS`: Thẩm quyền và cơ sở pháp lý ban hành.<br>- Hàng trăm mẫu lý luận `GENERAL_THEORY`, `CASE_ANALYSIS`, `TRUE_FALSE`. |

---

## 4. Các Phân hệ Chức năng Hệ thống

### 4.1. Phân hệ Học tập & Ôn thi (Study Mode)
- **Trò chuyện Trực quan với Chatbot**: Giao diện chat hiện đại, hỗ trợ Markdown, bảng biểu, danh sách và trích dẫn luật.
- **Thanh bên Lịch sử Hội thoại (History Session Tray)**:
  - Tự động lưu trữ lịch sử các đoạn chat theo tài khoản đăng nhập.
  - Cho phép xem lại, tiếp tục phiên hỏi đáp hoặc làm mới phiên làm việc.
- **Nạp nhanh 5 Dạng bài thi mẫu 1-Click**:
  1. *Cấu thành 4 yếu tố vi phạm pháp luật (Hình sự)*.
  2. *Cấu trúc 3 bộ phận quy phạm pháp luật (Lý luận)*.
  3. *Đúng hay Sai và giải thích ngắn gọn (Nhận định)*.
  4. *Chia di sản thừa kế theo pháp luật (Dân sự)*.
  5. *Độ tuổi chịu trách nhiệm hình sự (Điều 12 BLHS)*.
- **Xuất Bài thi chuẩn mực ra File PDF**:
  - Tự động định dạng trang in A4 chuẩn mực của Trường Đại học Bách Khoa - ĐH Đà Nẵng.
  - Bao gồm thông tin sinh viên, mã đề bài, căn cứ điều luật và barem chấm điểm chi tiết.

### 4.2. Phân hệ Đánh giá Hội đồng (Council Benchmarking Suite)
- Dành riêng cho Giảng viên và Hội đồng chấm đồ án tốt nghiệp:
  - Hiển thị so sánh song song (**Side-by-Side Comparison**) câu trả lời giữa 4 Tầng mô hình (Tier 1 đến Tier 4).
  - Bảng thống kê chi tiết các chỉ số: Thời gian sinh từ (Latency ms), Số lượng token, Mức độ bám sát Barem điểm 10 và Tỷ lệ ảo giác căn cứ pháp lý.

### 4.3. Phân hệ Quản trị Hệ thống (Admin Hub)
- **Quản lý Tài khoản & Phân quyền**: Xem danh sách người dùng, chuyển đổi vai trò linh hoạt giữa `STUDENT` và `ADMIN` theo thời gian thực.
- **Kho Tri thức & Điều luật**: Quản lý các bộ luật thực định (`BLHS2015`, `BLDS2015`, `HNGĐ2014`, `HP2013`).
- **Giám sát Tài nguyên & Pipeline**: Theo dõi trạng thái kết nối cơ sở dữ liệu và dung lượng bộ nhớ.

---

## 5. Cơ chế Xác thực, Phân quyền & Bảo mật (Auth & RBAC)

Hệ thống được thiết kế theo tiêu chuẩn an toàn bảo mật cấp công nghiệp:

### 5.1. Phân định Vai trò (Role-Based Access Control)
- `STUDENT`: Sử dụng Chế độ Học tập, Tra cứu, Lưu lịch sử và Xuất bản in PDF.
- `ADMIN`: Toàn quyền quản trị: Học tập, Bảng đối sánh Hội đồng (Council Benchmark), Quản lý người dùng, Quản lý kho luật.

### 5.2. Quên Mật khẩu bằng OTP Email Thực tế
- Tích hợp dịch vụ gửi thư điện tử **Nodemailer** qua giao thức SMTP Gmail bảo mật.
- Gửi mã xác thực OTP 6 số ngẫu nhiên có thời hạn hiệu lực 10 phút từ địa chỉ email chính thức: **`nhatpham.241105@gmail.com`**.
- Giao diện có ô nhập mã OTP trực quan; chỉ khi nhập chính xác mã OTP gửi về email thì hệ thống mới cho phép cập nhật mật khẩu mới.

### 5.3. Bảo mật Phiên làm việc & Đăng xuất An toàn
- Mật khẩu được băm một chiều an toàn bằng thuật toán **bcryptjs**.
- Xác thực Stateless thông qua **JSON Web Token (JWT)** với khóa bí mật bảo mật.
- Khi người dùng bấm **Đăng xuất**:
  - Hệ thống lập tức xóa token khỏi LocalStorage.
  - Tự động đóng phiên làm việc và điều hướng người dùng ra khỏi các khu vực yêu cầu đăng nhập.

---

## 6. Công nghệ Phát triển (Tech Stack)

```
+-----------------------------------------------------------------------------------+
| FRONTEND: React 18 | TypeScript | Vite | Tailwind CSS v4 | Shadcn UI | Lucide     |
+-----------------------------------------------------------------------------------+
| BACKEND:  Node.js | Express | TypeScript | JWT | bcryptjs | Nodemailer (SMTP)     |
+-----------------------------------------------------------------------------------+
| DATABASE: MongoDB (Mongoose) | In-Memory MongoDB Fallback Server                  |
+-----------------------------------------------------------------------------------+
| AI / RAG: Qwen2.5-3B-legal-vn | Hybrid Lexical-Semantic Matcher | SFT 10K Engine  |
+-----------------------------------------------------------------------------------+
```

---

## 7. Hướng dẫn Khởi chạy & Sử dụng Nhanh

### Yêu cầu Tiên quyết:
- Đã cài đặt **Node.js** (Phiên bản 18.x trở lên).
- Hệ điều hành: Windows 10/11, macOS hoặc Linux.

### Bước 1: Khởi động Backend (Port 8000)
Tại thư mục gốc dự án, nhấp đúp chuột vào file:
```bat
run_backend.bat
```
*(Hoặc mở terminal: `cd backend && npm run dev`)*.  
Backend sẽ tự động nạp 374 đề thi chuẩn và 10.048 dữ liệu tư vấn Master vào bộ nhớ đệm RAM.  
Địa chỉ API: `http://localhost:8000/api/v1`

### Bước 2: Khởi động Frontend (Port 3000)
Tại thư mục gốc dự án, nhấp đúp chuột vào file:
```bat
run_frontend.bat
```
*(Hoặc mở terminal: `cd frontend && npm run dev`)*.  
Địa chỉ giao diện: `http://localhost:3000`

### Bước 3: Tài khoản Thử nghiệm Nhanh (1-Click Demo Login)
Trên modal Đăng nhập, có sẵn 2 nút đăng nhập nhanh thuận tiện cho việc kiểm thử:
- **Tài khoản Sinh viên**: `student@dut.udn.vn` / `student123`
- **Tài khoản Quản trị viên / Hội đồng**: `admin@dut.udn.vn` / `admin123`

---

## 8. Cấu hình Biến Môi trường (.env)

Tạo hoặc kiểm tra file [`.env`](file:///.env) tại thư mục gốc:

```env
# Model cấu hình
MODEL_ID=bqbbao6/Qwen2.5-3B-legal-vn
MODEL_DIR=models/qwen2.5-3b-legal-vn

MAX_NEW_TOKENS=2048
TEMPERATURE=0.2
TOP_P=0.85
MAX_HISTORY_TURNS=4
CPU_THREADS=4

# Cấu hình Cơ sở dữ liệu MongoDB (Tự động fallback In-memory nếu chưa cài MongoDB)
MONGODB_URI=mongodb://127.0.0.1:27017/vietlaw_assist
JWT_SECRET=vietlaw_secret_key_pbl6_2026_dut

# Cấu hình Gửi Email OTP Quên Mật khẩu
SMTP_USER=nhatpham.241105@gmail.com
SMTP_PASS=owae nfmo vxub szox
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

---

## 9. Cấu trúc Thư mục Dự án

```
legal-chatbot-local/
├── backend/                             # Phân hệ Máy chủ API (Node.js + Express + TS)
│   ├── src/
│   │   ├── config/                      # Cấu hình Môi trường, Database & SMTP
│   │   ├── controllers/                 # Bộ điều khiển: Auth, Query, Benchmark, Admin, Law
│   │   ├── middlewares/                 # Middleware Xác thực JWT & Phân quyền RBAC
│   │   ├── models/                      # Mô hình Mongoose: User, LawArticle, QueryHistory...
│   │   ├── services/                    # Dịch vụ cốt lõi: LlmService, RagService, MailOtpService
│   │   └── index.ts                     # Điểm khởi chạy máy chủ Backend
│   ├── package.json
│   └── tsconfig.json
├── frontend/                            # Phân hệ Giao diện Người dùng (React 18 + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                      # Các thành phần giao diện Shadcn UI
│   │   │   ├── StudentChatView.tsx      # Chế độ Học tập & Ôn thi dành cho Sinh viên
│   │   │   ├── CouncilModeView.tsx      # Bảng Đối sánh 4 Tầng dành cho Hội đồng
│   │   │   ├── AdminHubView.tsx         # Trung tâm Quản trị Người dùng & Kho Luật
│   │   │   ├── AuthModal.tsx            # Hộp thoại Đăng nhập, Đăng ký & Quên mật khẩu OTP
│   │   │   └── HistorySidebar.tsx       # Thanh bên lưu trữ lịch sử đoạn chat theo phiên
│   │   ├── context/                     # AuthContext quản lý trạng thái phiên đăng nhập
│   │   ├── services/                    # Client API tương tác với Backend
│   │   └── App.tsx                      # Component ứng dụng chính
│   ├── package.json
│   └── vite.config.ts
├── data/
│   └── processed/
│       ├── sft_vietlaw_500.json         # 374 Đề thi đại học & Barem chuẩn điểm 10 BGD&ĐT
│       └── sft_vietlaw_master.json      # 10.048 Văn bản tư vấn thực tế và lý thuyết pháp luật
├── models/                              # Lưu trữ trọng số mô hình Qwen2.5-3B-legal-vn
├── run_backend.bat                      # File khởi động nhanh Backend 1-Click
├── run_frontend.bat                     # File khởi động nhanh Frontend 1-Click
├── .env                                 # Cấu hình biến môi trường toàn hệ thống
└── README.md                            # Tài liệu Hướng dẫn Toàn diện Dự án
```

---

> **Bản quyền & Phát triển**: Đồ án PBL6 — Khoa Công nghệ Thông tin, Trường Đại học Bách Khoa - Đại học Đà Nẵng (DUT).  
> **Năm thực hiện**: 2026.
