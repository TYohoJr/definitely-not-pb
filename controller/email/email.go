package email

import (
	"errors"
	"fmt"
	"net/smtp"
	"os"

	"defnotpb/controller/utility"
	"defnotpb/model"
)

type MailServer struct {
	DB *model.DB
}

func sendMail(subject string, body string, to string) error {
	from := os.Getenv("EMAIL_NAME")
	pass := os.Getenv("EMAIL_PASSWORD")
	msg := "From: " + from + "\n" +
		"To: " + to + "\n" +
		fmt.Sprintf("Subject: %s\n\n", subject) +
		body
	err := smtp.SendMail("smtp.gmail.com:587",
		smtp.PlainAuth("", from, pass, "smtp.gmail.com"),
		from, []string{to}, []byte(msg))
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}
	return nil
}

func (m *MailServer) Send2FACode(userID int) error {
	ai, err := m.DB.GetAccountInfoByUserID(userID)
	if err != nil {
		return fmt.Errorf("failed to retrieve account info: %v", err)
	}
	if ai == nil {
		return errors.New("failed to retrieve account info for user")
	}
	if ai.Email == nil {
		return errors.New("no email found for account")
	}
	twofaCode := utility.GenerateNumCode(6)
	err = m.DB.UpdateAccountInfo2FACode(userID, twofaCode)
	if err != nil {
		return fmt.Errorf("failed to create 2FA code: %v", err)
	}
	body := fmt.Sprintf("Your 2FA Code is: %s\n\nThis code will expire in ten minutes", twofaCode)
	err = sendMail("Requested 2FA Code", body, *ai.Email)
	if err != nil {
		return fmt.Errorf("failed to send 2FA code: %v", err)
	}
	return nil
}
