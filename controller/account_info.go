package controller

import (
	"defnotpb/model"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"

	"github.com/go-chi/chi"
)

func (s *Server) AccountInfoRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		userIDStr := chi.URLParam(r, "userID")
		userIDStr, err := url.QueryUnescape(userIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp, err := s.handleGetAccountInfo(userID)
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
	case "PUT":
		newAcctInfo := model.AccountInfo{}
		err := json.NewDecoder(r.Body).Decode(&newAcctInfo)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to decode newAcctInfo body: %v", err.Error()), 500)
			return
		}
		err = s.handleUpdateAccountInfo(newAcctInfo)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to update account info: %v", err.Error()), 500)
			return
		}
		w.WriteHeader(204)
		w.Header().Set("Content-Type", "application/json")
		return
	}
}

func (s *Server) handleGetAccountInfo(appUserID int) (*model.AccountInfo, error) {
	ai, err := s.DB.GetAccountInfoByUserID(appUserID)
	if err != nil {
		return nil, err
	}
	if ai == nil {
		return nil, errors.New("failed to find account info for user")
	}
	return ai, nil
}

func (s *Server) handleUpdateAccountInfo(acctInfo model.AccountInfo) error {
	falseVal := false
	acctInfo.IsEmailConfirmed = &falseVal
	acctType, err := s.DB.GetAccountTypeByType(defaultAcctType)
	if err != nil {
		return err
	}
	if acctType == nil {
		return errors.New("failed to find default account type")
	}
	acctInfo.AccountTypeID = acctType.ID
	err = s.DB.UpdateAccountInfo(acctInfo)
	if err != nil {
		return err
	}
	return nil
}
