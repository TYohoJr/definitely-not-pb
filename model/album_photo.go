package model

import "fmt"

type AlbumPhoto struct {
	ID      *int `db:"id" json:"id"`
	PhotoID *int `db:"photo_id" json:"photo_id"`
	AlbumID *int `db:"album_id" json:"album_id"`
}

func (db *DB) CreateAlbumPhoto(ap *AlbumPhoto) error {
	rows, err := db.NamedQuery(
		`INSERT INTO album_photo(photo_id, album_id) 
		VALUES (:photo_id, :album_id)
		RETURNING id`, ap)
	if err != nil {
		return fmt.Errorf("failed to insert album_photo into db: %v", err)
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&ap.ID)
	}
	return nil
}

func (db *DB) GetAlbumPhotosByAlbumID(albumID int) ([]AlbumPhoto, error) {
	albumPhotos := []AlbumPhoto{}
	err := db.Select(&albumPhotos,
		`SELECT *
		FROM album_photo
		WHERE album_id=$1`, albumID)
	if err != nil {
		return nil, fmt.Errorf("failed to get album_photos by album_id from db: %v", err)
	}
	return albumPhotos, nil
}

func (db *DB) GetAlbumPhotosByPhotoID(photoID int) ([]AlbumPhoto, error) {
	albumPhotos := []AlbumPhoto{}
	err := db.Select(&albumPhotos,
		`SELECT *
		FROM album_photo
		WHERE photo_id=$1`, photoID)
	if err != nil {
		return nil, fmt.Errorf("failed to get album_photos by photo_id from db: %v", err)
	}
	return albumPhotos, nil
}

func (db *DB) DeleteAlbumPhotoByID(albumPhotoID int) error {
	_, err := db.Exec(
		`DELETE
		FROM album_photo
		WHERE id=$1`, albumPhotoID)
	if err != nil {
		return fmt.Errorf("failed to delete album_photo from db by id: %v", err)
	}
	return nil
}

func (db *DB) DeleteAlbumPhotoByPhotoAndAlbumID(albumID int, photoID int) error {
	_, err := db.Exec(
		`DELETE
		FROM album_photo
		WHERE album_id=$1 AND photo_id=$2`, albumID, photoID)
	if err != nil {
		return fmt.Errorf("failed to delete album_photo from db by album_id and photo_id: %v", err)
	}
	return nil
}

func (db *DB) GetAlbumPhotoByPhotoAndAlbumID(albumID int, photoID int) (*AlbumPhoto, error) {
	albumPhotos := []AlbumPhoto{}
	err := db.Select(&albumPhotos,
		`SELECT *
		FROM album_photo
		WHERE album_id=$1 AND photo_id=$2`, albumID, photoID)
	if err != nil {
		return nil, fmt.Errorf("failed to get album_photo by album_id and photo_id from db: %v", err)
	}
	if len(albumPhotos) < 1 {
		return nil, nil
	}
	return &albumPhotos[0], nil
}
