package model

type AppUser struct {
	ID                   *int    `db:"id" json:"id"`
	FirstName            *string `db:"first_name" json:"first_name"`
	LastName             *string `db:"last_name" json:"last_name"`
	Username             *string `db:"username" json:"username"`
	SecretQuestionID     *int    `db:"secret_question_id" json:"-"`
	SecretQuestionAnswer *string `db:"secret_question_answer" json:"-"`
	PasswordHash         *int    `db:"password_hash" json:"-"`
}
