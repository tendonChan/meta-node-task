package advancegorm

import (
	"fmt"
	"gorm.io/gorm"
	"time"
)

type User struct {
	gorm.Model
	Account  string `gorm:"unique"`
	NickName string `gorm:"not null"`
	PostNum  int
	Posts    []Post
}

type Post struct {
	gorm.Model
	Title         string `gorm:"size:255;unique"`
	Content       string `gorm:"not null"`
	UserID        uint
	PublishedTime time.Time
	CommentStatus string `gorm:"size:255"`
	Comments      []Comment
}

type Comment struct {
	gorm.Model
	Author  string `gorm:"not null"`
	Content string
	PostID  uint
}

func (p *Post) AfterCreate(tx *gorm.DB) (err error) {
	err = tx.Model(&User{}).Where("id =?", p.UserID).UpdateColumn("post_num", gorm.Expr("post_num + 1")).Error
	return
}

func (c *Comment) AfterDelete(tx *gorm.DB) (err error) {
	var count int64
	err = tx.Model(&Comment{}).Where("post_id = ?", c.PostID).Count(&count).Error
	if err != nil {
		return
	}
	if count == 0 {
		err = tx.Model(&Post{}).Where("id =?", c.PostID).UpdateColumn("comment_status", "无评论").Error
		if err != nil {
			return
		}
	}
	return
}

func InitData(db *gorm.DB) {

	var comment1, comment2, comment3 Comment
	comment1 = Comment{Author: "张三", Content: "Go这是不错的入门内容"}
	comment2 = Comment{Author: "李四", Content: "Go内容很好"}
	comment3 = Comment{Author: "aaa", Content: "C讲得很全面"}

	post1 := Post{Title: "Go 语言入门", Content: "Go详细内容", Comments: []Comment{comment1, comment2}}
	post2 := Post{Title: "C 语言进阶", Content: "C语言详细", Comments: []Comment{comment3}}

	user1 := User{Account: "tendon", NickName: "tendon", Posts: []Post{post1, post2}}
	user2 := User{Account: "cwy", NickName: "cwy"}
	db.Create(&user1)
	db.Create(&user2)
}

// 查询某个用户发布的所有文章及其对应的评论信息
func QueryPublishedPostAndCommentByUser(db *gorm.DB, account string) (user User, err error) {
	err = db.Preload("Posts.Comments").Model(&User{}).Where("account = ?", account).First(&user).Error
	return
}

// 查询评论数量最多的文章信息
func QueryMostComentsPost(db *gorm.DB) (post Post, count int, err error) {
	type Result struct {
		PostID       uint
		CommentCount int
	}
	var result Result
	err = db.Table("comments").Select("post_id,count(*) as comment_count").
		Group("post_id").Order("comment_count DESC").Limit(1).Scan(&result).Error
	if err != nil {
		err = fmt.Errorf("查询失败：%v", err)
		return
	}

	err = db.First(&post, result.PostID).Error
	if err != nil {
		err = fmt.Errorf("不能找到有最多评论的文章:%v", err)
		return
	}
	count = result.CommentCount
	return
}
