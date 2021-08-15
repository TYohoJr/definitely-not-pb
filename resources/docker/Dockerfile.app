FROM golang:1.15

ENV GOPATH /go
ENV GO111MODULE=on
ENV PORT=8080

WORKDIR $GOPATH/src/app

COPY def_not_pb ./

RUN chmod +x def_not_pb