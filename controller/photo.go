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

	"defnotpb/model"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/go-chi/chi"
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
		err = s.handleCreateNewPhoto(createPhoto)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to create new photo: %v", err.Error()), 500)
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

func (s *Server) handleCreateNewPhoto(photo model.Photo) error {
	objKey := fmt.Sprintf("users/%v/photos/%v", *photo.AppUserID, *photo.Name)
	err := s.uploadObject(bucketName, objKey, *photo.Name)
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
