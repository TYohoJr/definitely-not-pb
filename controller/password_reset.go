package controller

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"defnotpb/model"
)

type PasswordResetDetails struct {
	Email     *string `json:"email"`
	TwoFACode *string `json:"twofa_code"`
	Password  *string `json:"password"`
}

func (s *Server) PasswordResetRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "POST": // Request a 2fa code to reset password
		acctInfo := model.AccountInfo{}
		err := json.NewDecoder(r.Body).Decode(&acctInfo)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.handleRequestPassword2FA(acctInfo)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(204)
		w.Header().Set("Content-Type", "application/json")
		return
	case "PUT": // Reset password
		resetDetails := PasswordResetDetails{}
		err := json.NewDecoder(r.Body).Decode(&resetDetails)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.handleResetPassword(resetDetails)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(204)
		w.Header().Set("Content-Type", "application/json")
		return
	}
}

func (s *Server) handleRequestPassword2FA(acctInfo model.AccountInfo) error {
	currAcctInfo, err := s.DB.GetAccountInfoByUserEmail(strings.ToLower(*acctInfo.Email))
	if err != nil {
		return err
	}
	if currAcctInfo == nil {
		return errors.New("email not found")
	}
	err = s.handleCreateNewTwoFA(*currAcctInfo.AppUserID)
	if err != nil {
		return err
	}
	return nil
}

func (s *Server) handleResetPassword(resetInfo PasswordResetDetails) error {
	acctInfo, err := s.DB.GetAccountInfoByUserEmail(strings.ToLower(*resetInfo.Email))
	if err != nil {
		return err
	}
	if acctInfo == nil {
		return errors.New("email not found")
	}
	appUser, err := s.DB.GetAppUserByID(*acctInfo.AppUserID)
	if err != nil {
		return err
	}
	acctInfo.TwoFACode = resetInfo.TwoFACode
	err = s.handleVerifyTwoFAByEmail(*acctInfo)
	if err != nil {
		return err
	}
	appUser.Password = resetInfo.Password
	err = s.DB.UpdateAppUserPassword(*appUser)
	if err != nil {
		return err
	}
	return nil
}

func (s *Server) handleVerifyTwoFAByEmail(acctInfo model.AccountInfo) error {
	ai, err := s.DB.GetAccountInfoByUserEmail(strings.ToLower(*acctInfo.Email))
	if err != nil {
		return err
	}
	if ai == nil {
		return errors.New("email not found")
	}
	if ai.TwoFACode == nil || ai.TwoFACodeExpiration == nil { // A code was never generated, send generic failure error message
		return errors.New("incorrect code")
	}
	if *ai.TwoFACode != *acctInfo.TwoFACode { // Codes do not match
		return errors.New("incorrect code")
	}
	now := time.Now().UTC()
	if now.After(*ai.TwoFACodeExpiration) { // Code in DB is expired
		return errors.New("code is expired please generate a new one")
	}
	return nil
}
