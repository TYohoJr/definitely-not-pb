package controller

import (
	"net/http"
)

func (s *Server) HealthCheckRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		w.WriteHeader(200)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("Healthy"))
		return
	}
}
