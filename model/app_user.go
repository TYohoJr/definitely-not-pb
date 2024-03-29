package model

import (
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

type AppUser struct {
	ID                   *int    `db:"id" json:"id"`
	Username             *string `db:"username" json:"username"`
	Password             *string `db:"password" json:"password"`
	SecretQuestionID     *int    `db:"secret_question_id" json:"secret_question_id"`
	SecretQuestionAnswer *string `db:"secret_question_answer" json:"secret_question_answer"`
	PasswordHash         *string `db:"password_hash" json:"-"`
	IsPasswordExpired    *bool   `db:"is_password_expired" json:"-"`
}

func (u *AppUser) VerifyPassword(password string) error {
	if u.PasswordHash == nil {
		return errors.New("failed to retrieve password hash from database")
	}
	return bcrypt.CompareHashAndPassword([]byte(*u.PasswordHash), []byte(password))
}

func (u *AppUser) VerifySecretQuestionAnswer(secretQuestionAns string) error {
	if u.PasswordHash == nil {
		return errors.New("failed to retrieve secret question answer hash from database")
	}
	return bcrypt.CompareHashAndPassword([]byte(*u.SecretQuestionAnswer), []byte(secretQuestionAns))
}

func (u *AppUser) Hash(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
}

func (db *DB) GetAppUsersByUsername(username string) ([]AppUser, error) {
	users := []AppUser{}
	err := db.Select(&users,
		`SELECT *
		FROM app_user
		WHERE username=$1`, username)
	if err != nil {
		return nil, fmt.Errorf("failed to get app_user by username from db: %v", err)
	}
	return users, nil
}

func (db *DB) GetAppUserByUsername(username string) (*AppUser, error) {
	users := []AppUser{}
	err := db.Select(&users,
		`SELECT *
		FROM app_user
		WHERE username=$1`, username)
	if err != nil {
		return nil, fmt.Errorf("failed to get app_user by username from db: %v", err)
	}
	if len(users) < 1 {
		return nil, nil
	}
	return &users[0], nil
}

func (db *DB) GetAppUserByID(userID int) (*AppUser, error) {
	users := []AppUser{}
	err := db.Select(&users,
		`SELECT *
		FROM app_user
		WHERE id=$1`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get app_user by id from db: %v", err)
	}
	if len(users) < 1 {
		return nil, nil
	}
	return &users[0], nil
}

func (db *DB) CreateUser(u *AppUser) error {
	if u.Password == nil {
		return errors.New("failed to retrieve password hash from database")
	}
	if u.SecretQuestionAnswer == nil {
		return errors.New("failed to retrieve secret question answer hash from database")
	}
	hashedPassword, err := u.Hash(*u.Password)
	if err != nil {
		return err
	}
	p := string(hashedPassword)
	u.PasswordHash = &p
	hashedSQAnswer, err := u.Hash(*u.SecretQuestionAnswer)
	if err != nil {
		return err
	}
	sq := string(hashedSQAnswer)
	u.SecretQuestionAnswer = &sq
	rows, err := db.NamedQuery(
		`INSERT INTO app_user(username, secret_question_id, secret_question_answer, password_hash) 
		VALUES (:username, :secret_question_id, :secret_question_answer, :password_hash)
		RETURNING id`, u)
	if err != nil {
		return fmt.Errorf("failed to insert into app_user: %v", err)
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&u.ID)
	}
	return nil
}

func (db *DB) DeleteAccount(userID int) error {
	_, err := db.Exec(
		`DELETE
		FROM app_user
		WHERE id=$1`, userID)
	if err != nil {
		return fmt.Errorf("failed to delete all account info from db by app_user_id: %v", err)
	}
	return nil
}

func (db *DB) UpdateAppUserPassword(u AppUser) error {
	if u.Password == nil {
		return errors.New("failed to retrieve password hash from database")
	}
	hashedPassword, err := u.Hash(*u.Password)
	if err != nil {
		return err
	}
	p := string(hashedPassword)
	u.PasswordHash = &p
	_, err = db.NamedQuery(
		`UPDATE app_user
		SET password_hash=:password_hash
		WHERE id=:id`, u)
	if err != nil {
		return fmt.Errorf("failed to update app_user in db: %v", err)
	}
	return nil
}
