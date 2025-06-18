-- 事务语句
-- 假设有两个表： accounts 表（包含字段 id 主键， balance 账户余额）和 transactions 表（包含字段 id 主键， from_account_id 转出账户ID， to_account_id 转入账户ID， amount 转账金额）。
-- 要求 ：
-- 编写一个事务，实现从账户 A 向账户 B 转账 100 元的操作。在事务中，需要先检查账户 A 的余额是否足够，如果足够则从账户 A 扣除 100 元，向账户 B 增加 100 元，并在 transactions 表中记录该笔转账信息。如果余额不足，则回滚事务。

-- 创建账户表：用于存储用户账户信息
CREATE TABLE accounts (
      id INT PRIMARY KEY,    -- 账户ID，主键，自动递增
      balance DECIMAL(10,2) NOT NULL        -- 账户余额，精确到小数点后两位，不允许为空
);

-- 创建交易记录表：用于记录所有转账交易历史
CREATE TABLE transactions (
      id INT PRIMARY KEY AUTO_INCREMENT,    -- 交易ID，主键，自动递增
      from_account_id INT NOT NULL,         -- 转出账户ID，不允许为空
      to_account_id INT NOT NULL,           -- 转入账户ID，不允许为空
      amount DECIMAL(10,2) NOT NULL,        -- 转账金额，精确到小数点后两位，不允许为空
      FOREIGN KEY (from_account_id) REFERENCES accounts(id),  -- 外键约束：确保转出账户存在
      FOREIGN KEY (to_account_id) REFERENCES accounts(id)     -- 外键约束：确保转入账户存在
);


-- 创建两个测试账户
INSERT INTO accounts (id,balance) VALUES (1,500.00);  -- 账户A：初始余额500元
INSERT INTO accounts (id,balance) VALUES (2,200.00);  -- 账户B：初始余额200元


-- =============================================
-- 创建转账存储过程
-- =============================================
DELIMITER $$
CREATE PROCEDURE transfer_money(
    IN from_account_id INT,
    IN to_account_id INT,
    IN transfer_amount DECIMAL(15,2)
)
BEGIN
    DECLARE from_balance DECIMAL(15,2);

    -- 定义异常处理
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
ROLLBACK;
RESIGNAL;
END;

    -- 开始事务
START TRANSACTION;

-- 获取转出账户余额并加锁（FOR UPDATE）
SELECT balance INTO from_balance
FROM accounts
WHERE id = from_account_id
    FOR UPDATE;

-- 检查余额是否足够
IF from_balance < transfer_amount THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '余额不足，无法完成转账';
ELSE
        -- 扣除转出账户金额
UPDATE accounts
SET balance = balance - transfer_amount
WHERE id = from_account_id;

-- 增加转入账户金额
UPDATE accounts
SET balance = balance + transfer_amount
WHERE id = to_account_id;

-- 插入交易记录
INSERT INTO transactions (from_account_id, to_account_id, amount)
VALUES (from_account_id, to_account_id, transfer_amount);

-- 提交事务
COMMIT;
END IF;

END$$
DELIMITER ;

CALL transfer_money(1, 2, 100.00);