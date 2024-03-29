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
	serverPort              int    = 8080
	awsRegion               string = "us-east-1"
	bucketName              string = "definitely-not-photobucket"
	defaultAcctType         string = "test"
	basicAcctType           string = "free"
	premiumAcctType         string = "premium"
	defaultAcctTypeUsername string = "testuser"
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
	m := Middleware{
		DB: s.DB,
	}
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
	s.Router.Route("/api/health_check", func(r chi.Router) {
		r.Get("/", s.HealthCheckRouter)
	})
	s.Router.Route("/api/password_reset", func(r chi.Router) {
		r.Post("/", s.PasswordResetRouter)
		r.Put("/", s.PasswordResetRouter)
	})
	s.Router.Route("/api/photo", func(r chi.Router) {
		r.Put("/", m.AuthorizationMiddleware(s.PhotoRouter))
		r.Route("/user/{userID}", func(r chi.Router) {
			r.Get("/", m.AuthorizationMiddleware(s.PhotoUserRouter))
		})
		r.Route("/download/id/{photoID}", func(r chi.Router) {
			r.Get("/", m.AuthorizationMiddleware(s.PhotoDownloadRouter))
		})
		r.Route("/id/{photoID}", func(r chi.Router) {
			r.Get("/", m.AuthorizationMiddleware(s.PhotoRouter))
			r.Delete("/", m.AuthorizationMiddleware(s.PhotoRouter))
		})
		r.Route("/file_name/{fileName}", func(r chi.Router) {
			r.Post("/", m.AuthorizationMiddleware(s.PhotoRouter))
		})
	})
	s.Router.Route("/api/album", func(r chi.Router) {
		r.Post("/", m.AuthorizationMiddleware(s.AlbumRouter))
		r.Route("/id/{albumID}", func(r chi.Router) {
			r.Delete("/", m.AuthorizationMiddleware(s.AlbumRouter))
		})
		r.Route("/user/{userID}", func(r chi.Router) {
			r.Get("/", m.AuthorizationMiddleware(s.AlbumRouter))
			r.Route("/name/{albumName}", func(r chi.Router) {
				r.Get("/", m.AuthorizationMiddleware(s.AlbumCheckRouter))
			})
		})
		r.Route("/photo/{photoID}", func(r chi.Router) {
			r.Get("/", m.AuthorizationMiddleware(s.AlbumByPhotoRouter))
		})
	})
	s.Router.Route("/api/album_photo", func(r chi.Router) {
		r.Post("/", m.AuthorizationMiddleware(s.AlbumPhotoRouter))
		r.Delete("/", m.AuthorizationMiddleware(s.AlbumPhotoRouter))
		r.Route("/album/{albumID}", func(r chi.Router) {
			r.Get("/", m.AuthorizationMiddleware(s.AlbumPhotoRouter))
		})
	})
	s.Router.Route("/api/error_event", func(r chi.Router) {
		r.Post("/", m.AuthorizationMiddleware(s.ErrorEventRouter))
	})
	s.Router.Route("/api/account_info", func(r chi.Router) {
		r.Put("/", m.AuthorizationMiddleware(s.AccountInfoRouter))
		r.Route("/user/{userID}", func(r chi.Router) {
			r.Get("/", m.AuthorizationMiddleware(s.AccountInfoRouter))
			r.Delete("/", m.AuthorizationMiddleware(s.AccountInfoRouter))
		})
		r.Route("/dark_mode", func(r chi.Router) {
			r.Put("/", m.AuthorizationMiddleware(s.AccountUseDarkModeRouter))
		})
	})
	s.Router.Route("/api/two_fa", func(r chi.Router) {
		r.Put("/", m.AuthorizationMiddleware(s.TwoFARouter))
		r.Route("/user/{userID}", func(r chi.Router) {
			r.Post("/", m.AuthorizationMiddleware(s.TwoFARouter))
		})
	})
	s.Router.Route("/api/account_type", func(r chi.Router) {
		r.Get("/", m.AuthorizationMiddleware(s.AccountTypeRouter))
	})
}
