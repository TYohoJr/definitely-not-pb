package model

import "fmt"

type Album struct {
	ID        *int    `db:"id" json:"id"`
	Name      *string `db:"name" json:"name"`
	AppUserID *int    `db:"app_user_id" json:"app_user_id"`
}

func (db *DB) CreateAlbum(a *Album) error {
	rows, err := db.NamedQuery(
		`INSERT INTO album(name, app_user_id) 
		VALUES (:name, :app_user_id)
		RETURNING id`, a)
	if err != nil {
		return fmt.Errorf("failed to insert album into db: %v", err)
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&a.ID)
	}
	return nil
}

func (db *DB) GetAlbumsByAppUserID(appUserID int) ([]Album, error) {
	albums := []Album{}
	err := db.Select(&albums,
		`SELECT *
		FROM album
		WHERE app_user_id=$1`, appUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get albums by app_user_id from db: %v", err)
	}
	return albums, nil
}

func (db *DB) GetAlbumsByAppUserIDAndName(appUserID int, name string) ([]Album, error) {
	albums := []Album{}
	err := db.Select(&albums,
		`SELECT *
		FROM album
		WHERE app_user_id=$1 AND name=$2`, appUserID, name)
	if err != nil {
		return nil, fmt.Errorf("failed to get albums by app_user_id and name from db: %v", err)
	}
	return albums, nil
}

func (db *DB) DeleteAlbumByID(albumID int) error {
	_, err := db.Exec(
		`DELETE
		FROM album
		WHERE id=$1`, albumID)
	if err != nil {
		return fmt.Errorf("failed to delete album from db by id: %v", err)
	}
	return nil
}

func (db *DB) GetAlbumByID(albumID int) (*Album, error) {
	albums := []Album{}
	err := db.Select(&albums,
		`SELECT *
		FROM album
		WHERE id=$1`, albumID)
	if err != nil {
		return nil, fmt.Errorf("failed to get album by id from db: %v", err)
	}
	if len(albums) < 1 {
		return nil, nil
	}
	return &albums[0], nil
}
