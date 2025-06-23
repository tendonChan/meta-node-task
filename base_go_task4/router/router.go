package router

import (
	"blog/controller"
	"blog/middleware"
	"github.com/gin-gonic/gin"
)

func SetRouter() *gin.Engine {
	router := gin.New()
	router.Use(middleware.CommonFailureResponse)
	router.Use(middleware.Logger)
	{
		userGroup := router.Group("/user")
		userGroup.POST("login", controller.Login)
		userGroup.POST("register", controller.RegisterUser)
	}
	{
		postGroup := router.Group("/post")
		postGroup.POST("add", middleware.Auth, controller.AddPost)
		postGroup.GET("all", controller.GetAllPost)
		postGroup.GET(":id", controller.GetById)
		postGroup.PUT("/modify", middleware.Auth, controller.ModifyPost)
		postGroup.DELETE(":id", middleware.Auth, controller.DeletePost)
	}
	{
		commentGroup := router.Group("/comment")
		commentGroup.POST("add", middleware.Auth, controller.AddComment)
		commentGroup.GET("/getComments/:postId", controller.GetCommentsByPostID)
	}
	return router
}
