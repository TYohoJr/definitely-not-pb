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
		// Retrieve bucket and object from variables in URL
		bucketName := chi.URLParam(r, "bucketName")
		objKey := chi.URLParam(r, "objKey")
		// Undo the escaping that can occur when a URL contains special characters
		bucketName, err := url.QueryUnescape(bucketName)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		// Undo the escaping that can occur when a URL contains special characters
		objKey, err = url.QueryUnescape(objKey)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer r.Body.Close()
		// Create a local file to store the uploaded file
		outputFile, err := os.Create(objKey)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer outputFile.Close()
		// Copy the contents of the uploaded file to the local file
		_, err = io.Copy(outputFile, r.Body)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		// Call internal method to upload the file to the specified S3 bucket
		err = s.uploadObject(bucketName, objKey, objKey)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		// Return a succes response to the client
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
	// Create new session that can use to authenticate to AWS
	// Will use the credential environment variables that were previously loaded from .env
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})
	if err != nil {
		return fmt.Errorf("failed to create new AWS session: %v", err)
	}
	// Open the local file so the contents can be sent
	file, err := os.Open(filename)
	if err != nil {
		return fmt.Errorf("failed to open temp file: %v", err)
	}
	svc := s3.New(sess)
	// Define the object that should be uploaded
	input := &s3.PutObjectInput{
		Body:   file,                   // Contents of the file
		Bucket: aws.String(bucketName), // Bucket the file should be located in
		Key:    aws.String(objKey),     // Name of the file
	}
	// Make call to AWS to upload the file
	_, err = svc.PutObject(input)
	if err != nil {
		return fmt.Errorf("failed to call AWS api to PutObject: %v", err)
	}
	// If there is no error from the AWS call then the upload was successful
	return nil
}
