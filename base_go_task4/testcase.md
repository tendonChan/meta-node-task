# Test  Case
## User
### RegisterUser
request:
```shell
curl --location 'http://localhost:8080/user/register' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username":"jack",
    "password":"123456",
    "email":"jack@qq.com"
}'
```
response:
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

request:
```shell
curl --location 'http://localhost:8080/user/register' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username":"",
    "password":"123456",
    "email":"jack@qq.com"
}'
```
response:
```json
{
  "code": 9998,
  "message": "Username is required.",
  "data": null
}
```

### Login
request:
```shell
curl --location 'http://localhost:8080/user/login' \
--header 'Content-Type: application/json' \
--data '{
    "username":"jack",
    "password":"123456"
}'
```

response:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "email": "jack@qq.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTA3NDQ0NDIsImlkIjo3LCJ1c2VybmFtZSI6ImphY2sifQ.B7zo_hXz5q5QleDCW-JLJxFbE0oxNPi3MkhhU38Ab44",
    "username": "jack"
  }
}
```

request:
```shell
curl --location 'http://localhost:8080/user/login' \
--header 'Content-Type: application/json' \
--data '{
    "username":"jack",
    "password":"1234563"
}'
```

response:
```json
{
  "code": 9998,
  "message": "invalid username or password",
  "data": null
}
```

## Post
### AddPost
request:
```shell
curl --location 'http://localhost:8080/post/add' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTA3NDQ2MTMsImlkIjo3LCJ1c2VybmFtZSI6ImphY2sifQ.EYefP1Q7NtABzbdzKWe6ivmK4VhZDkLGawyuUTzz9FQ' \
--header 'Content-Type: application/json' \
--data '{
    "content":"web3 content",
    "title":"web3"
}'
```

response:
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### GetAllPost
request:
```shell
curl --location 'http://localhost:8080/post/all' \
```
response:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "ID": 4,
      "CreatedAt": "2025-06-22T14:54:39.498+08:00",
      "UpdatedAt": "2025-06-23T10:47:23.699+08:00",
      "DeletedAt": null,
      "Title": "mytitle33",
      "Content": "mycontentasfsdf34",
      "UserID": 1,
      "User": {
        "ID": 0,
        "CreatedAt": "0001-01-01T00:00:00Z",
        "UpdatedAt": "0001-01-01T00:00:00Z",
        "DeletedAt": null,
        "Username": "",
        "Password": "",
        "Email": ""
      }
    },
    {
      "ID": 6,
      "CreatedAt": "2025-06-23T13:58:50.173+08:00",
      "UpdatedAt": "2025-06-23T13:58:50.173+08:00",
      "DeletedAt": null,
      "Title": "web3",
      "Content": "web3 content",
      "UserID": 7,
      "User": {
        "ID": 0,
        "CreatedAt": "0001-01-01T00:00:00Z",
        "UpdatedAt": "0001-01-01T00:00:00Z",
        "DeletedAt": null,
        "Username": "",
        "Password": "",
        "Email": ""
      }
    }
  ]
}
```
### GetById
request:
```shell
curl --request GET \
  --url http://localhost:8080/post/6
```
response:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "ID": 6,
    "CreatedAt": "2025-06-23T13:58:50.173+08:00",
    "UpdatedAt": "2025-06-23T13:58:50.173+08:00",
    "DeletedAt": null,
    "Title": "web3",
    "Content": "web3 content",
    "UserID": 7,
    "User": {
      "ID": 0,
      "CreatedAt": "0001-01-01T00:00:00Z",
      "UpdatedAt": "0001-01-01T00:00:00Z",
      "DeletedAt": null,
      "Username": "",
      "Password": "",
      "Email": ""
    }
  }
}
```

### ModifyPost
request:
```shell
curl --location --request PUT 'http://localhost:8080/post/modify' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTA3NDQ2MTMsImlkIjo3LCJ1c2VybmFtZSI6ImphY2sifQ.EYefP1Q7NtABzbdzKWe6ivmK4VhZDkLGawyuUTzz9FQ' \
--header 'Content-Type: application/json' \
--data '{
    "id":6,
    "title":"other web3",
    "content":"web3 append content"
}'
```
response:
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### DeletePost
request:
```shell
curl --location --request DELETE 'http://localhost:8080/post/6' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTA3NDQ2MTMsImlkIjo3LCJ1c2VybmFtZSI6ImphY2sifQ.EYefP1Q7NtABzbdzKWe6ivmK4VhZDkLGawyuUTzz9FQ' 
```
response:
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

## Comment
### AddComment
request:
```shell
curl --location 'http://localhost:8080/comment/add' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTA3NDQ2MTMsImlkIjo3LCJ1c2VybmFtZSI6ImphY2sifQ.EYefP1Q7NtABzbdzKWe6ivmK4VhZDkLGawyuUTzz9FQ' \
--header 'Content-Type: application/json' \
--data '{
    "postId":6,
    "content":"web 3 test comment"
}'
```
response:
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```
### GetCommentsByPostID
request:
```shell
curl --location 'http://localhost:8080/comment/getComments/6' 
```
response:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "ID": 2,
      "CreatedAt": "2025-06-23T14:16:13.826+08:00",
      "UpdatedAt": "2025-06-23T14:16:13.826+08:00",
      "DeletedAt": null,
      "Content": "web 3 test comment",
      "UserID": 7,
      "User": {
        "ID": 0,
        "CreatedAt": "0001-01-01T00:00:00Z",
        "UpdatedAt": "0001-01-01T00:00:00Z",
        "DeletedAt": null,
        "Username": "",
        "Password": "",
        "Email": ""
      },
      "PostID": 6,
      "Post": {
        "ID": 0,
        "CreatedAt": "0001-01-01T00:00:00Z",
        "UpdatedAt": "0001-01-01T00:00:00Z",
        "DeletedAt": null,
        "Title": "",
        "Content": "",
        "UserID": 0,
        "User": {
          "ID": 0,
          "CreatedAt": "0001-01-01T00:00:00Z",
          "UpdatedAt": "0001-01-01T00:00:00Z",
          "DeletedAt": null,
          "Username": "",
          "Password": "",
          "Email": ""
        }
      }
    }
  ]
}
```
