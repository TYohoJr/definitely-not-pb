package controller

import (
	"defnotpb/model"
	"encoding/json"
	"net/http"
)

type LoginResult struct {
	Response     *string `json:"response"`
	IsError      bool    `json:"is_error"`
	ErrorMessage *string `json:"error_message"`
}

func (s *Server) LoginRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "POST":
		loginUser := model.AppUser{}
		err := json.NewDecoder(r.Body).Decode(&loginUser)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp := s.handleLogin(loginUser)
		respJSON, err := json.Marshal(resp)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(200)
		w.Header().Set("Content-Type", "application/json")
		w.Write(respJSON)
		return
	}
}

func (s *Server) handleLogin(user model.AppUser) LoginResult {
	result := LoginResult{
		IsError: false,
	}
	appUser, err := s.DB.GetAppUserByUsername(*user.Username)
	if err != nil {
		errStr := err.Error()
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	if appUser == nil {
		errStr := "Incorrect username/password"
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	err = appUser.VerifyPassword(*user.Password)
	if err != nil {
		errStr := "Incorrect username/password"
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	return result
}
