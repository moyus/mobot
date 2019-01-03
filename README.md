<div align="center">
  <img width="160" height="50" src="https://github.com/moyus/mobot/raw/master/logo.svg" alt="mobot.js" />
  <p>移动端LocalStorage缓存资源方案</p>
</div>

## 安装
```bash
npm install mobot
```

## 使用
```javascript
mobot.timeout = 10000; // 请求超时10s
mobot.prefix = 'mobot-'; // LocalStorage前缀
mobot.expire = 24 * 7; // 7天的缓存时间
mobot.require([
  {
    url: 'https://www.xxx.xxx/static/styles.123.css',
    key: 'styles',
    unique: '123',
    cache: true
  },
  {
    url: 'https://www.xxx.xxx/static/vendors.456.js',
    key: 'vendors',
    unique: '456',
    cache: true
  },
  {
    url: 'https://www.xxx.xxx/static/app.789.js',
    key: 'app',
    unique: '789',
    cache: true
  }
], function (resources) {
  // 所有资源均已加载并按顺序插入到了head中
});

// 获取本地缓存资源
mobot.get('app');
// {
//   content: string   // 资源内容
//   type: string      // 资源类型
//   stamp: number     // 什么时候缓存的
//   unique: string    // hash值
//   expire: number    // 多久之后过期
// }

// 删除本地缓存资源
mobot.remove('vendors')

// 清空本地所有缓存资源
mobot.clear()
```

## 相关讨论
[https://www.zhihu.com/question/28467444](https://www.zhihu.com/question/28467444)
