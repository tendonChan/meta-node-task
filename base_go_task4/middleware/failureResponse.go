package middleware

import (
	"blog/utils"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/locales/en"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	en_trans "github.com/go-playground/validator/v10/translations/en"
)

var Trans ut.Translator

func CommonFailureResponse(c *gin.Context) {
	c.Next()
	if len(c.Errors) == 0 {
		return
	}
	err := c.Errors.Last().Err
	var errs validator.ValidationErrors
	isValidation := errors.As(err, &errs)
	if isValidation {
		errMap := make(map[string]string)
		//
		for _, e := range errs {
			errMap[e.Field()] = e.Translate(Trans)
			utils.Failure(c, errMap[e.Field()])
			return
		}
	} else {
		utils.Failure(c, err.Error())
	}
}

func init() {
	// 获取Gin的验证器实例
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		// 创建翻译器
		en := en.New()
		uni := ut.New(en, en)
		Trans, _ = uni.GetTranslator("en")

		// 注册默认翻译
		_ = en_trans.RegisterDefaultTranslations(v, Trans)

		// 自定义 required 翻译
		_ = v.RegisterTranslation("required", Trans, func(ut ut.Translator) error {
			return ut.Add("required", "{0} is required.", true)
		}, func(ut ut.Translator, fe validator.FieldError) string {
			// 获取字段名称
			fieldName := fe.Field()
			t, _ := ut.T("required", fieldName)
			return t
		})

		// 自定义 email 翻译
		_ = v.RegisterTranslation("email", Trans, func(ut ut.Translator) error {
			return ut.Add("email", "{0} format is incorrect.", true)
		}, func(ut ut.Translator, fe validator.FieldError) string {
			fieldName := fe.Field()
			t, _ := ut.T("email", fieldName)
			return t
		})
	}
}
