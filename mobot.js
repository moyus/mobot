/*!
 * mobot.js v1.0.3
 * (c) 2018 MOYU
 * Released under the MIT License.
 */
;(function (window, document) {
  'use strict';

  var headEl = document.head || document.getElementsByTagName('head')[0];

  /**
   * 下载远程资源
   *
   * @param  {string}   url
   * @param  {Function} callback
   */
  function fetch(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if ((xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) && xhr.responseText) {
          callback(null, {
            content: xhr.responseText,
            type: xhr.getResponseHeader('content-type')
          });
        } else {
          callback(new Error(xhr.statusText))
        }
      }
    }

    setTimeout(function () {
      if (xhr.readyState < 4) {
        xhr.abort();
      }
    }, mobot.timeout);

    xhr.send();
  }

  /**
   * 下载并保存资源到 LocalStorage
   *
   * @param {object}    resource
   * @param {Function}  callback
   */
  function save(resource, callback) {
    fetch(resource.url, function (err, res) {
      if (err) {
        return callback(err)
      }
      var source = {
        key: resource.key,
        unique: resource.unique,
        url: resource.url,
        cache: resource.cache,
        content: res.content,
        type: res.type,
        stamp: Date.now(),
        expire: Date.now() + (resource.expire || mobot.expire) * 60 * 60 * 1000
      }

      if (source.cache) {
        addLocalStorage(source.key, source)
      }

      callback(null, source)
    })
  }

  /**
   * 保存数据到 LocalStorage
   *
   * @param {string}    key
   * @param {object}    source
   */
  function addLocalStorage(key, source) {
    try {
      localStorage.setItem(mobot.prefix + key, JSON.stringify(source))
    } catch (e) {
      // 超出可缓存的大小限制
      if ( e.name.toUpperCase().indexOf('QUOTA') >= 0 ) {
        var shouldClear;
        for (var item in localStorage) {
          if (item.indexOf(mobot.prefix) === 0) {
            shouldClear = true;
            break;
          }
        }

        if (shouldClear) {
          mobot.clear();
          addLocalStorage(key, source);
        }
      }
    }
  }

  /**
   * 注入资源到页面
   *
   * @param {object}    source
   */
  function inject(source) {
    if (/javascript/.test(source.type)) {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.defer = true;
      script.crossorigin = 'anonymous';
      script.text = source.content;
      headEl.appendChild(script);
    } else if (/css/.test(source.type)) {
      var style = document.createElement('style');
      style.innerText = source.content;
      headEl.appendChild(style);
    }
  }

  /**
   * 处理资源
   *
   * @param  {object}   resource
   * @param  {Function} callback
   */
  function handle(resource, callback) {
    var source = mobot.get(resource.key);
    var shouldFetch = !source || source.unique !== resource.unique || source.expire < Date.now();

    if (shouldFetch) {
      save(resource, function (err, result) {
        if (err) {
          return callback(err);
        }
        callback(null, result);
      });
    } else {
      callback(null, source);
    }
  }

  /**
   * 异步队列操作资源
   *
   * @param  {array}    resources
   * @param  {Function} callback
   */
  function queue(resources, callback) {
    var count = resources.length;
    var stack = new Array(resources.length);

    function checkStack() {
      for (var i = 0, len = stack.length; i < len; i++) {
        if (!stack[i]) {
          break;
        } else if(stack[i].executed !== true) {
          inject(stack[i]);
          stack[i].executed = true;
        }
      }
    }

    for (var i = 0, len = resources.length; i < len; i++) {
      (function (i) {
        handle(resources[i], function (err, source) {
          --count;
          if (err) {
            if (callback.called !== true) {
              callback.called = true;
              callback(err)
            }
          } else {
            stack[i] = source;
            checkStack();
            if (count <= 0 && callback.called !== true) {
              callback.called = true;
              callback(null, stack);
            }
          }
        })
      })(i);
    }
  }

  var mobot = window.mobot = {
    timeout: 10000,
    expire: 24 * 7,
    prefix: 'mobot-',
    /**
     * 异步获取资源, 但按顺序执行
     *
     * @param {Object}   [resources]
     * @param {string}   [resource.url]
     * @param {string}   [resource.key=resource.url]
     * @param {string}   [resource.unique=resource.url]
     * @param {boolean}  [resource.cache=true]
     * @param {Function} [callback]
     * @return {this}
     */
    require: function (resources, callback) {
      resources = resources.reduce(function (acc, item) {
        if (!item.url) {
          return acc;
        }

        item.cache = item.cache !== false;
        item.key = item.key || item.url
        item.unique = item.unique || item.url
        acc.push(item)

        return acc
      }, []);

      queue(resources, function (err, items) {
        if (typeof callback === 'function') {
          callback(err, items);
        }
      });

      return this;
    },
    /**
     * 获取 LocalStorage 里缓存的资源
     *
     * @param {string} key
     * @return {Object|null}
     */
    get: function (key) {
      var item = null;

      try {
        item = JSON.parse(localStorage.getItem(mobot.prefix + key));
      } catch (e) {
        this.remove(key)
      }

      return item;
    },
    /**
     * 删除 LocalStorage 里缓存的资源
     *
     * @param {string} key
     * @return {this}
     */
    remove: function (key) {
      try {
        localStorage.removeItem(mobot.prefix + key);
      } catch (e) {}

      return this;
    },
    /**
     * 清空 LocalStorage 里缓存的资源
     *
     * @return {this}
     */
    clear: function () {
      for (var item in localStorage) {
        var key = item.split(mobot.prefix)[1];
        if (key) {
          this.remove(key);
        }
      }

      return this;
    }
  }
})(window, document);
