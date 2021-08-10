FROM golang:1.15

ENV GOPATH /go
ENV GO111MODULE=on
ENV PORT=8080

WORKDIR $GOPATH/src/app

COPY controller/ ./controller
COPY model/ ./model
COPY go.* ./
COPY main.go ./
COPY .env ./

CMD ["/bin/bash", "-c", "go run main.go"]