package controller

import (
	"net/http"

	"defnotpb/controller/auth"
	"defnotpb/model"
)

type Middleware struct {
	DB *model.DB
}

func (m *Middleware) AuthorizationMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, err := auth.ParseToken(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}
