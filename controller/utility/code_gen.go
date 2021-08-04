package utility

import (
	"math/rand"
	"time"
)

var letterRunes = []rune("0123456789")

func GenerateNumCode(codeLen int) string {
	rand.Seed(time.Now().UnixNano())
	b := make([]rune, codeLen)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}
