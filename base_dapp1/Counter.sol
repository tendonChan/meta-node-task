// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
contract Counter {
    uint256 private count;
    
    // 事件：当计数器变化时触发
    event CounterChanged(string operation, uint256 newValue);

    // 初始化计数器为0
    constructor() {
        count = 0;
    }

    // 增加计数器
    function increment() public {
        count += 1;
        emit CounterChanged("increment", count);
    }

    // 减少计数器（防止下溢）
    function decrement() public {
        require(count > 0, "Counter: cannot decrement below zero");
        count -= 1;
        emit CounterChanged("decrement", count);
    }

    // 重置计数器
    function reset() public {
        count = 0;
        emit CounterChanged("reset", count);
    }

    // 获取当前计数
    function getCount() public view returns (uint256) {
        return count;
    }
}