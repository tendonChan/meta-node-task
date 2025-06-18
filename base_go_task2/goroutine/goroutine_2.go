package goroutine

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

type Task func() error

type TaskResult struct {
	ID       int
	Duration time.Duration
	Result   interface{}
	Err      error
}

type Scheduler struct {
	Tasks []Task
	Stats []TaskResult
	wg    sync.WaitGroup
	mu    sync.Mutex
	start time.Time
}

func NewScheduler() *Scheduler {
	return &Scheduler{
		Tasks: make([]Task, 0),
		Stats: make([]TaskResult, 0),
	}
}

func (s *Scheduler) Add(task Task) {
	s.Tasks = append(s.Tasks, task)
}

func (s *Scheduler) executeTask(id int, task Task) {
	defer s.wg.Done()
	start := time.Now()
	var err error
	var result interface{}
	func() {
		defer func() {
			if r := recover(); r != nil {
				err = fmt.Errorf("任务发生panic: %v", r)
			}
		}()
		result = task()
	}()

	duration := time.Since(start)
	s.mu.Lock()
	s.Stats = append(s.Stats, TaskResult{
		ID:       id,
		Duration: duration,
		Result:   result,
		Err:      err,
	})
	s.mu.Unlock()

	s.mu.Lock()
	total := len(s.Tasks)
	completed := len(s.Stats)
	s.mu.Unlock()

	progress := float64(completed) / float64(total) * 100
	fmt.Printf("▶ 任务 %d 完成 [%.0f%%] - 耗时: %v\n",
		id, progress, duration.Round(time.Millisecond))
}

func (s *Scheduler) Run() []TaskResult {
	s.start = time.Now()

	fmt.Printf("开始执行 %d 个任务\n", len(s.Tasks))
	s.wg.Add(len(s.Tasks))
	for id, task := range s.Tasks {
		s.executeTask(id, task)
	}
	s.wg.Wait()

	total := time.Since(s.start)
	fmt.Printf("所有任务完成！总耗时：%v\n", total.Round(time.Millisecond))
	fmt.Printf("任务统计：\n")
	for _, stat := range s.Stats {
		status := "成功"
		if stat.Err != nil {
			status = "失败"
		}
		fmt.Printf("  - 任务 %d: %v (%s)\n", stat.ID, stat.Duration.Round(time.Millisecond), status)
	}

	return s.Stats
}

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
