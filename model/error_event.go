package model

import (
	"fmt"
	"time"
)

type ErrorEvent struct {
	ID              *int       `db:"id" json:"id"`
	AppUserID       *int       `db:"app_user_id" json:"app_user_id"`
	ErrorMessage    *string    `db:"error_message" json:"error_message"`
	UserDescription *string    `db:"user_description" json:"user_description"`
	EventTimestamp  *time.Time `db:"event_timestamp" json:"event_timestamp"`
	IsResolved      *bool      `db:"is_resolved" json:"is_resolved"`
}

func (db *DB) CreateErrorEvent(e *ErrorEvent) error {
	nowTime := time.Now().UTC()
	e.EventTimestamp = &nowTime
	rows, err := db.NamedQuery(
		`INSERT INTO error_event(app_user_id, error_message, user_description, event_timestamp) 
		VALUES (:app_user_id, :error_message, :user_description, :event_timestamp)
		RETURNING id`, e)
	if err != nil {
		return fmt.Errorf("failed to insert error_event into db: %v", err)
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&e.ID)
	}
	return nil
}
