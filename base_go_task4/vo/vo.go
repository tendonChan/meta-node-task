package vo

type ParamUser struct {
	Username string `binding:"required"`
	Password string `binding:"required"`
}

type ParamPost struct {
	Title   string `binding:"required"`
	Content string `binding:"required"`
	UserID  string
}

type ParamUpdatePost struct {
	ParamPost
	ID uint `binding:"required"`
}

type ParamComment struct {
	PostID  uint   `binding:"required"`
	Content string `binding:"required"`
}
