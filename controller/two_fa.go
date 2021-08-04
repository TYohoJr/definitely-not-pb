package controller

import (
	"defnotpb/controller/email"
	"defnotpb/model"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/go-chi/chi"
)

func (s *Server) TwoFARouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "POST":
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
		err = s.handleCreateNewTwoFA(userID)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(204)
		w.Header().Set("Content-Type", "application/json")
		return
	case "PUT":
		acctInfo := model.AccountInfo{}
		err := json.NewDecoder(r.Body).Decode(&acctInfo)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to decode acctInfo body: %v", err.Error()), 500)
			return
		}
		matched, err := s.handleVerifyTwoFA(acctInfo)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to verify 2FA code: %v", err.Error()), 500)
			return
		}
		w.WriteHeader(200)
		w.Header().Set("Content-Type", "application/json")
		if matched {
			w.Write([]byte("matched"))
		} else {
			w.Write([]byte("failed"))
		}
		return
	}
}

func (s *Server) handleCreateNewTwoFA(appUserID int) error {
	m := email.MailServer{
		DB: s.DB,
	}
	err := m.Send2FACode(1)
	if err != nil {
		return err
	}
	return nil
}

func (s *Server) handleVerifyTwoFA(acctInfo model.AccountInfo) (bool, error) {
	ai, err := s.DB.GetAccountInfoByUserID(*acctInfo.AppUserID)
	if err != nil {
		return false, err
	}
	if ai.TwoFACode == nil || ai.TwoFACodeExpiration == nil { // A code was never generated, send generic failure error message
		return false, errors.New("failed to verify 2FA code")
	}
	now := time.Now().UTC()
	if now.After(*ai.TwoFACodeExpiration) { // Code in DB is expired, fail regardless of code sent
		return false, errors.New("2fa code is expired please generate a new one")
	}
	if *ai.TwoFACode != *acctInfo.TwoFACode { // Codes do not match
		return false, nil
	}
	err = s.DB.UpdateAccountInfoConfirmed(*acctInfo.AppUserID)
	if err != nil {
		return false, fmt.Errorf("failed to confirm account email: %v", err)
	}
	return true, nil
}
