# 🚀 Hướng dẫn chạy Project Laravel + React + Docker

## 📋 **Tổng quan**
Project fullstack sử dụng:
- **Backend**: Laravel + GraphQL
- **Frontend**: React
- **Database**: MySQL
- **Container**: Docker & Docker Compose

---

## 🛠 **Yêu cầu hệ thống**
- Docker & Docker Compose
- Git
- IDE (VSCode khuyến nghị)

---

## 🚀 **Hướng dẫn cài đặt**

### **1. Clone project**
```bash
git clone https://github.com/<username>/<repo-name>.git
cd <repo-name>
```

### **2. Kiểm tra cấu trúc project**
```
📁 /be              # Backend Laravel
   ├── Dockerfile
   ├── composer.json
   └── .env.example
   
📁 /fe              # Frontend React
   ├── package.json
   └── Dockerfile
   
📄 docker-compose.yml
```

### **3. Tạo file môi trường `.env`**
```bash
cd be
cp .env.example .env
```

**Chỉnh sửa file `.env` (backend)**:
```env
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=projectdb
DB_USERNAME=user
DB_PASSWORD=password
```

### **4. Khởi chạy Docker**
```bash
# Quay lại thư mục gốc
cd ..

# Build và chạy containers
docker-compose up --build -d
```

**Docker sẽ tự động chạy:**
- 🗄️ **MySQL** (`db`)
- ⚙️ **Laravel Backend** (`project-be`)
- 🌐 **React Frontend** (`project-fe`)

⏳ **Thời gian build lần đầu: ~5-10 phút**

---

## 🔧 **Cấu hình Laravel (chỉ lần đầu)**

```bash
# Vào container backend
docker exec -it project-be bash

# Cài dependencies
composer install

# Tạo application key
php artisan key:generate

# Chạy migration
php artisan migrate

# Thoát container
exit
```

---

## 🌐 **Truy cập ứng dụng**

| **Service** | **URL** | **Credentials** |
|-------------|---------|-----------------|
| **Frontend (React)** | [http://localhost:3000](http://localhost:3000) | - |
| **Backend GraphQL** | [http://localhost:8000/graphql](http://localhost:8000/graphql) | - |
| **phpMyAdmin** | [http://localhost:8080](http://localhost:8080) | **user**: `root`<br>**pass**: `rootpassword` |

### **🧪 Test GraphQL API**
1. Cài extension **GraphiQL** trên Chrome
2. Mở [http://localhost:8000/graphql](http://localhost:8000/graphql)
3. Gõ query:
```graphql
{ hello }
```
4. ✅ **Kết quả thành công**:
```json
{
  "data": {
    "hello": "Hello from GraphiQL!"
  }
}
```

---

## 🔄 **Cập nhật code từ GitHub**

```bash
# Pull code mới
git pull origin develop

# Rebuild containers (nếu có thay đổi Dockerfile)
docker-compose up --build -d

# Restart services
docker-compose restart
```

---

## 🐛 **Troubleshooting**

| **Vấn đề** | **Giải pháp** |
|------------|---------------|
| **Container không start** | `docker-compose down`<br>`docker system prune -f`<br>`docker-compose up --build -d` |
| **Permission denied** | `sudo chown -R $USER:$USER .` |
| **Database connection failed** | Kiểm tra `.env` và `docker logs project-be` |
| **Frontend không load** | `docker-compose restart project-fe` |

### **Xem logs containers**
```bash
# Xem tất cả logs
docker-compose logs -f

# Xem logs service cụ thể
docker-compose logs -f project-be
docker-compose logs -f project-fe
```

---

## 🛑 **Dừng project**
```bash
docker-compose down
```

## 🧹 **Dọn dẹp hoàn toàn**
```bash
docker-compose down -v --remove-orphans
docker system prune -a -f
```

---

## 📞 **Liên hệ hỗ trợ**
- 👨‍💻 **Developer**: [@TrshCan](https://github.com/TrshCan)


---

**⭐ Nhớ **Star** project nếu hữu ích!**
