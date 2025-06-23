package utils

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type ResponseMessage struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

const (
	SuccessCode = 200
	ErrorCode   = 9998
)

const (
	SuccessMessage = "success"
	ErrorMessage   = "error"
)

func Success(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, ResponseMessage{
		Code:    SuccessCode,
		Message: SuccessMessage,
	})
}

func SuccessWithData(ctx *gin.Context, data interface{}) {
	ctx.JSON(http.StatusOK, ResponseMessage{
		Code:    SuccessCode,
		Message: SuccessMessage,
		Data:    data,
	})
}

func SuccessWithMsg(ctx *gin.Context, msg string, data interface{}) {
	ctx.JSON(http.StatusOK, ResponseMessage{
		Code:    SuccessCode,
		Message: msg,
		Data:    data,
	})
}

func Failure(ctx *gin.Context, msg string) {
	ctx.JSON(http.StatusOK, ResponseMessage{
		Code:    ErrorCode,
		Message: msg,
	})
}
