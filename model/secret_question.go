package model

import "fmt"

type SecretQuestion struct {
	ID       *int    `db:"id" json:"id"`
	Question *string `db:"question" json:"question"`
}

func (db *DB) GetSecretQuestions() ([]SecretQuestion, error) {
	sqList := []SecretQuestion{}
	err := db.Select(&sqList,
		`SELECT *
		FROM secret_question`)
	if err != nil {
		return nil, fmt.Errorf("failed to get all secret questions from db: %v", err)
	}
	return sqList, nil
}
