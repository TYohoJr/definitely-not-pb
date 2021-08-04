package controller

import (
	"encoding/json"
	"net/http"
	"net/url"

	"defnotpb/model"

	"github.com/go-chi/chi"
)

func (s *Server) UserRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		username := chi.URLParam(r, "username")
		username, err := url.QueryUnescape(username)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp, err := s.handleGetUsersByUsername(username)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		respJSON, err := json.Marshal(resp)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(200)
		w.Header().Set("Content-Type", "application/json")
		w.Write(respJSON)
		return
	case "POST":
		createUser := model.AppUser{}
		err := json.NewDecoder(r.Body).Decode(&createUser)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp := s.handleCreateNewUser(createUser)
		respJSON, err := json.Marshal(resp)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(201)
		w.Header().Set("Content-Type", "application/json")
		w.Write(respJSON)
		return
	}
}

func (s *Server) handleCreateNewUser(user model.AppUser) LoginResult {
	result := LoginResult{
		IsError: false,
	}
	err := s.DB.CreateUser(&user)
	if err != nil {
		errStr := err.Error()
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	acctType, err := s.DB.GetAccountTypeByType(defaultAcctType)
	if err != nil {
		errStr := err.Error()
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	if acctType == nil {
		errStr := "failed to find default account type"
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	acctInfo := model.AccountInfo{
		AppUserID:     user.ID,
		AccountTypeID: acctType.ID,
	}
	err = s.DB.CreateAccountInfo(&acctInfo)
	if err != nil {
		errStr := err.Error()
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	return result
}

func (s *Server) handleGetUsersByUsername(username string) ([]model.AppUser, error) {
	users, err := s.DB.GetAppUsersByUsername(username)
	if err != nil {
		return nil, err
	}
	return users, nil
}
