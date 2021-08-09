package model

import (
	"fmt"
	"time"
)

type AccountDataUsage struct {
	ID             *int    `db:"id" json:"id"`
	AccountInfoID  *int    `db:"account_info_id" json:"account_info_id"`
	Month          *string `db:"month" json:"month"`
	UploadAmount   *int64  `db:"upload_amount" json:"upload_amount"`
	DownloadAmount *int64  `db:"download_amount" json:"download_amount"`
}

// Need to include account_info_id
func (db *DB) CreateAccountDataUsageForCurrentMonth(ad *AccountDataUsage) error {
	month := time.Now().UTC().Month().String()
	ad.Month = &month
	rows, err := db.NamedQuery(
		`INSERT INTO account_data_usage(account_info_id, month) 
		VALUES (:account_info_id, :month)
		RETURNING id, upload_amount, download_amount`, ad)
	if err != nil {
		return fmt.Errorf("failed to insert into account_data_usage: %v", err)
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&ad.ID, &ad.UploadAmount, &ad.DownloadAmount)
	}
	return nil
}

// Need to include account_info_id
func (db *DB) GetAccountDataUsageByAccountInfoIDAndCurrentMonth(accountID int) (*AccountDataUsage, error) {
	month := time.Now().UTC().Month().String()
	acctUsages := []AccountDataUsage{}
	err := db.Select(&acctUsages,
		`SELECT *
		FROM account_data_usage
		WHERE account_info_id=$1 AND month=$2`, accountID, month)
	if err != nil {
		return nil, fmt.Errorf("failed to get account_data_usage by account_info_id and month from db: %v", err)
	}
	if len(acctUsages) < 1 {
		return nil, nil
	}
	return &acctUsages[0], nil
}

func (db *DB) UpdateAccountDataUsageDownloadByID(id int, amt int64) error {
	_, err := db.Exec(
		`UPDATE account_data_usage
		SET download_amount=$2
		WHERE id=$1`, id, amt)
	if err != nil {
		return fmt.Errorf("failed to update account_info in db: %v", err)
	}
	return nil
}

func (db *DB) UpdateAccountDataUsageUploadByID(id int, amt int64) error {
	_, err := db.Exec(
		`UPDATE account_data_usage
		SET upload_amount=$2
		WHERE id=$1`, id, amt)
	if err != nil {
		return fmt.Errorf("failed to update account_info in db: %v", err)
	}
	return nil
}
