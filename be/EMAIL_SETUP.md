# Hướng Dẫn Cấu Hình Email Cho Chức Năng Forgot Password

## 1. Cấu Hình Environment Variables

Thêm các biến môi trường sau vào file `.env`:

```env
# Frontend URL (để tạo reset link)
FRONTEND_URL=https://your-domain.com

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="TDC SocialSphere"
```

## 2. Sử Dụng Gmail SMTP

### Bước 1: Bật 2-Factor Authentication
1. Đi tới [Google Account Security](https://myaccount.google.com/security)
2. Bật "2-Step Verification"

### Bước 2: Tạo App Password
1. Trong Google Account Security, tìm "App passwords"
2. Chọn "Mail" và "Other (Custom name)"
3. Nhập "Laravel App" làm tên
4. Copy password được tạo và dán vào `MAIL_PASSWORD`

### Bước 3: Cập nhật .env
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-16-digit-app-password
MAIL_ENCRYPTION=tls
```

## 3. Sử Dụng Mailtrap (Development)

Để test trong development environment:

```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
```

1. Đăng ký tại [Mailtrap.io](https://mailtrap.io)
2. Tạo inbox mới
3. Copy thông tin SMTP từ Settings

## 4. Test Cấu Hình

### Kiểm tra bằng Artisan Tinker:

```bash
php artisan tinker
```

```php
// Test gửi email
Mail::raw('Test email', function ($message) {
    $message->to('test@example.com')->subject('Test');
});
```

### Kiểm tra logs:

```bash
tail -f storage/logs/laravel.log
```

## 5. Troubleshooting

### Lỗi thường gặp:

#### "Connection could not be established with host smtp.gmail.com"
- Kiểm tra internet connection
- Đảm bảo port 587 không bị block
- Thử đổi sang port 465 với SSL

#### "Invalid credentials"
- Đảm bảo đã bật 2FA cho Gmail
- Sử dụng App Password thay vì password thường
- Kiểm tra username/password trong .env

#### "Mail driver [xxx] not supported"
- Chạy `php artisan config:cache` để clear cache
- Kiểm tra `MAIL_MAILER` trong .env

## 7. Production Configuration

### Sử dụng SendGrid (Recommended)

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_ENCRYPTION=tls
```

### Sử dụng AWS SES

```env
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1
```

## 8. Security Notes

- ⚠️ **KHÔNG** commit file `.env` vào Git
- Sử dụng App Passwords thay vì password gốc
- Trong production, khuyến khích sử dụng queue để gửi email async

- Thiết lập rate limiting cho forgot password requests
- Log tất cả password reset attempts để security audit

## 9. Customization

### Thay đổi email template:
Edit file: `resources/views/emails/reset-password.blade.php`

### Thay đổi thời gian expired token:
Trong `config/auth.php`:
```php
'passwords' => [
    'users' => [
        'provider' => 'users',
        'table' => 'password_reset_tokens',
        'expire' => 60, // 60 phút
    ],
],
```

### Custom validation messages:
Trong `UserServices.php`, thay đổi các message trong ValidationException

---

**Lưu ý**: Sau khi thay đổi cấu hình email, luôn chạy:
```bash
php artisan config:cache
php artisan cache:clear
```
