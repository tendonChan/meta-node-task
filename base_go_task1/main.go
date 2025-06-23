package main

import (
	"fmt"
	"math"
	"sort"
	"strconv"
)

type Stack struct {
	elements []interface{}
}

func NewStack() *Stack {
	return &Stack{elements: make([]interface{}, 0)}
}

func (s *Stack) isEmpty() bool {
	return len(s.elements) == 0
}

func (s *Stack) size() int {
	return len(s.elements)
}

func (s *Stack) Push(v interface{}) {
	s.elements = append(s.elements, v)
}

func (s *Stack) Pop() interface{} {
	if s.isEmpty() {
		return nil
	}
	index := len(s.elements) - 1
	element := s.elements[index]
	s.elements = s.elements[:index]
	return element
}

func main() {
	//136. 只出现一次的数字
	singleNumber([]int{4, 1, 2, 1, 3, 4, 2, 3, 0})
	singleNumber([]int{1, 2, 3, 2, 1, 3, 5})

	//回文数
	//fmt.Println(isPalindrome(123))
	//fmt.Println(isPalindrome(-121))
	//fmt.Println(isPalindrome(1538351))
	//fmt.Println(isPalindrome(1234321))

	//有效的括号
	//fmt.Println(isEffectiveParentheses("{([])}([])"))
	//fmt.Println(isEffectiveParentheses("((])"))

	//最长公共前缀
	//fmt.Println(longestCommonPrefix([]string{"flower", "flow", "flight"}))
	//fmt.Println(longestCommonPrefix([]string{"dog", "racecar", "car"}))

	//删除排序数组中的重复项
	//nums := []int{0, 0, 1, 1, 1, 2, 2, 3, 3, 4}
	//fmt.Println("数组新长度：", removeDuplicates(nums))
	//fmt.Println(nums)
	//
	//nums2 := []int{1, 1, 2}
	//fmt.Println("数组新长度：", removeDuplicates(nums2))
	//fmt.Println(nums2)

	//加一
	//fmt.Println(plusOne([]int{1, 2, 3}))
	//fmt.Println(plusOne([]int{9, 9}))

	//26. 删除有序数组中的重复项
	//nums := []int{0, 0, 1, 1, 1, 2, 2, 3, 3, 4}
	//fmt.Println("数组新长度：", removeDuplicates2(nums))
	//fmt.Println(nums)
	//
	//nums2 := []int{1, 1, 2}
	//fmt.Println("数组新长度：", removeDuplicates2(nums2))
	//fmt.Println(nums2)

	//56. 合并区间
	//intervals := [][]int{{1, 3}, {8, 10}, {15, 18}, {2, 6}, {10, 23}}
	//fmt.Println(merge(intervals))
	//intervals2 := [][]int{{1, 4}, {4, 5}}
	//fmt.Println(merge(intervals2))

	//两数之和
	//fmt.Println(twoSum([]int{2, 7, 11, 15}, 9))
	//fmt.Println(twoSum([]int{3, 2, 4}, 6))
}

// 136. 只出现一次的数字
func singleNumber(array []int) {
	var myMap map[int]int = make(map[int]int)

	for i := 0; i < len(array); i++ {
		myMap[array[i]]++
	}

	for key, value := range myMap {
		if value == 1 {
			fmt.Println("the number that appears once is ", key)
			break
		}
	}
}

// 回文数
func isPalindrome(x int) bool {
	if x < 0 {
		return false
	}

	reversed := 0
	temp := x
	for temp != 0 {
		remained := temp % 10
		reversed = reversed*10 + remained
		temp /= 10
	}

	return x == reversed
}

// 有效的括号
func isEffectiveParentheses(strs string) bool {
	stack := NewStack()
	flag := true
	for i := 0; i < len(strs); i++ {
		temp := string(strs[i])
		if temp == "(" || temp == "[" || temp == "}" {
			stack.Push(temp)
			continue
		}

		prev := stack.Pop()
		if (temp == ")" && prev != "(") || (temp == "]" && prev != "[") || (temp == "}" && prev != "{") {
			flag = false
			break
		}
	}

	return flag
}

// 最长公共前缀
func longestCommonPrefix(strs []string) string {
	count := 0
	if len(strs) == 0 {
		return ""
	}
outer:
	for i := 0; i < len(strs[0]); i++ {
		letter := strs[0][i]
		for j := 1; j < len(strs); j++ {
			if i == len(strs[j]) || letter != strs[j][i] {
				break outer
			}
		}
		count++
	}
	return strs[0][:count]
}

// 删除排序数组中的重复项
func removeDuplicates(nums []int) int {
	var newNums []int
	index := 0
	for i := 0; i < len(nums); i++ {
		isAdded := true
		for j := 0; j < len(newNums); j++ {
			if nums[i] == newNums[j] {
				isAdded = false
				break
			}
		}
		if isAdded {
			newNums = append(newNums, nums[i])
			nums[index] = nums[i]
			index++
		}
	}
	return len(newNums)
}

// 加一
func plusOne(digits []int) []int {
	sum := 0
	length := len(digits)
	for i := 0; i < len(digits); i++ {
		sum += digits[i] * int(math.Pow10(length-i-1))
	}

	sum += 1
	strSum := strconv.Itoa(sum)
	newDigits := make([]int, len(strSum))
	for i := 0; i < len(strSum); i++ {
		newDigits[i] = int(strSum[i] - '0')
	}

	return newDigits
}

// 26. 删除有序数组中的重复项
func removeDuplicates2(nums []int) int {

	i := 0
	for j := 0; j < len(nums); j++ {
		existFlag := false
		for k := 0; k < i; k++ {
			if nums[k] == nums[j] {
				existFlag = true
				break
			}
		}
		if !existFlag {
			nums[i] = nums[j]
			i++
		}
	}
	return i
}

func merge(intervals [][]int) [][]int {
	sort.Slice(intervals, func(i, j int) bool {
		return intervals[i][0] < intervals[j][0]
	})

	newIntervals := [][]int{}
	var mergeArray []int
	for i := 0; i < len(intervals); i++ {
		if mergeArray == nil {
			mergeArray = intervals[i]
		} else if intervals[i][0] >= mergeArray[0] && intervals[i][0] <= mergeArray[1] {
			if intervals[i][1] > mergeArray[1] {
				mergeArray[1] = intervals[i][1]
			}
		} else {
			newIntervals = append(newIntervals, mergeArray)
			mergeArray = intervals[i]
		}
	}
	newIntervals = append(newIntervals, mergeArray)
	return newIntervals
}

// 两数之和
func twoSum(nums []int, target int) []int {
	for i := 0; i < len(nums); i++ {
		for j := i + 1; j < len(nums); j++ {
			if nums[i]+nums[j] == target {
				return []int{i, j}
			}
		}
	}
	return []int{}
}
