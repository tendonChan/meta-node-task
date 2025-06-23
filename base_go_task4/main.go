package main

import (
	"blog/dao"
	"blog/middleware"
	"blog/models"
	"blog/router"
	"fmt"
	"github.com/sirupsen/logrus"
	"os"
)

const (
	PORT = 8080
)

func init() {
	os.Setenv("DB_USER", "root")
	os.Setenv("DB_PASS", "123456")
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "3306")
	os.Setenv("DB_NAME", "blog")

	os.Setenv("JWT_SECRET", "570d53873c6b0a192072586549ad774")
	os.Setenv("LOG_FILE", "logrus.log")
}

func main() {
	middleware.InitLogrus()
	err := dao.InitDB()
	if err != nil {
		return
	}

	err = dao.DB.AutoMigrate(models.Post{}, &models.Comment{}, &models.User{})
	if err != nil {
		logrus.Errorf("Error migrating database: %v", err)
		return
	}

	engine := router.SetRouter()
	// 在指定端口上启动web服务
	if err := engine.Run(fmt.Sprintf(":%d", PORT)); err != nil {
		logrus.Errorf("server startup failed, err:%v", err)
	}
}
