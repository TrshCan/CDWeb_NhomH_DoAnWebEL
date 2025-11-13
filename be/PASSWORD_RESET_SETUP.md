# Hướng dẫn cấu hình tính năng Quên mật khẩu

## Cấu hình Email

Để tính năng quên mật khẩu hoạt động, bạn cần cấu hình email trong file `.env` của Laravel.

### 1. Cấu hình SMTP (Gmail)

Thêm các dòng sau vào file `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="TDC SocialSphere"

# URL frontend để tạo link reset password
FRONTEND_URL=http://localhost:5173
```

**Lưu ý cho Gmail:**
- Bạn cần tạo "App Password" thay vì sử dụng mật khẩu thông thường
- Vào Google Account → Security → 2-Step Verification → App passwords
- Tạo app password mới và sử dụng nó cho `MAIL_PASSWORD`

### 2. Cấu hình SMTP khác (Outlook, Yahoo, etc.)

#### Outlook/Hotmail:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
```

#### Yahoo:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mail.yahoo.com
MAIL_PORT=587
MAIL_USERNAME=your-email@yahoo.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
```

### 3. Cấu hình Mailtrap (cho testing)

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
```

### 4. Kiểm tra cấu hình

Sau khi cấu hình, bạn có thể test bằng cách:

1. Chạy lệnh:
```bash
php artisan tinker
```

2. Trong tinker, chạy:
```php
Mail::raw('Test email', function ($message) {
    $message->to('your-test-email@example.com')
            ->subject('Test Email');
});
```

## Cấu hình Frontend URL

Đảm bảo `FRONTEND_URL` trong file `.env` trỏ đúng đến URL frontend của bạn:

- Development: `http://localhost:5173`
- Production: `https://yourdomain.com`

## Luồng hoạt động

1. Người dùng nhập email trên trang `/forgot-password`
2. Hệ thống tạo token và lưu vào bảng `password_reset_tokens`
3. Email chứa link reset được gửi đến người dùng
4. Người dùng click link và được chuyển đến `/reset-password?token=...&email=...`
5. Người dùng nhập mật khẩu mới
6. Hệ thống kiểm tra token và cập nhật mật khẩu
7. Token được xóa sau khi sử dụng

## Bảo mật

- Token có thời hạn 24 giờ
- Token chỉ sử dụng được 1 lần
- Token được hash trước khi lưu vào database
- Validation đầy đủ cho email và mật khẩu

