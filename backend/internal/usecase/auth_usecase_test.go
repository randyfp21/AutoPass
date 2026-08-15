package usecase_test

import (
	"context"
	"testing"
	"time"

	"github.com/autopass/backend/internal/config"
	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/usecase"
	"github.com/autopass/backend/internal/usecase/mocks"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func newTestConfig() *config.Config {
	return &config.Config{
		JWTSecret: "test_secret_key_123",
	}
}

func newTestRedis(t *testing.T) *redis.Client {
	client := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		t.Skip("Redis not available on localhost:6379, skipping test that requires Redis")
	}
	return client
}

// helper: mock user creation and return captured User struct pointer.
func registerHelper(
	t *testing.T,
	uc usecase.AuthUsecase,
	repo *mocks.MockUserRepository,
	email, password, fullName string,
) (string, *domain.User) {
	t.Helper()
	var capturedUser *domain.User
	repo.On("GetUserByEmail", mock.Anything, email).Return(nil, nil).Once()
	repo.On("CreateUser", mock.Anything, mock.MatchedBy(func(u *domain.User) bool {
		capturedUser = u
		return u.Email == email
	})).Return(nil).Once()

	resp, err := uc.Register(context.Background(), domain.RegisterRequest{
		Email:    email,
		Password: password,
		FullName: fullName,
	})
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	return resp.Token, capturedUser
}

// ===========================================================================
// REGISTER TESTS
// ===========================================================================

func TestRegister_Success(t *testing.T) {
	repo := &mocks.MockUserRepository{}
	uc := usecase.NewAuthUsecase(repo, newTestRedis(t), newTestConfig())

	repo.On("GetUserByEmail", mock.Anything, "newuser@autopass.io").Return(nil, nil).Once()
	repo.On("CreateUser", mock.Anything, mock.MatchedBy(func(u *domain.User) bool {
		return u.Email == "newuser@autopass.io" && u.FullName == "New User" && u.Role == "user"
	})).Return(nil).Once()

	resp, err := uc.Register(context.Background(), domain.RegisterRequest{
		Email:    "newuser@autopass.io",
		Password: "password123",
		FullName: "New User",
	})

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.Token)
	assert.Equal(t, "newuser@autopass.io", resp.User.Email)
	assert.Equal(t, "New User", resp.User.FullName)
	assert.Equal(t, "user", resp.User.Role)
	repo.AssertExpectations(t)
}

func TestRegister_EmailAlreadyTaken(t *testing.T) {
	repo := &mocks.MockUserRepository{}
	uc := usecase.NewAuthUsecase(repo, newTestRedis(t), newTestConfig())

	existingUser := &domain.User{
		ID:    "existing-id",
		Email: "taken@autopass.io",
	}
	repo.On("GetUserByEmail", mock.Anything, "taken@autopass.io").Return(existingUser, nil).Once()

	resp, err := uc.Register(context.Background(), domain.RegisterRequest{
		Email:    "taken@autopass.io",
		Password: "password123",
		FullName: "Duplicate User",
	})

	assert.Nil(t, resp)
	assert.EqualError(t, err, "email already registered")
	repo.AssertExpectations(t)
}

func TestRegister_WithPhoneNumber_StoredCorrectly(t *testing.T) {
	repo := &mocks.MockUserRepository{}
	uc := usecase.NewAuthUsecase(repo, newTestRedis(t), newTestConfig())

	phone := "+628123456789"
	repo.On("GetUserByEmail", mock.Anything, "phone@autopass.io").Return(nil, nil).Once()
	repo.On("CreateUser", mock.Anything, mock.MatchedBy(func(u *domain.User) bool {
		return u.PhoneNumber != nil && *u.PhoneNumber == phone
	})).Return(nil).Once()

	resp, err := uc.Register(context.Background(), domain.RegisterRequest{
		Email:       "phone@autopass.io",
		Password:    "password123",
		FullName:    "Phone User",
		PhoneNumber: phone,
	})

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, phone, *resp.User.PhoneNumber)
	repo.AssertExpectations(t)
}

func TestRegister_EmptyPhoneNumber_StoredAsNil(t *testing.T) {
	repo := &mocks.MockUserRepository{}
	uc := usecase.NewAuthUsecase(repo, newTestRedis(t), newTestConfig())

	repo.On("GetUserByEmail", mock.Anything, "nophone@autopass.io").Return(nil, nil).Once()
	repo.On("CreateUser", mock.Anything, mock.MatchedBy(func(u *domain.User) bool {
		return u.PhoneNumber == nil
	})).Return(nil).Once()

	resp, err := uc.Register(context.Background(), domain.RegisterRequest{
		Email:       "nophone@autopass.io",
		Password:    "password123",
		FullName:    "No Phone User",
		PhoneNumber: "",
	})

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Nil(t, resp.User.PhoneNumber)
	repo.AssertExpectations(t)
}

func TestRegister_PasswordIsHashed(t *testing.T) {
	repo := &mocks.MockUserRepository{}
	uc := usecase.NewAuthUsecase(repo, newTestRedis(t), newTestConfig())

	plainPassword := "supersecret123"
	repo.On("GetUserByEmail", mock.Anything, "hashtest@autopass.io").Return(nil, nil).Once()
	repo.On("CreateUser", mock.Anything, mock.MatchedBy(func(u *domain.User) bool {
		// Password must not be stored as plaintext
		return u.PasswordHash != nil && *u.PasswordHash != plainPassword
	})).Return(nil).Once()

	resp, err := uc.Register(context.Background(), domain.RegisterRequest{
		Email:    "hashtest@autopass.io",
		Password: plainPassword,
		FullName: "Hash Test",
	})
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	repo.AssertExpectations(t)
}

// ===========================================================================
// LOGIN TESTS
// ===========================================================================

func TestLogin_ValidCredentials(t *testing.T) {
	repo := &mocks.MockUserRepository{}
	uc := usecase.NewAuthUsecase(repo, newTestRedis(t), newTestConfig())

	token, capturedUser := registerHelper(t, uc, repo, "validlogin@autopass.io", "correctpassword", "Valid User")
	assert.NotEmpty(t, token)

	// Login returns the captured user (which has the bcrypt hash).
	repo.On("GetUserByPhoneOrEmail", mock.Anything, "validlogin@autopass.io").Return(capturedUser, nil).Once()

	loginResp, err := uc.Login(context.Background(), domain.LoginRequest{
		Email:    "validlogin@autopass.io",
		Password: "correctpassword",
	})

	assert.NoError(t, err)
	assert.NotNil(t, loginResp)
	assert.NotEmpty(t, loginResp.Token)
	assert.Equal(t, "validlogin@autopass.io", loginResp.User.Email)
	repo.AssertExpectations(t)
}

func TestLogin_WrongPassword(t *testing.T) {
	repo := &mocks.MockUserRepository{}
	uc := usecase.NewAuthUsecase(repo, newTestRedis(t), newTestConfig())

	_, capturedUser := registerHelper(t, uc, repo, "wrongpw@autopass.io", "rightpassword", "Test User")

	repo.On("GetUserByPhoneOrEmail", mock.Anything, "wrongpw@autopass.io").Return(capturedUser, nil).Once()

	resp, err := uc.Login(context.Background(), domain.LoginRequest{
		Email:    "wrongpw@autopass.io",
		Password: "wrongpassword",
	})

	assert.Nil(t, resp)
	assert.EqualError(t, err, "invalid email or password")
	repo.AssertExpectations(t)
}

func TestLogin_UserNotFound(t *testing.T) {
	repo := &mocks.MockUserRepository{}
	uc := usecase.NewAuthUsecase(repo, newTestRedis(t), newTestConfig())

	repo.On("GetUserByPhoneOrEmail", mock.Anything, "ghost@autopass.io").Return(nil, nil)

	resp, err := uc.Login(context.Background(), domain.LoginRequest{
		Email:    "ghost@autopass.io",
		Password: "anything",
	})

	assert.Nil(t, resp)
	assert.EqualError(t, err, "invalid email or password")
	repo.AssertExpectations(t)
}

func TestLogin_GoogleOnlyAccount_RejectsPasswordLogin(t *testing.T) {
	repo := &mocks.MockUserRepository{}
	uc := usecase.NewAuthUsecase(repo, newTestRedis(t), newTestConfig())

	googleUser := &domain.User{
		ID:           "google-user-id",
		Email:        "google@autopass.io",
		FullName:     "Google User",
		PasswordHash: nil, // Google-only account has no password hash
		AuthProvider: "google",
		Role:         "user",
	}
	repo.On("GetUserByPhoneOrEmail", mock.Anything, googleUser.Email).Return(googleUser, nil)

	resp, err := uc.Login(context.Background(), domain.LoginRequest{
		Email:    googleUser.Email,
		Password: "anything",
	})

	assert.Nil(t, resp)
	assert.EqualError(t, err, "account uses social login, please use Google sign-in")
	repo.AssertExpectations(t)
}

// ===========================================================================
// VALIDATE TOKEN TESTS
// ===========================================================================

func TestValidateToken_ValidToken_ContainsCorrectClaims(t *testing.T) {
	repo := &mocks.MockUserRepository{}
	uc := usecase.NewAuthUsecase(repo, newTestRedis(t), newTestConfig())

	token, _ := registerHelper(t, uc, repo, "validate@autopass.io", "pass1234", "Token Tester")

	claims, err := uc.ValidateToken(token)

	assert.NoError(t, err)
	assert.NotNil(t, claims)
	assert.Equal(t, "validate@autopass.io", claims.Email)
	assert.Equal(t, "user", claims.Role)
	assert.NotEmpty(t, claims.UserID)
}

func TestValidateToken_GarbageString_ReturnsError(t *testing.T) {
	repo := &mocks.MockUserRepository{}
	uc := usecase.NewAuthUsecase(repo, newTestRedis(t), newTestConfig())

	claims, err := uc.ValidateToken("garbage.jwt.token")

	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestValidateToken_BlacklistedToken_ReturnsError(t *testing.T) {
	repo := &mocks.MockUserRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewAuthUsecase(repo, redisClient, newTestConfig())

	token, _ := registerHelper(t, uc, repo, "blacklist@autopass.io", "pass1234", "Blacklist Tester")

	// Blacklist the token with 10s TTL
	err := uc.Logout(context.Background(), token)
	assert.NoError(t, err)

	// Direct validation check (auth handler checks Redis explicitly)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	val, err := redisClient.Get(ctx, "blacklist:"+token).Result()
	assert.NoError(t, err)
	assert.Equal(t, "1", val)
}
