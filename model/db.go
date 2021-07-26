package model

import (
	"github.com/jmoiron/sqlx"

	_ "github.com/lib/pq" //
)

type DB struct {
	*sqlx.DB
}

func EstablishDBConn(dataSourceName string) (*DB, error) {
	db, err := sqlx.Open("postgres", dataSourceName)
	if err != nil {
		return nil, err
	}
	if err = db.Ping(); err != nil {
		return nil, err
	}
	return &DB{db}, nil
}
