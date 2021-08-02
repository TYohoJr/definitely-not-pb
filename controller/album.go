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
	case "GET": // Get a list of albums by user_id
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
	case "POST": // Create an album
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
	case "DELETE": // Delete an album
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

func (s *Server) AlbumByPhotoRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET": // Get a list of albums by photo_id
		photoIDStr := chi.URLParam(r, "photoID")
		photoIDStr, err := url.QueryUnescape(photoIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		photoID, err := strconv.Atoi(photoIDStr)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		resp, err := s.handleGetAlbumsByPhotoID(photoID)
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

func (s *Server) AlbumCheckRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET": // Get a list(one or none) of albums by user_id and album_name
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

func (s *Server) handleGetAlbumsByPhotoID(photoID int) ([]model.Album, error) {
	albumPhotos, err := s.DB.GetAlbumPhotosByPhotoID(photoID)
	if err != nil {
		return nil, err
	}
	albums := []model.Album{}
	for _, ap := range albumPhotos {
		album, err := s.DB.GetAlbumByID(*ap.AlbumID)
		if err != nil {
			return nil, err
		}
		albums = append(albums, *album)
	}
	return albums, nil
}
