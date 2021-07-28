package model

import (
	"fmt"
)

type Photo struct {
	ID          *int    `db:"id" json:"id"`
	AppUserID   *int    `db:"app_user_id" json:"app_user_id"`
	Name        *string `db:"name" json:"name"`
	S3Bucket    *string `db:"s3_bucket" json:"s3_bucket"`
	S3Key       *string `db:"s3_key" json:"s3_key"`
	Description *string `db:"description" json:"description"`
	FileType    *string `db:"file_type" json:"file_type"`
}

func (db *DB) CreatePhoto(p *Photo) error {
	rows, err := db.NamedQuery(
		`INSERT INTO photo(name, app_user_id, s3_bucket, s3_key, description, file_type) 
		VALUES (:name, :app_user_id, :s3_bucket, :s3_key, :description, :file_type)
		RETURNING id`, p)
	if err != nil {
		return fmt.Errorf("failed to insert photo into db: %v", err)
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&p.ID)
	}
	return nil
}

func (db *DB) GetPhotosByAppUserID(appUserID int) ([]Photo, error) {
	photos := []Photo{}
	err := db.Select(&photos,
		`SELECT *
		FROM photo
		WHERE app_user_id=$1`, appUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get photos by app_user_id from db: %v", err)
	}
	return photos, nil
}

func (db *DB) GetPhotoByID(photoID int) (*Photo, error) {
	photos := []Photo{}
	err := db.Select(&photos,
		`SELECT *
		FROM photo
		WHERE id=$1`, photoID)
	if err != nil {
		return nil, fmt.Errorf("failed to get photo by id from db: %v", err)
	}
	if len(photos) < 1 {
		return nil, nil
	}
	return &photos[0], nil
}

func (db *DB) DeletePhotoByID(photoID int) error {
	_, err := db.Exec(
		`DELETE
		FROM photo
		WHERE id=$1`, photoID)
	if err != nil {
		return fmt.Errorf("failed to delete photo from db by id: %v", err)
	}
	return nil
}
