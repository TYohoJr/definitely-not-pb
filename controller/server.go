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
	bucketName string = "definitely-not-photobucket"
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
	s.Router.Route("/api/photo", func(r chi.Router) {
		r.Put("/", s.PhotoRouter)
		r.Route("/user/{userID}", func(r chi.Router) {
			r.Get("/", s.PhotoUserRouter)
		})
		r.Route("/id/{photoID}", func(r chi.Router) {
			r.Get("/", s.PhotoRouter)
			r.Delete("/", s.PhotoRouter)
		})
		r.Route("/file_name/{fileName}", func(r chi.Router) {
			r.Post("/", s.PhotoRouter)
		})
	})
	s.Router.Route("/api/album", func(r chi.Router) {
		r.Post("/", s.AlbumRouter)
		r.Route("/id/{albumID}", func(r chi.Router) {
			r.Delete("/", s.AlbumRouter)
		})
		r.Route("/user/{userID}", func(r chi.Router) {
			r.Get("/", s.AlbumRouter)
			r.Route("/name/{albumName}", func(r chi.Router) {
				r.Get("/", s.AlbumCheckRouter)
			})
		})
		r.Route("/photo/{photoID}", func(r chi.Router) {
			r.Get("/", s.AlbumByPhotoRouter)
		})
	})
	s.Router.Route("/api/album_photo", func(r chi.Router) {
		r.Post("/", s.AlbumPhotoRouter)
		r.Route("/album/{albumID}", func(r chi.Router) {
			r.Get("/", s.AlbumPhotoRouter)
		})
	})
	s.Router.Route("/api/error_event", func(r chi.Router) {
		r.Post("/", s.ErrorEventRouter)
	})
}
