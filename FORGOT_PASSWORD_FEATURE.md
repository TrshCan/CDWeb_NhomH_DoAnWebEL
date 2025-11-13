# Chức Năng Forgot Password - TDC SocialSphere

## Tổng Quan

Hệ thống đặt lại mật khẩu hoàn chỉnh cho ứng dụng TDC SocialSphere, bao gồm gửi email reset và validation mật khẩu mạnh.

## Cấu Trúc File

### Backend (Laravel + GraphQL)

```
be/
├── app/
│   ├── GraphQL/Resolvers/UserResolver.php     # GraphQL resolvers
│   ├── Services/UserServices.php              # Business logic
│   └── Repositories/UserRepository.php        # Data access
├── graphql/schema.graphql                     # GraphQL schema
├── resources/views/emails/
│   └── reset-password.blade.php              # Email template
├── config/app.php                            # Frontend URL config
└── EMAIL_SETUP.md                           # Email setup guide
```

### Frontend (React)

```
fe/src/
├── pages/
│   ├── ForgotPassword.jsx                    # Form yêu cầu reset
│   ├── ResetPassword.jsx                     # Form nhập password mới
│   └── Login.jsx                            # Updated with forgot link
└── App.jsx                                  # Routes configuration
```

## API Endpoints

### 1. Forgot Password Mutation

```graphql
mutation ForgotPassword($email: String!) {
  forgotPassword(email: $email)
}
```

**Input:**
- `email`: Email đã đăng ký trong hệ thống

**Output:**
- `String`: Thông báo thành công/lỗi

### 2. Reset Password Mutation

```graphql
mutation ResetPassword(
  $token: String!
  $email: String!
  $password: String!
  $passwordConfirmation: String!
) {
  resetPassword(
    token: $token
    email: $email
    password: $password
    passwordConfirmation: $passwordConfirmation
  )
}
```

**Input:**
- `token`: Token từ email reset
- `email`: Email của user
- `password`: Mật khẩu mới
- `passwordConfirmation`: Xác nhận mật khẩu

**Output:**
- `String`: Thông báo thành công/lỗi

## Quy Trình Hoạt Động

1. **User Request Reset**
   - Truy cập `/forgot-password`
   - Nhập email đã đăng ký
   - Hệ thống validate và gửi email

2. **Email Processing**
   - Backend tạo secure token
   - Gửi email với link reset
   - Token có thời hạn 60 phút

3. **Password Reset**
   - User click link trong email
   - Redirect đến `/reset-password?token=xxx&email=xxx`
   - Nhập mật khẩu mới với validation
   - Hệ thống cập nhật và redirect về login

## Validation Rules

### Email Validation
- Format email hợp lệ
- Email phải tồn tại trong hệ thống

### Password Validation
- Tối thiểu 8 ký tự
- Ít nhất 1 chữ hoa (A-Z)
- Ít nhất 1 chữ thường (a-z)
- Ít nhất 1 số (0-9)
- Ít nhất 1 ký tự đặc biệt (@$!%*?&)

### Token Validation
- Token phải hợp lệ và chưa expire
- Chỉ có thể sử dụng 1 lần
- Tự động xóa sau khi sử dụng

## Security Features

- **Token Expiration**: 60 phút
- **One-time Use**: Token bị xóa sau khi dùng
- **Database Transactions**: Đảm bảo data consistency
- **Password Hashing**: BCrypt với salt
- **Input Sanitization**: Trim và validate tất cả input
- **Error Handling**: Không tiết lộ thông tin nhạy cảm

## Email Configuration

### Production Setup (Gmail)

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="TDC SocialSphere"
FRONTEND_URL=https://your-domain.com
```

### Development Setup (Mailtrap)

```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
FRONTEND_URL=http://localhost:3000
```

## Routes

### Frontend Routes
- `/forgot-password` - Form yêu cầu reset
- `/reset-password` - Form đặt mật khẩu mới
- `/login` - Updated với link "Quên mật khẩu?"

### Backend Routes
- `/graphql` - GraphQL endpoint cho tất cả mutations
- `/graphiql` - GraphQL IDE (development only)

## Error Handling

### Frontend Errors
- Validation errors hiển thị specific message
- Network errors với user-friendly messages
- Loading states với spinner
- Success feedback với auto-redirect

### Backend Errors
- ValidationException cho lỗi validation
- Specific error messages bằng tiếng Việt
- Graceful handling cho email sending failures
- Transaction rollback khi có lỗi

## Dependencies

### Backend Required
- Laravel Framework
- Lighthouse GraphQL
- Laravel Password Reset functionality
- PHP Mailer

### Frontend Required
- React
- React Router
- Lucide React (icons)
- GraphQL client

## Installation & Setup

1. **Backend Setup**
```bash
cd be/
composer install
php artisan migrate
php artisan config:cache
```

2. **Email Configuration**
- Copy email settings vào `.env`
- Configure SMTP provider
- Set correct `FRONTEND_URL`

3. **Frontend Setup**
```bash
cd fe/
npm install
npm start
```

4. **Test Functionality**
- Ensure backend runs on correct port
- Test email sending
- Verify frontend routes work
- Test complete reset flow

## Database Schema

Password reset functionality sử dụng Laravel's built-in `password_reset_tokens` table:

```sql
CREATE TABLE password_reset_tokens (
  email VARCHAR(255) PRIMARY KEY,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT NULL
);
```

## Production Checklist

- [ ] Email SMTP configured và tested
- [ ] `FRONTEND_URL` set to production domain
- [ ] SSL certificates configured
- [ ] Rate limiting enabled for password reset requests
- [ ] Error logging configured
- [ ] Email templates reviewed và customized
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Database backups enabled

## Support & Maintenance

- Monitor email sending success rates
- Review password reset logs regularly
- Update email templates as needed
- Monitor for abuse của reset functionality
- Keep dependencies updated
- Regular security audits