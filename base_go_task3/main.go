package main

import (
	"base_go_task3/advancegorm"
	sqlx2 "base_go_task3/sqlx"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func initDb() (db *gorm.DB, err error) {
	dsn := "root:123456@tcp(127.0.0.1:3306)/gorm?charset=utf8mb4&parseTime=True&loc=Local"
	db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	return
}

func initSqlxDb() (*sqlx.DB, error) {
	db, err := sqlx.Connect("mysql", "root:123456@tcp(localhost:3306)/blog?parseTime=true")
	return db, err
}

// Sqlx入门 -> 使用SQL扩展库进行查询
func sqlx1Test() {
	db, err := initSqlxDb()
	if err != nil {
		fmt.Println("数据库连接失败:", err)
		return
	}
	defer func(db *sqlx.DB) {
		err := db.Close()
		if err != nil {
			return
		}
	}(db)
	//获取技术部Employee
	dept := "技术部"
	techEmployees, err := sqlx2.QueryByDepartment(db, dept)
	if err != nil {
		fmt.Println("查询失败:", err)
		return
	}
	fmt.Println("技术部员工：", techEmployees)

	//获取最高工资Employee
	var employee sqlx2.Employee
	employee, err = sqlx2.QueryHighestSalaryEmployee(db)
	if err != nil {
		fmt.Println("查询失败:", err)
		return
	}
	fmt.Println("工资最高的员工:", employee)
}

// Sqlx入门 -> 实现类型安全映射
func sqlx2Test() {
	db, err := initSqlxDb()
	if err != nil {
		fmt.Println("数据库连接失败: ", err)
		return
	}
	defer func(db *sqlx.DB) {
		err := db.Close()
		if err != nil {
			return
		}
	}(db)

	books, err := sqlx2.GetBooks(db)
	if err != nil {
		fmt.Println("查询失败:", err)
		return
	}
	fmt.Println("价格大于 50 元的书籍:", books)
}

// 进阶gorm -> 题目2：关联查询
func gorm2Test() {
	//连接数据库
	db, err := initDb()
	if err != nil {
		fmt.Println("连接数据库失败")
		return
	}

	//初始化数据
	//advancegorm.InitData(db)

	//查询某个用户发布的所有文章及其对应的评论信息
	account := "tendon"
	user, err := advancegorm.QueryPublishedPostAndCommentByUser(db, account)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Printf("查询用户：%s\n", account)
	for _, post := range user.Posts {
		fmt.Printf("文章标题：%s,评论数量：%d\n", post.Title, len(post.Comments))
		for _, comment := range post.Comments {
			fmt.Printf("评论内容：%s\n", comment.Content)
		}
	}

	//查询评论数量最多的文章信息
	var post advancegorm.Post
	var count int
	post, count, err = advancegorm.QueryMostComentsPost(db)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Printf("评论最多的文章: %s (评论数: %d)\n", post.Title, count)
}

// 进阶gorm -> 题目3：钩子函数
func gorm3Test() {
	//连接数据库
	db, err := initDb()
	if err != nil {
		fmt.Println("连接数据库失败")
		return
	}

	newUserName := "metaNode4"

	//为 Post 模型添加一个钩子函数，在文章创建时自动更新用户的文章数量统计字段。
	var user advancegorm.User
	var primaryPostNum, newPostNum int

	user = advancegorm.User{Account: newUserName, NickName: newUserName}
	db.Create(&user)
	db.First(&user, "account = ?", newUserName)
	primaryPostNum = user.PostNum

	commentAdded := advancegorm.Comment{Author: "ccc", Content: "Ai内容不错"}
	commentAdded2 := advancegorm.Comment{Author: "jack", Content: "Ai内容很详细"}
	postAdded := advancegorm.Post{Title: "AI内容4", Content: "AI人工智能内容", UserID: user.ID, Comments: []advancegorm.Comment{commentAdded, commentAdded2}}

	db.Create(&postAdded)

	db.First(&user, "account = ?", newUserName)
	newPostNum = user.PostNum
	fmt.Printf("创建前文章数量：%d,创建后文章数量：%d\n", primaryPostNum, newPostNum)

	//为 Comment 模型添加一个钩子函数，在评论删除时检查文章的评论数量，如果评论数量为 0，则更新文章的评论状态为 "无评论"。
	var u advancegorm.User
	err = db.Preload("Posts.Comments").First(&u, "account = ?", newUserName).Error
	if err != nil {
		fmt.Println(err)
		return
	}
	post := u.Posts[0]
	fmt.Printf("文章标题：%s,评论数量：%d,评论状态(未删除)：%s\n", post.Title, len(post.Comments), post.CommentStatus)
	for _, comment := range post.Comments {
		db.Delete(&comment)
		var tempPost advancegorm.Post
		db.Preload("Comments").First(&tempPost, post.ID)
		fmt.Printf("删除一条记录后 --> 文章标题：%s,评论数量：%d,评论状态(已删除)：%s\n", tempPost.Title, len(tempPost.Comments), tempPost.CommentStatus)
	}
}

// 进阶gorm -> 题1：模型定义
func gorm1Test() {
	//连接数据库
	db, err := initDb()
	if err != nil {
		fmt.Println("连接数据库失败")
		return
	}

	//使用Gorm创建这些模型对应的数据库表
	err = db.AutoMigrate(&advancegorm.User{}, &advancegorm.Post{}, &advancegorm.Comment{})
	if err != nil {
		fmt.Println("迁移失败")
		return
	}

}

func main() {
	//基本CRUD操作  地址：sqlbase/crud.sql,sqlbase/transaction.sql

	//Sqlx入门 -> 使用SQL扩展库进行查询
	//sqlx1Test()
	//Sqlx入门 -> 实现类型安全映射
	//sqlx2Test()
	//进阶gorm -> 题目1：模型定义
	//gorm1Test()
	//进阶gorm -> 题目2：关联查询
	gorm2Test()
	//进阶gorm -> 题目3：钩子函数
	//gorm3Test()
}
