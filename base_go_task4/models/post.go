package models

import (
	"blog/dao"
	"errors"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type Post struct {
	gorm.Model
	Title   string `gorm:"not null" binding:"required"`
	Content string `gorm:"not null" binding:"required"`
	UserID  uint
	User    User
}

func AddPost(post *Post) error {
	if err := dao.DB.Create(post).Error; err != nil {
		logrus.Errorf("fail to create post: %v", err)
		return errors.New("fail to create post")
	}
	return nil
}

func GetAllPost(posts *[]Post) error {
	if err := dao.DB.Find(posts).Error; err != nil {
		return errors.New("fail to get all posts")
	}
	return nil
}

func GetById(postId uint) (Post, error) {
	var post Post
	if err := dao.DB.First(&post, postId).Error; err != nil {
		return Post{}, errors.New("this post doesn't exist")
	}
	return post, nil
}

func ModifyPost(modifyPost *Post) error {
	var existPost Post
	if err := dao.DB.First(&existPost, modifyPost.ID).Error; err != nil {
		return err
	}
	if existPost.UserID != modifyPost.UserID {
		return errors.New("this post doesn't exist")
	}

	existPost.Title = modifyPost.Title
	existPost.Content = modifyPost.Content

	if err := dao.DB.Updates(&existPost).Error; err != nil {
		return err
	}
	return nil
}

func DeletePost(delPost *Post) error {
	var post Post
	if err := dao.DB.First(&post, delPost.ID).Error; err != nil {
		return err
	}
	if post.UserID != delPost.UserID {
		return errors.New("you don't permit to delete this post")
	}
	if err := dao.DB.Delete(&post).Error; err != nil {
		return err
	}

	return nil
}
