/* 记忆账本 Service Worker —— 让页面可离线安装使用。
   注意：这里只缓存"页面代码"（HTML/图标/清单），
   学生的错题与复习进度存在浏览器 localStorage 里，从不进入缓存、也从不上传。 */
var CACHE = "memory-book-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// 缓存优先，命中直接返回（离线可用）；未命中再联网并回填缓存。
self.addEventListener("fetch", function(e){
  if(e.request.method!=="GET") return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(res){
        if(res && res.status===200 && res.type==="basic"){
          var copy=res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){
        // 离线且无缓存时，导航请求回退到首页
        if(e.request.mode==="navigate") return caches.match("./index.html");
      });
    })
  );
});
