package controller

import (
	"encoding/json"
	"net/http"
	"strings"

	"defnotpb/controller/auth"
	"defnotpb/model"
)

type LoginResult struct {
	Response     *string `json:"response"`
	IsError      bool    `json:"is_error"`
	ErrorMessage *string `json:"error_message"`
	AccountType  *string `json:"account_type"`
}

func (s *Server) LoginRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "POST": // Login to application
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
	if user.Username == nil {
		errStr := "Incorrect username/password"
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	if user.Password == nil {
		errStr := "Incorrect username/password"
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	lowUsername := strings.ToLower(*user.Username)
	appUser, err := s.DB.GetAppUserByUsername(lowUsername)
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
	acctInfo, err := s.DB.GetAccountInfoByUserID(*appUser.ID)
	if err != nil {
		errStr := err.Error()
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	if acctInfo == nil {
		errStr := "Incorrect username/password"
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	if acctInfo.AccountTypeID == nil || acctInfo.UseDarkMode == nil {
		errStr := "Failed to login, malformed account info"
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	acctType, err := s.DB.GetAccountTypeByID(*acctInfo.AccountTypeID)
	if err != nil {
		errStr := err.Error()
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	result.AccountType = acctType.Type
	token, err := auth.CreateToken(*appUser.ID, *acctInfo.UseDarkMode)
	if err != nil {
		errStr := err.Error()
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	result.Response = &token
	return result
}
