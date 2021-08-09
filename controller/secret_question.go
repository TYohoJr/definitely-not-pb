package controller

import (
	"encoding/json"
	"net/http"

	"defnotpb/model"
)

func (s *Server) SecretQuestionRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		resp, err := s.getAllSecretQuestions()
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

func (s *Server) getAllSecretQuestions() ([]model.SecretQuestion, error) {
	sqList, err := s.DB.GetSecretQuestions()
	if err != nil {
		return nil, err
	}
	return sqList, nil
}
