package model

import (
	"fmt"
)

type AccountType struct {
	ID   *int    `db:"id" json:"id"`
	Type *string `db:"type" json:"type"`
}

func (db *DB) GetAccountTypeByID(id int) (*AccountType, error) {
	acctTypes := []AccountType{}
	err := db.Select(&acctTypes,
		`SELECT *
		FROM account_type
		WHERE id=$1`, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get account_type by id from db: %v", err)
	}
	if len(acctTypes) < 1 {
		return nil, nil
	}
	return &acctTypes[0], nil
}

func (db *DB) GetAccountTypeByType(acctType string) (*AccountType, error) {
	acctTypes := []AccountType{}
	err := db.Select(&acctTypes,
		`SELECT *
		FROM account_type
		WHERE type=$1`, acctType)
	if err != nil {
		return nil, fmt.Errorf("failed to get account_type by type from db: %v", err)
	}
	if len(acctTypes) < 1 {
		return nil, nil
	}
	return &acctTypes[0], nil
}
