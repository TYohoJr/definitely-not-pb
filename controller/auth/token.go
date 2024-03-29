package auth

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	jwt "github.com/dgrijalva/jwt-go"
	"github.com/gofrs/uuid"
)

var (
	tokenSignatureKey string
)

type Claims struct {
	jwt.StandardClaims
	AppUserID   int  `json:"user_id"`
	UseDarkMode bool `json:"use_dark_mode"`
}

func InitializeAuth() error {
	keyUUID, err := uuid.NewV1()
	if err != nil {
		return err
	}
	tokenSignatureKey = keyUUID.String()
	return nil
}

func CreateToken(userID int, useDarkMode bool) (string, error) {
	claims := Claims{
		jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Hour * 24).UTC().Unix(),
			Issuer:    "DNP",
			IssuedAt:  time.Now().UTC().Unix(),
		},
		userID,
		useDarkMode,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(tokenSignatureKey))
}

func ParseToken(r *http.Request) (jwt.MapClaims, error) {
	tokenString := extractToken(r)
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(tokenSignatureKey), nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("JWT Token validation failed")
}

func extractToken(r *http.Request) string {
	keys := r.URL.Query()
	token := keys.Get("token")
	if token != "" {
		return token
	}
	bearerToken := r.Header.Get("Authorization")
	if len(strings.Split(bearerToken, " ")) == 2 {
		return strings.Split(bearerToken, " ")[1]
	}
	return ""
}

func GetAppUserID(r *http.Request) (int, error) {
	claims, err := ParseToken(r)
	if err != nil {
		return 0, err
	}
	userIDType := claims["user_id"]
	userID64, ok := userIDType.(float64)
	if !ok {
		return 0, errors.New("invalid application user ID")
	}
	return int(userID64), nil
}
