package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"defnotpb/controller/auth"
	"defnotpb/model"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

func (s *Server) AccountInfoRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		userID, err := auth.GetAppUserID(r)
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
	case "DELETE":
		userID, err := auth.GetAppUserID(r)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.handledeleteAccount(userID)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to delete account: %v", err.Error()), 500)
			return
		}
		w.WriteHeader(204)
		w.Header().Set("Content-Type", "application/json")
		return
	}
}

func (s *Server) AccountUseDarkModeRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "PUT":
		userID, err := auth.GetAppUserID(r)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		newAcctInfo := model.AccountInfo{}
		err = json.NewDecoder(r.Body).Decode(&newAcctInfo)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to decode newAcctInfo body: %v", err.Error()), 500)
			return
		}
		err = s.handleUpdateUseDarkMode(userID, newAcctInfo)
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
	if acctInfo.Email == nil {
		return errors.New("invalid email")
	}
	lowerEmail := strings.ToLower(*acctInfo.Email)
	acctInfo.Email = &lowerEmail
	existingEmail, err := s.DB.GetAccountInfoByUserEmail(strings.ToLower(*acctInfo.Email))
	if err != nil {
		return err
	}
	if existingEmail != nil {
		return errors.New("email already in use")
	}
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

func (s *Server) handleUpdateUseDarkMode(userID int, acctInfo model.AccountInfo) error {
	if acctInfo.UseDarkMode == nil {
		return errors.New("failed to get dark mode use bool")
	}
	err := s.DB.UpdateAccountInfoDarkMode(userID, *acctInfo.UseDarkMode)
	if err != nil {
		return err
	}
	return nil
}

func (s *Server) handledeleteAccount(userID int) error {
	user, err := s.DB.GetAppUserByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("failed to find user to delete account")
	}
	photos, err := s.DB.GetPhotosByAppUserID(userID)
	if err != nil {
		return err
	}
	for _, p := range photos {
		if p.S3Bucket == nil || p.S3Key == nil {
			continue
		}
		deletePhotoFromS3(*p.S3Bucket, *p.S3Key)
	}
	err = s.DB.DeleteAccount(userID)
	if err != nil {
		return err
	}
	return nil
}

func deletePhotoFromS3(bucketName string, objKey string) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})
	if err != nil {
		return
	}
	svc := s3.New(sess)
	input := &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objKey),
	}
	_, err = svc.DeleteObject(input)
	if err != nil {
		return
	}
}
