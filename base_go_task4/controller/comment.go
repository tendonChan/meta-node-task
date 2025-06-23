package controller

import (
	"blog/models"
	"blog/utils"
	"blog/vo"
	"fmt"
	"github.com/gin-gonic/gin"
	"strconv"
)

func AddComment(c *gin.Context) {
	var paramComment vo.ParamComment
	if err := c.ShouldBindJSON(&paramComment); err != nil {
		_ = c.Error(err)
		return
	}

	comment := models.Comment{
		UserID:  uint(c.MustGet("userID").(float64)),
		PostID:  paramComment.PostID,
		Content: paramComment.Content,
	}
	if err := models.AddComment(&comment); err != nil {
		utils.Failure(c, err.Error())
		return
	}
	utils.Success(c)
}

func GetCommentsByPostID(c *gin.Context) {
	postID, err := strconv.ParseUint(c.Param("postId"), 10, 32)
	if err != nil {
		utils.Failure(c, fmt.Sprintf("fail to parse post id: %v", err))
		return
	}

	var comments *[]models.Comment
	if comments, err = models.GetCommentsByPostID(uint(postID)); err != nil {
		utils.Failure(c, err.Error())
		return
	}
	utils.SuccessWithData(c, comments)
}
