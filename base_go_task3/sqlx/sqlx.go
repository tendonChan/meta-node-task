package sqlx

import (
	"github.com/jmoiron/sqlx"
)

type Employee struct {
	ID         int     `db:"id"`
	Name       string  `db:"name"`
	Department string  `db:"department"`
	Salary     float64 `db:"salary"`
}

type Book struct {
	ID     int     `db:"id"`
	Title  string  `db:"title"`
	Author string  `db:"author"`
	Price  float64 `db:"price"`
}

// 根据部门查询employee
func QueryByDepartment(db *sqlx.DB, deptName string) ([]Employee, error) {
	var techEmployees []Employee

	sql := "select * from employees where department = ?"
	err := db.Select(&techEmployees, sql, deptName)
	if err != nil {
		return nil, err
	}
	return techEmployees, nil
}

// 获取最高工资employee
func QueryHighestSalaryEmployee(db *sqlx.DB) (Employee, error) {
	var employee Employee
	sql := "select * from employees order by salary desc limit 1"
	err := db.Get(&employee, sql)
	if err != nil {
		return Employee{}, err
	}
	//fmt.Println("工资最高的员工:", employee)
	return employee, nil
}

// 查询价格大于 50 元的书籍
func GetBooks(db *sqlx.DB) ([]Book, error) {
	var books []Book
	sql := "select * from books where price > ?"
	err := db.Select(&books, sql, 50)
	if err != nil {
		return nil, err
	}
	return books, nil
}
