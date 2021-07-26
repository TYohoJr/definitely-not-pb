package main

import (
	"defnotpb/controller"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	s := controller.NewServer()
	s.Initialize()
}
