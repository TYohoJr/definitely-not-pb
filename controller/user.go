package controller

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"

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
	usernameLow := strings.ToLower(*user.Username)
	user.Username = &usernameLow
	secQuestLow := strings.ToLower(*user.SecretQuestionAnswer)
	user.SecretQuestionAnswer = &secQuestLow
	result := LoginResult{
		IsError: false,
	}
	err := s.validateNewUser(user)
	if err != nil {
		errStr := err.Error()
		result.IsError = true
		result.ErrorMessage = &errStr
		return result
	}
	err = s.DB.CreateUser(&user)
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

func (s *Server) validateNewUser(user model.AppUser) error {
	if user.Username == nil {
		return errors.New("username cannot be empty")
	}
	if len(*user.Username) > 50 {
		return errors.New("username cannot be more than 50 characters")
	}
	if user.Password == nil {
		return errors.New("password cannot be empty")
	}
	if len(*user.Password) > 50 {
		return errors.New("password cannot be more than 50 characters")
	}
	if user.SecretQuestionID == nil {
		return errors.New("invalid secret question")
	}
	sq, err := s.DB.GetSecretQuestionByID(*user.SecretQuestionID)
	if err != nil {
		return err
	}
	if sq == nil {
		return errors.New("invalid secret question")
	}
	if user.SecretQuestionAnswer == nil {
		return errors.New("secret question answer cannot be empty")
	}
	if len(*user.SecretQuestionAnswer) > 50 {
		return errors.New("secret question answer cannot be more than 50 characters")
	}
	return nil
}

func (s *Server) handleGetUsersByUsername(username string) ([]model.AppUser, error) {
	users, err := s.DB.GetAppUsersByUsername(username)
	if err != nil {
		return nil, err
	}
	return users, nil
}
