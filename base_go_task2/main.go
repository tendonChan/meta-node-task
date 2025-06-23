package main

import (
	"base_go_task2/channel"
	"base_go_task2/goroutine"
	"base_go_task2/object_oriented"
	"base_go_task2/pointer"
	"fmt"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"
)

func successTask1() error {
	delay := time.Duration(rand.Intn(500)+300) * time.Millisecond
	time.Sleep(delay)
	return nil
}

func successTask2() error {
	delay := time.Duration(rand.Intn(800)+500) * time.Millisecond
	time.Sleep(delay)
	return nil
}

func failingTask() error {
	delay := time.Duration(rand.Intn(300)+100) * time.Millisecond
	time.Sleep(delay)
	return fmt.Errorf("任务执行失败")
}

func panickingTask() error {
	delay := time.Duration(rand.Intn(400)+200) * time.Millisecond
	time.Sleep(delay)
	panic("意外错误发生!")
}

func pointer1Test() {
	num := 21
	pointer.PlusTen(&num)
	fmt.Println("new num value:", num)
}

func pointer2Test() {
	nums := []int{1, 2, 3, 4}
	fmt.Println("primary values:", nums)
	pointer.DoubleValue(&nums)
	fmt.Println("modified values:", nums)
}

func goroutine1Test() {
	go goroutine.PrintOddNumber()
	go goroutine.PrintEvenNumber()
	time.Sleep(3 * time.Second)
}

func goroutine2Test() {
	scheduler := goroutine.NewScheduler()
	scheduler.Add(successTask1)
	scheduler.Add(successTask2)
	scheduler.Add(failingTask)
	scheduler.Add(panickingTask)
	scheduler.Add(func() error {
		time.Sleep(1200 * time.Millisecond)
		return nil
	})
	scheduler.Add(func() error {
		time.Sleep(600 * time.Millisecond)
		return nil
	})

	result := scheduler.Run()
	successCount, failCount := 0, 0
	for _, res := range result {
		if res.Err != nil {
			fmt.Printf("任务 %d 失败: %v\n", res.ID, res.Err)
			failCount++
		} else {
			successCount++
		}
	}

	fmt.Printf("最终统计：%d 成功,%d 失败", successCount, failCount)
}

func objectOriented1Test() {
	rectangle := &object_oriented.Rectangle{100.0, 50.0}
	circle := &object_oriented.Circle{60.0}

	fmt.Printf("rectangle area: %f\n", rectangle.Area())
	fmt.Printf("rectangle perimeter: %f\n", rectangle.Perimeter())
	fmt.Printf("circle area: %f\n", circle.Area())
	fmt.Printf("circle perimeter: %f\n", circle.Perimeter())
}

func objectOriented2Test() {
	employee := object_oriented.Employee{EmployeeID: 12, Person: object_oriented.Person{Name: "Alice", Age: 20}}
	employee.PrintInfo()
}

func channel1Test() {
	ch := make(chan int, 3)
	var wg sync.WaitGroup
	wg.Add(2)
	go channel.GenerateNum(ch, &wg)
	go channel.ReceiveNum(ch, &wg)

	wg.Wait()
}

func channel2Test() {
	ch := make(chan int, 10)
	var wg sync.WaitGroup
	wg.Add(2)

	go channel.Producer(ch, &wg)
	go channel.Consumer(ch, &wg)

	wg.Wait()
}

func mutex1Test() {
	var mu sync.Mutex
	var wg sync.WaitGroup
	counter := 0
	wg.Add(10)
	for i := 0; i < 10; i++ {
		go func() {
			defer wg.Done()
			for j := 0; j < 1000; j++ {
				mu.Lock()
				counter++
				mu.Unlock()
			}
		}()
	}
	wg.Wait()
	fmt.Println("counter:", counter)
}

func mutex2Test() {
	var counter int32
	var wg sync.WaitGroup
	wg.Add(10)

	for i := 0; i < 10; i++ {
		go func() {
			defer wg.Done()
			for j := 0; j < 1000; j++ {
				atomic.AddInt32(&counter, 1)
			}
		}()
	}

	wg.Wait()
	fmt.Println(counter)
}

func main() {
	//指针 -> 1题：编写一个Go程序，定义一个函数，该函数接收一个整数指针作为参数，在函数内部将该指针指向的值增加10，然后在主函数中调用该函数并输出修改后的值。
	//pointer1Test()
	//////指针 -> 2题：实现一个函数，接收一个整数切片的指针，将切片中的每个元素乘以2。
	//pointer2Test()

	////Goroutine -> 1题：编写一个程序，使用 go 关键字启动两个协程，一个协程打印从1到10的奇数，另一个协程打印从2到10的偶数。
	//goroutine1Test()
	//Goroutine -> 2题:设计一个任务调度器，接收一组任务（可以用函数表示），并使用协程并发执行这些任务，同时统计每个任务的执行时间。
	//goroutine2Test()

	// 面向对象 -> 1题： 定义一个 Shape 接口，包含 Area() 和 Perimeter() 两个方法。然后创建 Rectangle 和 Circle 结构体，实现 Shape 接口。在主函数中，创建这两个结构体的实例，并调用它们的 Area() 和 Perimeter() 方法
	//objectOriented1Test()
	// 面向对象-> 2题：使用组合的方式创建一个 Person 结构体，包含 Name 和 Age 字段，再创建一个 Employee 结构体，组合 Person 结构体并添加 EmployeeID 字段。为 Employee 结构体实现一个 PrintInfo() 方法，输出员工的信息。
	//objectOriented2Test()

	// channel -> 题1：编写一个程序，使用通道实现两个协程之间的通信。一个协程生成从1到10的整数，并将这些整数发送到通道中，另一个协程从通道中接收这些整数并打印出来。
	//channel1Test()
	// channel -> 题2：实现一个带有缓冲的通道，生产者协程向通道中发送100个整数，消费者协程从通道中接收这些整数并打印。
	//channel2Test()

	// 锁-> 题1：编写一个程序，使用 sync.Mutex 来保护一个共享的计数器。启动10个协程，每个协程对计数器进行1000次递增操作，最后输出计数器的值
	//mutex1Test()

	// 锁 ->题2：使用原子操作（ sync/atomic 包）实现一个无锁的计数器。启动10个协程，每个协程对计数器进行1000次递增操作，最后输出计数器的值。
	mutex2Test()
}
