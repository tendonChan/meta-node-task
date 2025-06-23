package controller

import (
	"blog/models"
	"blog/utils"
	"blog/vo"
	"fmt"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"strconv"
)

func AddPost(c *gin.Context) {
	var post models.Post
	var paramPost vo.ParamPost
	if err := c.ShouldBindJSON(&paramPost); err != nil {
		_ = c.Error(err)
		return
	}

	post = models.Post{
		Title:   paramPost.Title,
		Content: paramPost.Content,
		UserID:  uint(c.MustGet("userID").(float64)),
	}

	err := models.AddPost(&post)
	if err != nil {
		utils.Failure(c, err.Error())
		return
	}

	utils.Success(c)
}

func GetAllPost(c *gin.Context) {
	var posts []models.Post
	err := models.GetAllPost(&posts)
	if err != nil {
		utils.Failure(c, err.Error())
		return
	}
	utils.SuccessWithData(c, posts)
}

func GetById(c *gin.Context) {
	var post models.Post
	var err error
	postId, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if post, err = models.GetById(uint(postId)); err != nil {
		utils.Failure(c, err.Error())
		return
	}

	utils.SuccessWithData(c, post)
}

func ModifyPost(c *gin.Context) {
	userID := uint(c.MustGet("userID").(float64))
	var paramPost vo.ParamUpdatePost
	if err := c.ShouldBindJSON(&paramPost); err != nil {
		_ = c.Error(err)
		return
	}

	modifyPost := models.Post{
		Model:   gorm.Model{ID: uint(paramPost.ID)},
		Title:   paramPost.Title,
		Content: paramPost.Content,
		UserID:  userID,
	}
	if err := models.ModifyPost(&modifyPost); err != nil {
		utils.Failure(c, err.Error())
		return
	}
	utils.Success(c)
}

func DeletePost(c *gin.Context) {
	userID := uint(c.MustGet("userID").(float64))

	postID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Failure(c, fmt.Sprintf("fail to parse post id: %v", err))
		return
	}

	delPost := models.Post{}
	delPost.ID = uint(postID)
	delPost.UserID = uint(userID)
	if err = models.DeletePost(&delPost); err != nil {
		utils.Failure(c, err.Error())
		return
	}
	utils.Success(c)
}
