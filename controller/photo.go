package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

	"defnotpb/controller/auth"
	"defnotpb/model"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/go-chi/chi"
	"github.com/gofrs/uuid"
)

func (s *Server) PhotoRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET": // Get a URL to a photo by photo_id
		photoIDStr := chi.URLParam(r, "photoID")
		photoIDStr, err := url.QueryUnescape(photoIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		photoID, err := strconv.Atoi(photoIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp, err := s.handleGetPhotoByID(photoID)
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
	case "POST": // Create copy of a new photo to server
		fileName := chi.URLParam(r, "fileName")
		fileName, err := url.QueryUnescape(fileName)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer r.Body.Close()
		outputFile, err := os.Create(fileName)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to create outputfile: %v", err.Error()), 500)
			return
		}
		defer outputFile.Close()
		_, err = io.Copy(outputFile, r.Body)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to copy file: %v", err.Error()), 500)
			return
		}
		contentType := r.Header.Get("Content-Type")
		err = s.verifyContentType(contentType)
		if err != nil {
			http.Error(w, fmt.Sprintf("file failed validation: %v", err.Error()), 500)
			return
		}
		w.WriteHeader(201)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(contentType))
		return
	case "PUT": // Upload/Create new photo that was previously POSTed to server
		createPhoto := model.Photo{}
		err := json.NewDecoder(r.Body).Decode(&createPhoto)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to decode createPhoto body: %v", err.Error()), 500)
			return
		}
		userID, err := auth.GetAppUserID(r)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.handleCreateNewPhoto(createPhoto, userID)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to upload photo: %v", err.Error()), 500)
			return
		}
		w.WriteHeader(204)
		w.Header().Set("Content-Type", "application/json")
		return
	case "DELETE": // Delete a photo by photo_id
		photoIDStr := chi.URLParam(r, "photoID")
		photoIDStr, err := url.QueryUnescape(photoIDStr)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to unescpae query string: %v", err.Error()), 500)
			return
		}
		photoID, err := strconv.Atoi(photoIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.handleDeletePhotoByID(photoID)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(204)
		w.Header().Set("Content-Type", "application/json")
		return
	}
}

func (s *Server) PhotoUserRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET": // Get a list of photos by user_id
		userID, err := auth.GetAppUserID(r)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp, err := s.handleGetPhotosByUserID(userID)
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

func (s *Server) PhotoDownloadRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET": // Download a photo
		photoStr := chi.URLParam(r, "photoID")
		photoStr, err := url.QueryUnescape(photoStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		photoID, err := strconv.Atoi(photoStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		userID, err := auth.GetAppUserID(r)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		fileContent, fileName, fileType, err := s.handleDownloadPhoto(photoID, userID)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to download photo: %v", err.Error()), 500)
			return
		}
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", *fileName))
		w.Header().Set("Content-Type", *fileType)
		w.WriteHeader(200)
		io.Copy(w, fileContent)
		fileContent.Close()
		return
	}
}

func (s *Server) handleCreateNewPhoto(photo model.Photo, userID int) error {
	acctInfo, err := s.DB.GetAccountInfoByUserID(userID)
	if err != nil {
		return err
	}
	if acctInfo == nil {
		return errors.New("failed to find account info")
	}
	file, err := os.Open(*photo.Name)
	if err != nil {
		return fmt.Errorf("failed to open temp file: %v", err)
	}
	fi, err := file.Stat()
	if err != nil {
		return err
	}
	size := fi.Size()
	err = s.handleUploadLimit(*acctInfo, size)
	if err != nil {
		return err
	}
	objUUID, err := uuid.NewV1()
	if err != nil {
		return err
	}
	uniqueObjKey := fmt.Sprintf("%s-%s", objUUID.String(), *photo.Name)
	objKey := fmt.Sprintf("users/%v/photos/%v", *photo.AppUserID, uniqueObjKey)
	err = s.uploadObject(bucketName, objKey, *photo.Name)
	if err != nil {
		return err
	}
	bucket := bucketName
	fType, err := s.DB.GetFileTypeByName(*photo.FileType)
	if err != nil {
		return err
	}
	if fType == nil {
		return errors.New("invalid file type")
	}
	photo.FileTypeID = fType.ID
	photo.S3Bucket = &bucket
	photo.S3Key = &objKey
	photo.Size = &size
	err = s.DB.CreatePhoto(&photo)
	if err != nil {
		return err
	}
	return nil
}

func (s *Server) handleGetPhotosByUserID(userID int) ([]model.Photo, error) {
	photos, err := s.DB.GetPhotosByAppUserID(userID)
	if err != nil {
		return nil, err
	}
	return photos, nil
}

func (s *Server) handleDownloadPhoto(photoID int, userID int) (io.ReadCloser, *string, *string, error) {
	acctInfo, err := s.DB.GetAccountInfoByUserID(userID)
	if err != nil {
		return nil, nil, nil, err
	}
	if acctInfo == nil {
		return nil, nil, nil, errors.New("failed to find account info")
	}
	photo, err := s.DB.GetPhotoByID(photoID)
	if err != nil {
		return nil, nil, nil, err
	}
	if photo == nil {
		return nil, nil, nil, errors.New("failed to download photo")
	}
	err = s.handleDownloadLimit(*acctInfo, *photo.Size)
	if err != nil {
		return nil, nil, nil, err
	}
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to create new AWS session: %v", err)
	}
	svc := s3.New(sess)
	input := &s3.GetObjectInput{
		Bucket: aws.String(*photo.S3Bucket),
		Key:    aws.String(*photo.S3Key),
	}
	result, err := svc.GetObject(input)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to call AWS api to GetObject: %v", err)
	}
	return result.Body, photo.Name, result.ContentType, nil
}

func (s *Server) handleGetPhotoByID(photoID int) (*string, error) {
	photo, err := s.DB.GetPhotoByID(photoID)
	if err != nil {
		return nil, err
	}
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion)},
	)
	if err != nil {
		return nil, err
	}
	svc := s3.New(sess)
	req, _ := svc.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(*photo.S3Bucket),
		Key:    aws.String(*photo.S3Key),
	})
	urlStr, err := req.Presign(15 * time.Minute)
	if err != nil {
		return nil, err
	}
	return &urlStr, nil
}

func (s *Server) handleDeletePhotoByID(photoID int) error {
	albumPhotos, err := s.DB.GetAlbumPhotosByPhotoID(photoID)
	if err != nil {
		return err
	}
	for _, ap := range albumPhotos {
		err = s.DB.DeleteAlbumPhotoByID(*ap.ID)
		if err != nil {
			return err
		}
	}
	photo, err := s.DB.GetPhotoByID(photoID)
	if err != nil {
		return err
	}
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})
	if err != nil {
		return fmt.Errorf("failed to create new AWS session: %v", err)
	}
	svc := s3.New(sess)
	input := &s3.DeleteObjectInput{
		Bucket: aws.String(*photo.S3Bucket),
		Key:    aws.String(*photo.S3Key),
	}
	_, err = svc.DeleteObject(input)
	if err != nil {
		return fmt.Errorf("failed to call AWS api to DeleteObject: %v", err)
	}
	err = s.DB.DeletePhotoByID(photoID)
	if err != nil {
		return err
	}
	return nil
}

func (s *Server) uploadObject(bucketName string, objKey string, filename string) error {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})
	if err != nil {
		return fmt.Errorf("failed to create new AWS session: %v", err)
	}
	file, err := os.Open(filename)
	if err != nil {
		return fmt.Errorf("failed to open temp file: %v", err)
	}
	svc := s3.New(sess)
	input := &s3.PutObjectInput{
		Body:   file,
		Bucket: aws.String(bucketName),
		Key:    aws.String(objKey),
	}
	_, err = svc.PutObject(input)
	if err != nil {
		return fmt.Errorf("failed to call AWS api to PutObject: %v", err)
	}
	return nil
}

func (s *Server) verifyContentType(contentType string) error {
	fType, err := s.DB.GetFileTypeByName(contentType)
	if err != nil {
		return err
	}
	if fType == nil {
		return errors.New("invalid file type")
	}
	return nil
}

func (s *Server) handleUploadLimit(acctInfo model.AccountInfo, uploadAmt int64) error {
	dataUsage := model.AccountDataUsage{}
	currUsage, err := s.DB.GetAccountDataUsageByAccountInfoIDAndCurrentMonth(*acctInfo.ID)
	if err != nil {
		return err
	}
	if currUsage == nil {
		dataUsage.AccountInfoID = acctInfo.ID
		err = s.DB.CreateAccountDataUsageForCurrentMonth(&dataUsage)
		if err != nil {
			return err
		}
	} else {
		dataUsage.UploadAmount = currUsage.UploadAmount
		dataUsage.ID = currUsage.ID
	}
	dataLimit, err := s.DB.GetAccountTypeLimitByTypeID(*acctInfo.AccountTypeID)
	if err != nil {
		return err
	}
	plannedUsage := *dataUsage.UploadAmount + uploadAmt
	if plannedUsage > *dataLimit.UploadLimit {
		return errors.New("reached monthly upload limit")
	}
	err = s.DB.UpdateAccountDataUsageUploadByID(*dataUsage.ID, plannedUsage)
	if err != nil {
		return err
	}
	return nil
}

func (s *Server) handleDownloadLimit(acctInfo model.AccountInfo, downloadAmt int64) error {
	dataUsage := model.AccountDataUsage{}
	currUsage, err := s.DB.GetAccountDataUsageByAccountInfoIDAndCurrentMonth(*acctInfo.ID)
	if err != nil {
		return err
	}
	if currUsage == nil {
		dataUsage.AccountInfoID = acctInfo.ID
		err = s.DB.CreateAccountDataUsageForCurrentMonth(&dataUsage)
		if err != nil {
			return err
		}
	} else {
		dataUsage.DownloadAmount = currUsage.DownloadAmount
		dataUsage.ID = currUsage.ID
	}
	dataLimit, err := s.DB.GetAccountTypeLimitByTypeID(*acctInfo.AccountTypeID)
	if err != nil {
		return err
	}
	plannedUsage := *dataUsage.DownloadAmount + downloadAmt
	if plannedUsage > *dataLimit.DownloadLimit {
		return errors.New("reached monthly download limit")
	}
	err = s.DB.UpdateAccountDataUsageDownloadByID(*dataUsage.ID, plannedUsage)
	if err != nil {
		return err
	}
	return nil
}
