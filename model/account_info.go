package model

import (
	"fmt"
	"time"
)

type AccountInfo struct {
	ID                  *int       `db:"id" json:"id"`
	AppUserID           *int       `db:"app_user_id" json:"app_user_id"`
	Email               *string    `db:"email" json:"email"`
	IsEmailConfirmed    *bool      `db:"is_email_confirmed" json:"is_email_confirmed"`
	UseDarkMode         *bool      `db:"use_dark_mode" json:"use_dark_mode"`
	AccountTypeID       *int       `db:"account_type_id" json:"account_type_id"`
	TwoFACode           *string    `db:"twofa_code" json:"twofa_code"`
	TwoFACodeExpiration *time.Time `db:"twofa_code_expiration" json:"twofa_code_expiration"`
	CreatedTimestamp    *time.Time `db:"created_timestamp" json:"created_timestamp"`
}

func (db *DB) CreateAccountInfo(ai *AccountInfo) error {
	now := time.Now().UTC()
	ai.CreatedTimestamp = &now
	rows, err := db.NamedQuery(
		`INSERT INTO account_info(app_user_id, account_type_id, created_timestamp) 
		VALUES (:app_user_id, :account_type_id, :created_timestamp)
		RETURNING id`, ai)
	if err != nil {
		return fmt.Errorf("failed to insert into app_user: %v", err)
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&ai.ID)
	}
	return nil
}

func (db *DB) GetAccountInfoByUserID(userID int) (*AccountInfo, error) {
	accts := []AccountInfo{}
	err := db.Select(&accts,
		`SELECT *
		FROM account_info
		WHERE app_user_id=$1`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account_info by app_user_id from db: %v", err)
	}
	if len(accts) < 1 {
		return nil, nil
	}
	return &accts[0], nil
}

func (db *DB) GetAccountInfoByUserEmail(email string) (*AccountInfo, error) {
	accts := []AccountInfo{}
	err := db.Select(&accts,
		`SELECT *
		FROM account_info
		WHERE email=$1`, email)
	if err != nil {
		return nil, fmt.Errorf("failed to get account_info by email from db: %v", err)
	}
	if len(accts) < 1 {
		return nil, nil
	}
	return &accts[0], nil
}

func (db *DB) UpdateAccountInfo(ai AccountInfo) error {
	_, err := db.NamedQuery(
		`UPDATE account_info
		SET email=:email, is_email_confirmed=:is_email_confirmed, account_type_id=:account_type_id
		WHERE app_user_id=:app_user_id`, ai)
	if err != nil {
		return fmt.Errorf("failed to update account_info in db: %v", err)
	}
	return nil
}

func (db *DB) UpdateAccountInfo2FACode(userID int, twofaCode string) error {
	now := time.Now().UTC()
	expiration := now.Add(time.Minute * 10)
	_, err := db.Exec(
		`UPDATE account_info
		SET twofa_code=$2, twofa_code_expiration=$3
		WHERE app_user_id=$1`, userID, twofaCode, expiration)
	if err != nil {
		return fmt.Errorf("failed to update account_info in db: %v", err)
	}
	return nil
}

func (db *DB) UpdateAccountInfoConfirmed(userID int, acctType int) error {
	trueVal := true
	_, err := db.Exec(
		`UPDATE account_info
		SET is_email_confirmed=$2, account_type_id=$3
		WHERE app_user_id=$1`, userID, trueVal, acctType)
	if err != nil {
		return fmt.Errorf("failed to update account_info in db: %v", err)
	}
	return nil
}

func (db *DB) UpdateAccountInfoDarkMode(userID int, useDM bool) error {
	_, err := db.Exec(
		`UPDATE account_info
		SET use_dark_mode=$2
		WHERE app_user_id=$1`, userID, useDM)
	if err != nil {
		return fmt.Errorf("failed to update account_info in db: %v", err)
	}
	return nil
}
