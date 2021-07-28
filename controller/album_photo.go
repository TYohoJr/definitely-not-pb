package controller

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"

	"defnotpb/model"

	"github.com/go-chi/chi"
)

func (s *Server) AlbumPhotoRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		albumIDStr := chi.URLParam(r, "albumID")
		albumIDStr, err := url.QueryUnescape(albumIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		albumID, err := strconv.Atoi(albumIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp, err := s.handleGetAlbumPhotosByAlbumID(albumID)
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
		createAlbumPhoto := model.AlbumPhoto{}
		err := json.NewDecoder(r.Body).Decode(&createAlbumPhoto)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.handleCreateNewAlbumPhoto(createAlbumPhoto)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(201)
		w.Header().Set("Content-Type", "application/json")
		return
	}
}

func (s *Server) handleCreateNewAlbumPhoto(albumPhoto model.AlbumPhoto) error {
	err := s.DB.CreateAlbumPhoto(&albumPhoto)
	if err != nil {
		return err
	}
	return nil
}

func (s *Server) handleGetAlbumPhotosByAlbumID(albumID int) ([]model.AlbumPhoto, error) {
	albumPhotos, err := s.DB.GetAlbumPhotosByAlbumID(albumID)
	if err != nil {
		return nil, err
	}
	return albumPhotos, nil
}
