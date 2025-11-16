<?php

namespace App\Services;

use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Database\QueryException;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Auth\Events\PasswordReset;
use Exception;
use Illuminate\Auth\Events\Registered;

class UserServices
{
    private UserRepository $userRepo;

    public function __construct(UserRepository $userRepo)
    {
        $this->userRepo = $userRepo;
    }
    public function getUserProfile(int $id): ?User
    {
        $user = $this->userRepo->findById($id);

        if (!$user) {
            throw new \Exception("Không tìm thấy người dùng với ID: {$id}");
        }

        return $user;
    }
    public function loginUser(string $email, string $password): array
    {
        $user = $this->userRepo->findByEmail($email);

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => 'Email không tồn tại.',
            ]);
        }

        if (!Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => 'Mật khẩu không đúng.',
            ]);
        }

        if (!$user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.',
            ]);
        }

        // Tạo token ngẫu nhiên và lưu vào remember_token
        // Kiểm tra tài khoản có bị banned không
        $bannedStatus = \App\Models\Status::where('name', 'banned')->first();
        if ($bannedStatus && $user->status_id == $bannedStatus->id) {
            $banReason = $user->ban_reason ?: 'Không có lý do cụ thể';
            throw ValidationException::withMessages([
                'email' => "Tài khoản của bạn đã bị cấm. Lý do: {$banReason}",
            ]);
        }

        // Tạo token ngẫu nhiên (ví dụ token tạm, chưa phải JWT)
        $token = Str::random(60);
        $user->remember_token = $token;
        $user->save();

        return [
            'token' => $token,
            'user' => $user,
        ];
    }
    public function registerUser(array $data)
    {
        return DB::transaction(function () use ($data) {
            try {
            /**
             * ==========================
             * 🧩 1️⃣ VALIDATION HỌ TÊN
             * ==========================
             */
            $name = trim($data['name'] ?? '');
            if ($name === '') {
                throw ValidationException::withMessages(['name' => 'Vui lòng không bỏ trống họ tên']);
            }
            if (strlen($name) < 10) {
                throw ValidationException::withMessages(['name' => 'Họ tên phải từ 10 kí tự trở lên']);
            }
            if (strlen($name) > 50) {
                throw ValidationException::withMessages(['name' => 'Họ tên không được quá 50 kí tự']);
            }
            if (preg_match('/[^a-zA-ZÀ-Ỹà-ỹ\s]/u', $name)) {
                throw ValidationException::withMessages(['name' => 'Vui lòng không dùng các kí tự đặc biệt!']);
            }

            /**
             * ==========================
             * 🧩 2️⃣ VALIDATION EMAIL
             * ==========================
             */
            $email = trim($data['email'] ?? '');
            if ($email === '') {
                throw ValidationException::withMessages(['email' => 'Vui lòng nhập email']);
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw ValidationException::withMessages(['email' => 'Email không hợp lệ']);
            }
            if ($this->userRepo->findByEmail($email)) {
                throw ValidationException::withMessages(['email' => 'Email đã được đăng ký']);
            }

            /**
             * ==========================
             * 🧩 3️⃣ VALIDATION MẬT KHẨU
             * ==========================
             */
            $password = $data['password'] ?? '';
            if ($password === '') {
                throw ValidationException::withMessages(['password' => 'Vui lòng nhập mật khẩu']);
            }
            if (strlen($password) < 8) {
                throw ValidationException::withMessages(['password' => 'Mật khẩu phải có ít nhất 8 ký tự']);
            }
            if (!preg_match('/[A-Z]/', $password)) {
                throw ValidationException::withMessages(['password' => 'Mật khẩu phải có ít nhất 1 chữ hoa']);
            }
            if (!preg_match('/[a-z]/', $password)) {
                throw ValidationException::withMessages(['password' => 'Mật khẩu phải có ít nhất 1 chữ thường']);
            }
            if (!preg_match('/[0-9]/', $password)) {
                throw ValidationException::withMessages(['password' => 'Mật khẩu phải có ít nhất 1 số']);
            }
            if (!preg_match('/[\W_]/', $password)) {
                throw ValidationException::withMessages(['password' => 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt']);
            }

            /**
             * ==========================
             * 🧩 4️⃣ VALIDATION PHONE
             * ==========================
             */
            $phone = trim($data['phone'] ?? '');
            if ($phone === '') {
                throw ValidationException::withMessages(['phone' => 'Vui lòng nhập số điện thoại']);
            }
            if (!preg_match('/^(0|\+84)([0-9]{9})$/', $phone)) {
                throw ValidationException::withMessages(['phone' => 'Số điện thoại không hợp lệ']);
            }
            if ($this->userRepo->findByPhone($phone)) {
                throw ValidationException::withMessages(['phone' => 'Số điện thoại đã được đăng ký']);
            }

            /**
             * ==========================
             * 🧩 5️⃣ VALIDATION ADDRESS
             * ==========================
             */
            $address = trim($data['address'] ?? '');
            if ($address === '') {
                throw ValidationException::withMessages(['address' => 'Vui lòng nhập địa chỉ']);
            }
            if (strlen($address) < 5) {
                throw ValidationException::withMessages(['address' => 'Địa chỉ phải dài hơn 5 ký tự']);
            }

                /**
                 * ==========================
                 * 🧩 6️⃣ LƯU VÀO DB
                 * ==========================
                 */
                $data['password'] = Hash::make($password);

                // Double-check for duplicates inside transaction
                if ($this->userRepo->findByEmail($email)) {
                    throw ValidationException::withMessages(['email' => 'Email đã được đăng ký']);
                }
                if ($this->userRepo->findByPhone($phone)) {
                    throw ValidationException::withMessages(['phone' => 'Số điện thoại đã được đăng ký']);
                }

                $user = $this->userRepo->registerUser($data);

                if (!$user) {
                    throw new Exception('Không thể tạo tài khoản, vui lòng thử lại.');
                }

                event(new Registered($user));

                $token = Str::random(60);

                return [
                    'token' => $token,
                    'user' => $user,
                ];
            }
            catch (ValidationException $e) {
                Log::warning('Lỗi xác thực khi đăng ký: ' . json_encode($e->errors()));
                throw $e; // GraphQL sẽ tự động trả lỗi này ra FE
            }
            catch (QueryException $e) {
                Log::error('Lỗi truy vấn CSDL khi đăng ký: ' . $e->getMessage());

                // Handle specific database constraint violations
                if (str_contains($e->getMessage(), 'users_email_unique')) {
                    throw ValidationException::withMessages(['email' => 'Email đã được đăng ký']);
                }
                if (str_contains($e->getMessage(), 'users_phone_unique')) {
                    throw ValidationException::withMessages(['phone' => 'Số điện thoại đã được đăng ký']);
                }

                throw new Exception('Lỗi cơ sở dữ liệu, vui lòng thử lại sau.');
            }
            catch (Exception $e) {
                Log::error('Lỗi hệ thống khi đăng ký: ' . $e->getMessage());
                throw new Exception('Đăng ký thất bại: ' . $e->getMessage());
            }
        });
    }

    /**
     * Send password reset link to user's email using Laravel's Password Broker
     * This follows industry standard password reset flow
     */
    public function forgotPassword(string $email): string
    {
        try {
            // Validate and sanitize email
            $email = trim($email);
            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw ValidationException::withMessages(['email' => 'Email không hợp lệ']);
            }

            // Check if user exists first
            $user = $this->userRepo->findByEmail($email);
            if (!$user) {
                throw ValidationException::withMessages(['email' => 'Email không tồn tại trong hệ thống']);
            }

            // Use Laravel's Password Broker to send reset link
            // This is the industry standard approach used by Laravel and most applications
            $status = PasswordBroker::sendResetLink(['email' => $email]);

            // Handle response from Password Broker
            if ($status === PasswordBroker::RESET_LINK_SENT) {
                return 'Chúng tôi đã gửi link đặt lại mật khẩu qua email của bạn.';
            }

            // Handle error cases
            if ($status === PasswordBroker::INVALID_USER) {
                throw ValidationException::withMessages(['email' => 'Email không tồn tại trong hệ thống']);
            }

            if ($status === PasswordBroker::RESET_THROTTLED) {
                throw ValidationException::withMessages(['email' => 'Vui lòng chờ trước khi yêu cầu lại']);
            }

            throw ValidationException::withMessages(['email' => 'Không thể gửi email. Vui lòng thử lại sau.']);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('Forgot password error: ' . $e->getMessage());
            throw new Exception('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
        }
    }

    /**
     * Reset user password using Laravel's Password Broker
     * This is the industry standard approach for password reset
     */
    public function resetPassword(array $data): string
    {
        try {
            // Validate inputs
            $email = trim($data['email'] ?? '');
            $password = $data['password'] ?? '';
            $passwordConfirmation = $data['passwordConfirmation'] ?? '';
            $token = trim($data['token'] ?? '');

            // Basic validation
            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw ValidationException::withMessages(['email' => 'Email không hợp lệ']);
            }

            if (empty($password)) {
                throw ValidationException::withMessages(['password' => 'Vui lòng nhập mật khẩu mới']);
            }

            if ($password !== $passwordConfirmation) {
                throw ValidationException::withMessages(['password_confirmation' => 'Xác nhận mật khẩu không trùng khớp']);
            }

            // Password strength validation
            if (strlen($password) < 8) {
                throw ValidationException::withMessages(['password' => 'Mật khẩu phải có ít nhất 8 ký tự']);
            }
            if (!preg_match('/[A-Z]/', $password)) {
                throw ValidationException::withMessages(['password' => 'Mật khẩu phải có ít nhất 1 chữ hoa']);
            }
            if (!preg_match('/[a-z]/', $password)) {
                throw ValidationException::withMessages(['password' => 'Mật khẩu phải có ít nhất 1 chữ thường']);
            }
            if (!preg_match('/[0-9]/', $password)) {
                throw ValidationException::withMessages(['password' => 'Mật khẩu phải có ít nhất 1 số']);
            }
            if (!preg_match('/[\W_]/', $password)) {
                throw ValidationException::withMessages(['password' => 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt']);
            }

            // Use Laravel's Password Broker to reset password
            // This is the industry standard and handles token validation, expiration, etc.
            $status = PasswordBroker::reset(
                [
                    'email' => $email,
                    'password' => $password,
                    'password_confirmation' => $passwordConfirmation,
                    'token' => $token,
                ],
                function ($user, $password) {
                    // Update user password
                    $user->forceFill([
                        'password' => Hash::make($password)
                    ])->save();

                    // Fire password reset event
                    event(new PasswordReset($user));
                }
            );

            // Handle response from Password Broker
            if ($status === PasswordBroker::PASSWORD_RESET) {
                return 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.';
            }

            // Handle error cases
            if ($status === PasswordBroker::INVALID_TOKEN) {
                throw ValidationException::withMessages(['token' => 'Token không hợp lệ hoặc đã hết hạn']);
            }

            if ($status === PasswordBroker::INVALID_USER) {
                throw ValidationException::withMessages(['email' => 'Email không tồn tại trong hệ thống']);
            }

            throw ValidationException::withMessages(['email' => 'Không thể đặt lại mật khẩu. Vui lòng thử lại.']);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('Reset password error: ' . $e->getMessage());
            throw new Exception('Không thể đặt lại mật khẩu. Vui lòng thử lại sau.');
        }
    }

    public function resendVerificationEmail(string $email): bool
    {
        $user = $this->userRepo->findByEmail($email);

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => 'Email không tồn tại trong hệ thống.',
            ]);
        }

        if ($user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => 'Email đã được xác thực trước đó.',
            ]);
        }

        $user->sendEmailVerificationNotification();

        return true;
    }
}
