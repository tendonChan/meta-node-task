package object_oriented

import "fmt"

type Person struct {
	Name string
	Age  int
}

type Employee struct {
	EmployeeID int
	Person     Person
}

func (emp *Employee) PrintInfo() {
	fmt.Printf("employee id:%d \nemployee name:%s\nemployee age:%d", emp.EmployeeID, emp.Person.Name, emp.Person.Age)
}
