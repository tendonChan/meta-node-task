-- 题目1：基本CRUD操作
-- 假设有一个名为 students 的表，包含字段 id （主键，自增）、 name （学生姓名，字符串类型）、 age （学生年龄，整数类型）、 grade （学生年级，字符串类型）。


-- 创建 students 表
create table students
(
    id         bigint unsigned auto_increment
        primary key,
    name       VARCHAR(50)         NOT NULL,
    age        INT                 NOT NULL,
    grade      VARCHAR(20)         NOT NULL
);


-- 编写SQL语句向 students 表中插入一条新记录，学生姓名为 "张三"，年龄为 20，年级为 "三年级"。
insert into students(name,age,grade) values('张三',20,'三年级');

-- 编写SQL语句查询 students 表中所有年龄大于 18 岁的学生信息。
select * from students where age > 18;

-- 编写SQL语句将 students 表中姓名为 "张三" 的学生年级更新为 "四年级"。
update students set grade = '四年级' where name = '张三';

-- 编写SQL语句删除 students 表中年龄小于 15 岁的学生记录。
delete from students where age < 15;