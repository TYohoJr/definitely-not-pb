package controller

import (
	"encoding/json"
	"errors"
	"net/http"

	"defnotpb/controller/auth"
	"defnotpb/model"
)

func (s *Server) AccountTypeRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET": // Account type by user ID located in token
		userID, err := auth.GetAppUserID(r)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp, err := s.handleGetAcctTypeByUser(userID)
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
	}
}

func (s *Server) handleGetAcctTypeByUser(userID int) (*model.AccountType, error) {
	acctInfo, err := s.DB.GetAccountInfoByUserID(userID)
	if err != nil {
		return nil, err
	}
	if acctInfo == nil {
		return nil, errors.New("failed to get account info")
	}
	acctType, err := s.DB.GetAccountTypeByID(*acctInfo.AccountTypeID)
	if err != nil {
		return nil, err
	}
	return acctType, nil
}
