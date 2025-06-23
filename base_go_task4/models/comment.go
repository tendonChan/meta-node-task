package models

import (
	"blog/dao"
	"gorm.io/gorm"
)

type Comment struct {
	gorm.Model
	Content string `gorm:"not null"`
	UserID  uint
	User    User
	PostID  uint
	Post    Post
}

func AddComment(comment *Comment) error {
	var post Post
	if err := dao.DB.First(&post).Error; err != nil {
		return err
	}

	if err := dao.DB.Create(&comment).Error; err != nil {
		return err
	}
	return nil
}

func GetCommentsByPostID(postId uint) (*[]Comment, error) {
	var post Post
	if err := dao.DB.First(&post, postId).Error; err != nil {
		return nil, err
	}
	var comments []Comment
	if err := dao.DB.Find(&comments, "post_id = ?", postId).Error; err != nil {
		return nil, err
	}

	return &comments, nil
}
