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

func (db *DB) GetSecretQuestionByID(id int) (*SecretQuestion, error) {
	secQuests := []SecretQuestion{}
	err := db.Select(&secQuests,
		`SELECT *
		FROM secret_question
		WHERE id=$1`, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get secret_question by id from db: %v", err)
	}
	if len(secQuests) < 1 {
		return nil, nil
	}
	return &secQuests[0], nil
}
