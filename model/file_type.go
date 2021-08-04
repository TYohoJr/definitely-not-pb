package model

import (
	"fmt"
)

type FileType struct {
	ID   *int    `db:"id" json:"id"`
	Type *string `db:"type" json:"type"`
}

func (db *DB) GetFileTypeByName(fType string) (*FileType, error) {
	fileTypes := []FileType{}
	err := db.Select(&fileTypes,
		`SELECT *
		FROM file_type
		WHERE type=$1`, fType)
	if err != nil {
		return nil, fmt.Errorf("failed to get file_type by type from db: %v", err)
	}
	if len(fileTypes) < 1 {
		return nil, nil
	}
	return &fileTypes[0], nil
}

func (db *DB) GetFileTypeByID(id int) (*FileType, error) {
	fileTypes := []FileType{}
	err := db.Select(&fileTypes,
		`SELECT *
		FROM file_type
		WHERE id=$1`, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get file_type by id from db: %v", err)
	}
	if len(fileTypes) < 1 {
		return nil, nil
	}
	return &fileTypes[0], nil
}
