package goroutine

import (
	"fmt"
)

func PrintOddNumber() {
	for i := 1; i < 11; i++ {
		if i%2 != 0 {
			fmt.Println("odd number:", i)
		}
	}
}

func PrintEvenNumber() {
	for i := 1; i < 11; i++ {
		if i%2 == 0 {
			fmt.Println("even number:", i)
		}
	}
}
