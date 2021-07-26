package main

import (
	"defnotpb/controller"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	godotenv.Load()
	// Create new server, initialize it, and start lsitening for client requests
	s := controller.NewServer()
	s.Initialize()
}
