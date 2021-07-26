package controller

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"

	"defnotpb/model"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/go-chi/chi"
)

func (s *Server) ObjectsRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		bucketName := chi.URLParam(r, "bucketName")
		bucketName, err := url.QueryUnescape(bucketName)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp, err := s.getObjects(bucketName)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		respJSON, err := json.Marshal(resp)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(respJSON)
		return
	}
}

func (s *Server) ObjectRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		bucketName := chi.URLParam(r, "bucketName")
		objKey := chi.URLParam(r, "objKey")
		bucketName, err := url.QueryUnescape(bucketName)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		objKey, err = url.QueryUnescape(objKey)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp, filename, contentType, err := s.downloadObject(bucketName, objKey)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", *filename))
		w.Header().Set("Content-Type", *contentType)
		w.WriteHeader(200)
		io.Copy(w, resp)
		resp.Close()
		return
	case "DELETE":
		bucketName := chi.URLParam(r, "bucketName")
		objKey := chi.URLParam(r, "objKey")
		bucketName, err := url.QueryUnescape(bucketName)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		objKey, err = url.QueryUnescape(objKey)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.deleteObject(bucketName, objKey)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(204)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("Object deleted"))
		return
	case "POST":
		bucketName := chi.URLParam(r, "bucketName")
		objKey := chi.URLParam(r, "objKey")
		bucketName, err := url.QueryUnescape(bucketName)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		objKey, err = url.QueryUnescape(objKey)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer r.Body.Close()
		outputFile, err := os.Create(objKey)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer outputFile.Close()
		_, err = io.Copy(outputFile, r.Body)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.uploadObject(bucketName, objKey, objKey)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(201)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("Object deleted"))
		return
	}
}

func (s *Server) getObjects(bucketName string) ([]model.Object, error) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create new AWS session: %v", err)
	}
	svc := s3.New(sess)
	input := &s3.ListObjectsInput{
		Bucket: aws.String(bucketName),
	}
	result, err := svc.ListObjects(input)
	if err != nil {
		return nil, fmt.Errorf("failed to call AWS api to ListObjects: %v", err)
	}
	output := []model.Object{}
	for _, o := range result.Contents {
		obj := model.Object{
			BucketName: &bucketName,
			Key:        o.Key,
		}
		output = append(output, obj)
	}
	return output, nil
}

func (s *Server) downloadObject(bucketName string, objKey string) (io.ReadCloser, *string, *string, error) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to create new AWS session: %v", err)
	}
	svc := s3.New(sess)
	input := &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objKey),
	}
	result, err := svc.GetObject(input)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to call AWS api to GetObject: %v", err)
	}
	return result.Body, &objKey, result.ContentType, nil
}

func (s *Server) deleteObject(bucketName string, objKey string) error {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})
	if err != nil {
		return fmt.Errorf("failed to create new AWS session: %v", err)
	}
	svc := s3.New(sess)
	input := &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objKey),
	}
	_, err = svc.DeleteObject(input)
	if err != nil {
		return fmt.Errorf("failed to call AWS api to DeleteObject: %v", err)
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
