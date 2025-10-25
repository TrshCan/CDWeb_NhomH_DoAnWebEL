💻 Hướng dẫn chạy project Laravel + React + Docker (cho người khác)
🪜 1. Clone project về
git clone https://github.com/<username>/<repo-name>.git
cd <repo-name>
⚙️ 2. Kiểm tra cấu trúc project

Đảm bảo trong thư mục có các file/folder quan trọng:

/be
  ├── Dockerfile
  ├── composer.json
  ├── .env.example
/fe
  ├── package.json
  Dockerfile
docker-compose.yml

🧩 3. Tạo file môi trường .env

Vào thư mục backend:
cd be
cp .env.example .env (không thì vào vscode copy file .env.example ra và để lại .env lưu lại)
file env 
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=projectdb
DB_USERNAME=user
DB_PASSWORD=password

🐳 4. Chạy Docker

Quay lại thư mục gốc (chứa docker-compose.yml) và chạy:
docker-compose up --build -d

Docker sẽ:
Chạy MySQL (db)
Build Laravel backend (project-be)
Build React frontend (project-fe)

🧰 5. Cài đặt Laravel dependencies (nếu chưa có vendor/)

Sau khi container backend chạy:

docker exec -it project-be bash
composer install
php artisan key:generate
php artisan migrate
**Nếu bạn có sẵn vendor/ rồi thì bước này có thể bỏ qua.**

🌐 6. Truy cập ứng dụng

Backend (Laravel GraphQL):
http://localhost:8000/graphql --> muốn test api với GraphQL thì dùng extension https://chromewebstore.google.com/detail/graphiql-extension/jhbedfdjpmemmbghfecnaeeiokonjclb
dán url http://localhost:8000/graphql vào thanh trắng sau đó gõ {hello} bấm run ra json
{
  "data": {
    "hello": "Hello from GraphiQL!"
  }
}
**vậy là kết nối thành công**
Frontend (React):
http://localhost:3000
PhpMyAdmin:
http://localhost:8080
user:root
pass:rootpassword

🧾 7. Pull code mới (khi bạn update GitHub)
Người khác chỉ cần chạy:
git pull origin develop
hoặc branch mà bạn đang làm việc.
