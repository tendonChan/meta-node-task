package channel

import (
	"fmt"
	"sync"
	"time"
)

func GenerateNum(ch chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	defer close(ch)
	for i := 1; i < 11; i++ {
		fmt.Println("generate num:", i)
		ch <- i
		fmt.Println("insert num to channel:", i)

		time.Sleep(10 * time.Millisecond)
	}
}

func ReceiveNum(num <-chan int, wg *sync.WaitGroup) {
	defer wg.Done()
	for n := range num {
		fmt.Println("receive num:", n)
		time.Sleep(500 * time.Millisecond)
	}
}
