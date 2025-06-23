package models

import (
	"blog/dao"
	"blog/vo"
	"errors"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username string `gorm:"unique;not null" binding:"required"`
	Password string `gorm:"not null"`
	Email    string `gorm:"unique;not null" binding:"email"`
}

// RegisterUser 用户注册
func RegisterUser(newUser *User) error {
	var existUser User
	err := dao.DB.First(&existUser, "username = ?", newUser.Username).Error
	if err == nil {
		return errors.New("user already exists")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newUser.Password), bcrypt.DefaultCost)
	if err != nil {
		logrus.Errorf("Fail to hash password: %v", err)
		return errors.New("fail to hash password")
	}
	newUser.Password = string(hashedPassword)

	if err := dao.DB.Create(&newUser).Error; err != nil {
		return err
	}

	return nil
}

// Login 用户登录
func Login(paramUser *vo.ParamUser) (User, error) {

	var storedUser User
	if err := dao.DB.First(&storedUser, "username = ?", paramUser.Username).Error; err != nil {
		return User{}, errors.New("invalid username or password")
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(storedUser.Password), []byte(paramUser.Password)); err != nil {
		return User{}, errors.New("invalid username or password")
	}
	return storedUser, nil
}
