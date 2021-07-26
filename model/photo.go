package model

type Photo struct {
	ID          *int    `db:"id" json:"id"`
	Name        *string `db:"name" json:"name"`
	S3BucketID  *int    `db:"s3_bucket_id" json:"s3_bucket_id"`
	S3Key       *string `db:"s3_key" json:"s3_key"`
	Description *string `db:"description" json:"description"`
	FileType    *string `db:"file_type" json:"file_type"`
}
