package controller

import (
	"blog/models"
	"blog/utils"
	"blog/vo"
	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"os"
	"time"
)

// RegisterUser 用户注册
func RegisterUser(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		_ = c.Error(err)
		return
	}

	err := models.RegisterUser(&user)
	if err != nil {
		utils.Failure(c, err.Error())
		return
	}
	utils.Success(c)
}

// Login 用户登录
func Login(c *gin.Context) {
	var paramUser vo.ParamUser
	if err := c.ShouldBindJSON(&paramUser); err != nil {
		_ = c.Error(err)
		return
	}

	storedUser, err := models.Login(&paramUser)
	if err != nil {
		utils.Failure(c, err.Error())
		return
	}

	// 生成 JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":       storedUser.ID,
		"username": storedUser.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		logrus.Errorf("Failed to generate token: %v", err)
		utils.Failure(c, "Failed to generate token")
		return
	}

	utils.SuccessWithData(c, map[string]interface{}{
		"token":    tokenString,
		"username": storedUser.Username,
		"email":    storedUser.Email,
	})
}
