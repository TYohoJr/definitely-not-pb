package controller

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strconv"

	"defnotpb/model"

	"github.com/go-chi/chi"
)

func (s *Server) AlbumPhotoRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET": // Get a list of album_photos by an album_id
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
	case "POST": // Create an album_photo
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
	case "DELETE": // Delete an album_photo
		deleteAlbumPhoto := model.AlbumPhoto{}
		err := json.NewDecoder(r.Body).Decode(&deleteAlbumPhoto)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		err = s.handleDeleteAlbumPhoto(deleteAlbumPhoto)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(204)
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

func (s *Server) handleDeleteAlbumPhoto(albumPhoto model.AlbumPhoto) error {
	ap, err := s.DB.GetAlbumPhotoByPhotoAndAlbumID(*albumPhoto.AlbumID, *albumPhoto.PhotoID)
	if err != nil {
		return err
	}
	if ap == nil {
		return errors.New("failed to find album_photo")
	}
	err = s.DB.DeleteAlbumPhotoByPhotoAndAlbumID(*albumPhoto.AlbumID, *albumPhoto.PhotoID)
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
