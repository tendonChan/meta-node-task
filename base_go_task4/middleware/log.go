package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"io"
	"os"
	"time"
)

func Logger(c *gin.Context) {
	startTime := time.Now()
	c.Next()
	endTime := time.Now()
	latencyTime := endTime.Sub(startTime)
	reqMethod := c.Request.Method
	reqUri := c.Request.RequestURI
	statusCode := c.Writer.Status()
	clientIP := c.ClientIP()
	logrus.Infof("| %3d | %13v | %15s | %s | %s ",
		statusCode,
		latencyTime,
		clientIP,
		reqMethod,
		reqUri,
	)
}

func InitLogrus() {
	logFile, err := os.OpenFile(os.Getenv("LOG_FILE"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		logrus.WithError(err).Fatal("Failed to open log file")
	}

	logrus.SetOutput(io.MultiWriter(os.Stdout, logFile))
	logrus.SetFormatter(&logrus.TextFormatter{
		ForceColors:     true,
		FullTimestamp:   true,
		TimestampFormat: "2006-01-02 15:04:05",
	})
	logrus.SetLevel(logrus.InfoLevel)
}
