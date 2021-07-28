package controller

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"

	"defnotpb/model"

	"github.com/go-chi/chi"
)

func (s *Server) AlbumRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		userIDStr := chi.URLParam(r, "userID")
		userIDStr, err := url.QueryUnescape(userIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp, err := s.handleGetAlbumsByUserID(userID)
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
		createAlbum := model.Album{}
		err := json.NewDecoder(r.Body).Decode(&createAlbum)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.handleCreateNewAlbum(createAlbum)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(201)
		w.Header().Set("Content-Type", "application/json")
		return
	case "DELETE":
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
		err = s.handleDeleteAlbum(albumID)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(204)
		w.Header().Set("Content-Type", "application/json")
		return
	}
}

func (s *Server) AlbumCheckRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		userIDStr := chi.URLParam(r, "userID")
		userIDStr, err := url.QueryUnescape(userIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		albumName := chi.URLParam(r, "albumName")
		albumName, err = url.QueryUnescape(albumName)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp, err := s.handleGetAlbumsByUserIDAndName(userID, albumName)
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

func (s *Server) handleCreateNewAlbum(album model.Album) error {
	err := s.DB.CreateAlbum(&album)
	if err != nil {
		return err
	}
	return nil
}

func (s *Server) handleGetAlbumsByUserID(userID int) ([]model.Album, error) {
	albums, err := s.DB.GetAlbumsByAppUserID(userID)
	if err != nil {
		return nil, err
	}
	return albums, nil
}

func (s *Server) handleGetAlbumsByUserIDAndName(userID int, albumName string) ([]model.Album, error) {
	albums, err := s.DB.GetAlbumsByAppUserIDAndName(userID, albumName)
	if err != nil {
		return nil, err
	}
	return albums, nil
}

func (s *Server) handleDeleteAlbum(albumID int) error {
	err := s.DB.DeleteAlbumByID(albumID)
	if err != nil {
		return err
	}
	return nil
}
