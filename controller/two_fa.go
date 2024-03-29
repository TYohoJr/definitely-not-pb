package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"defnotpb/controller/auth"
	"defnotpb/controller/email"
	"defnotpb/model"
)

func (s *Server) TwoFARouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "POST": // Generate a 2fa code
		userID, err := auth.GetAppUserID(r)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.handleCreateNewTwoFA(userID)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(204)
		w.Header().Set("Content-Type", "application/json")
		return
	case "PUT": // verify a 2fa is valid
		acctInfo := model.AccountInfo{}
		err := json.NewDecoder(r.Body).Decode(&acctInfo)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to decode request body: %v", err.Error()), 500)
			return
		}
		message, err := s.handleVerifyTwoFA(acctInfo)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to verify 2FA code: %v", err.Error()), 500)
			return
		}
		if message == nil {
			http.Error(w, "failed to verify 2FA code: unkown message from server", 500)
			return
		}
		w.WriteHeader(200)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(*message))
		return
	}
}

func (s *Server) handleCreateNewTwoFA(appUserID int) error {
	m := email.MailServer{
		DB: s.DB,
	}
	err := m.Send2FACode(appUserID)
	if err != nil {
		return err
	}
	return nil
}

func (s *Server) handleVerifyTwoFA(acctInfo model.AccountInfo) (*string, error) {
	if acctInfo.TwoFACode == nil {
		res := "Incorrect code"
		return &res, nil
	}
	if acctInfo.AppUserID == nil {
		return nil, errors.New("malformed request, missing user ID")
	}
	existingInfo, err := s.DB.GetAccountInfoByUserID(*acctInfo.AppUserID)
	if err != nil {
		return nil, err
	}
	if existingInfo == nil {
		return nil, errors.New("failed to find account info")
	}
	if existingInfo.AccountTypeID == nil {
		return nil, errors.New("malformed account info")
	}
	if existingInfo.TwoFACode == nil || existingInfo.TwoFACodeExpiration == nil { // A code was never generated, send generic failure error message
		res := "Incorrect code"
		return &res, nil
	}
	now := time.Now().UTC()
	if now.After(*existingInfo.TwoFACodeExpiration) { // Code in DB is expired, fail regardless of code sent
		res := "Code is expired please generate a new one"
		return &res, nil
	}
	if *existingInfo.TwoFACode != *acctInfo.TwoFACode { // Codes do not match
		res := "Incorrect code"
		return &res, nil
	}
	currAcctType, err := s.DB.GetAccountTypeByID(*existingInfo.AccountTypeID)
	if err != nil {
		return nil, err
	}
	if currAcctType == nil {
		return nil, errors.New("failed to find current account type")
	}
	if currAcctType.Type == nil {
		return nil, errors.New("failed to find valid current account type")
	}
	if *currAcctType.Type == defaultAcctType { // If the account type is the intial type that has no access, then upgrade the account type to now use the app features
		baseAcctType, err := s.DB.GetAccountTypeByType(basicAcctType)
		if err != nil {
			return nil, err
		}
		if baseAcctType == nil {
			return nil, errors.New("failed to get base account type")
		}
		acctInfo.AccountTypeID = baseAcctType.ID
	} else {
		acctInfo.AccountTypeID = currAcctType.ID
	}
	err = s.DB.UpdateAccountInfoConfirmed(*acctInfo.AppUserID, *acctInfo.AccountTypeID)
	if err != nil {
		return nil, fmt.Errorf("failed to confirm account email: %v", err)
	}
	res := "correct"
	return &res, nil
}
