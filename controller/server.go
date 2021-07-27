package controller

import (
	"fmt"
	"log"
	"net/http"

	"defnotpb/model"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
)

const (
	serverPort int    = 8080
	awsRegion  string = "us-east-1"
)

type Server struct {
	DB     *model.DB
	Router chi.Router
}

func NewServer(db *model.DB) *Server {
	s := Server{
		DB: db,
	}
	r := chi.NewRouter()
	s.Router = r
	return &s
}

func (s *Server) Initialize() {
	s.Router.Use(render.SetContentType(render.ContentTypeJSON))
	s.initializeRoutes()
	fmt.Println("Backend successfully initialized and listening")
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%v", serverPort), s.Router))
}

func (s *Server) initializeRoutes() {
	s.Router.Route("/api/login", func(r chi.Router) {
		r.Post("/", s.LoginRouter)
	})
	s.Router.Route("/api/secret_question", func(r chi.Router) {
		r.Get("/", s.SecretQuestionRouter)
	})
	s.Router.Route("/api/user", func(r chi.Router) {
		r.Post("/", s.UserRouter)
		r.Route("/{username}", func(r chi.Router) {
			r.Get("/", s.UserRouter)
		})
	})
}
