package controller

import (
	"encoding/json"
	"net/http"

	"defnotpb/model"
)

func (s *Server) ErrorEventRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "POST": // Create an error event
		createErrorEvent := model.ErrorEvent{}
		err := json.NewDecoder(r.Body).Decode(&createErrorEvent)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.handleCreateNewErrorEvent(createErrorEvent)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(201)
		w.Header().Set("Content-Type", "application/json")
		return
	}
}

func (s *Server) handleCreateNewErrorEvent(errEvent model.ErrorEvent) error {
	err := s.DB.CreateErrorEvent(&errEvent)
	if err != nil {
		return err
	}
	return nil
}
