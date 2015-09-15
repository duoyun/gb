package tests

import (
	"testing"
	"github.com/duoyun/zhujian/app/db"
//	. "github.com/duoyun/zhujian/app/lea"
//	"github.com/duoyun/zhujian/app/service"
//	"gopkg.in/mgo.v2"
//	"fmt"
)

func TestDBConnect(t *testing.T) {
    db.Init("mongodb://localhost:27017/leanote", "leanote")
}