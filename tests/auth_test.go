package tests

import (
	"testing"
	"github.com/duoyun/zhujian/app/db"
//	. "github.com/duoyun/zhujian/app/lea"
	"github.com/duoyun/zhujian/app/service"
//	"gopkg.in/mgo.v2"
//	"fmt"
)

func init() {
	db.Init("mongodb://localhost:27017/leanote", "leanote")
	service.InitService()
}

// 测试登录
func TestAuth(t *testing.T) {
	_, err := service.AuthS.Login("admin", "abc123")
	if err != nil {
		t.Error("Admin User Auth Error")
	}
}