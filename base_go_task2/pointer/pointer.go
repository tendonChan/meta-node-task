package pointer

func PlusTen(num *int) {
	*num += 10
}

func DoubleValue(arrayPtr *[]int) {
	for i := range *arrayPtr {
		(*arrayPtr)[i] *= 2
	}
}
