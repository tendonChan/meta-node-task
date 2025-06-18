package channel

import (
	"fmt"
	"sync"
	"time"
)

func Producer(ch chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	defer close(ch)
	fmt.Println("Producer start")
	for i := 1; i < 101; i++ {
		fmt.Println("produce num:", i)
		ch <- i
		fmt.Println("insert num to channel:", i)

		time.Sleep(time.Millisecond * 50)
	}
}

func Consumer(ch <-chan int, wg *sync.WaitGroup) {
	defer wg.Done()

	fmt.Println("Consumer start")
	for num := range ch {
		fmt.Println("consume num:", num)
		time.Sleep(time.Millisecond * 200)
	}
}
