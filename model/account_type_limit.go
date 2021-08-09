package model

import (
	"fmt"
)

type AccountTypeLimit struct {
	ID            *int   `db:"id" json:"id"`
	AccountTypeID *int   `db:"account_type_id" json:"account_type_id"`
	UploadLimit   *int64 `db:"monthly_upload_byte_limit" json:"monthly_upload_byte_limit"`
	DownloadLimit *int64 `db:"monthly_download_byte_limit" json:"monthly_download_byte_limit"`
}

func (db *DB) GetAccountTypeLimitByTypeID(typeID int) (*AccountTypeLimit, error) {
	acctLimits := []AccountTypeLimit{}
	err := db.Select(&acctLimits,
		`SELECT *
		FROM account_type_limit
		WHERE account_type_id=$1`, typeID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account_type_limit by account_type_id from db: %v", err)
	}
	if len(acctLimits) < 1 {
		return nil, nil
	}
	return &acctLimits[0], nil
}
