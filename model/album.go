package model

type Album struct {
	ID        *int    `db:"id" json:"id"`
	Name      *string `db:"name" json:"name"`
	AppUserID *int    `db:"app_user_id" json:"app_user_id"`
}
