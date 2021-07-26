package controller

import (
	"defnotpb/model"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/go-chi/chi"
)

func (s *Server) BucketsRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		resp, err := s.getAllBuckets()
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
	case "POST":
		bucketName := chi.URLParam(r, "bucketName")
		bucketName, err := url.QueryUnescape(bucketName)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.createBucket(bucketName)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(201)
		w.Header().Set("Content-Type", "application/json")
		return
	case "DELETE":
		bucketName := chi.URLParam(r, "bucketName")
		bucketName, err := url.QueryUnescape(bucketName)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.deleteBucket(bucketName)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(204)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("Object deleted"))
		return
	}
}

func (s *Server) getAllBuckets() ([]model.Bucket, error) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create new AWS session: %v", err)
	}
	input := &s3.ListBucketsInput{}
	svc := s3.New(sess)
	result, err := svc.ListBuckets(input)
	if err != nil {
		return nil, fmt.Errorf("failed to call AWS api to ListBuckets: %v", err)
	}
	output := []model.Bucket{}
	for _, b := range result.Buckets {
		bckt := model.Bucket{
			Name: b.Name,
		}
		output = append(output, bckt)
	}
	return output, nil
}

func (s *Server) createBucket(bucketName string) error {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})
	if err != nil {
		return fmt.Errorf("failed to create new AWS session: %v", err)
	}
	input := &s3.CreateBucketInput{
		Bucket: aws.String(bucketName),
	}
	svc := s3.New(sess)
	_, err = svc.CreateBucket(input)
	if err != nil {
		return fmt.Errorf("failed to call AWS api to CreateBucket: %v", err)
	}
	return nil
}

func (s *Server) deleteBucket(bucketName string) error {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})
	if err != nil {
		return fmt.Errorf("failed to create new AWS session: %v", err)
	}
	svc := s3.New(sess)
	input := &s3.DeleteBucketInput{
		Bucket: aws.String(bucketName),
	}
	_, err = svc.DeleteBucket(input)
	if err != nil {
		return fmt.Errorf("failed to call AWS api to DeleteBucket: %v", err)
	}
	return nil
}
