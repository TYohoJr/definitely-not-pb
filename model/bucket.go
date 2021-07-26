package model

type Bucket struct {
	Name *string `db:"bucket_name" json:"bucket_name"`
}
