package main

import (
	"fmt"
	"log"
	"os"

	"defnotpb/controller"
	"defnotpb/controller/auth"
	"defnotpb/model"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	err := auth.InitializeAuth()
	if err != nil {
		log.Fatal(err)
	}
	ds := fmt.Sprintf("port=%s host=%s user=%s password=%s dbname=%s sslmode=%s",
		os.Getenv("DB_PORT"), os.Getenv("DB_HOST"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"), os.Getenv("DB_SSL_MODE"))
	db, err := model.EstablishDBConn(ds)
	if err != nil {
		log.Fatal(err)
	}
	s := controller.NewServer(db)
	s.Initialize()
}
