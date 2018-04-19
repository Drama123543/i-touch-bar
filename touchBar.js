/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2018 ishanyang
 * All rights reserved.
 * https://github.com/ishanyang/i-touch-bar
 */
var objectTypeOf = function(name) {
  return function(o) {
    if (Object.prototype.toString.call(o) === "[object " + name + "]") {
      return o;
    }
    console.log("Error: "+name+" expected, something else given.");
    return false;
  }
}

var typeObj = objectTypeOf("Object");
var typeFunction = objectTypeOf("Function");

//节流阀
var throttle = function(fn, interval) {
  var __self = fn,
    timer,
    firstTime = true;
  return function() {
    var args = arguments,
      __me = this;
    if (firstTime) {
      __self.apply(__me, args);
      return firstTime = false;
    }
    if (timer) {
      return false;
    }
    timer = setTimeout(function() {
      clearTimeout(timer);
      timer = null;
      __self.apply(__me, args);
    }, interval || 500);
  };
};

// use modernizr Touch Events detect
function detectTouch() {
  var bool;
  if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
    bool = true;
  }
  return bool;
}


function touchBar(touchCallback, id) {
  var wrapId, $wrap, callback;

  if (typeObj(arguments[0])) {
    wrapId = arguments[0]["id"];
    $wrap = $(wrapId)
    callback = arguments[0]["callback"]
  } else {
    wrapId = id;
    $wrap = $(wrapId)
    callback = touchCallback;
  }
  try {
    if (!typeFunction(callback)) throw new Error("请为touchBar指定回调函数：touchCallback");
    if (!$wrap.length) throw new Error("请为touchBar指定有效id：id");
  } catch (e) {
    alert(e.message);
    return;
  }

  //获取对象ul
  var $wrapUl = $wrap;
  var $wrapLi = $wrapUl.find("li");


  //获取$wrap的top
  var wrapPdT = parseInt($wrap.css("top")) || 0;

  //对li集合进行遍历,将元素li的文本内容,data-target,offsetTop,offsetTop+liHeight放进数组
  var liDataArr = [];

  function setLiHeight() {
    //获取单个li的高度
    var liHeight = parseInt($wrapLi.eq(0).height());
    $wrapLi.css("lineHeight", liHeight + "px");
    $wrapLi.each(function(index) {
      var $this = $(this);
      var temp = {};
      temp["text"] = $this.text();
      temp["target"] = $this.attr("data-target");
      temp["top"] = wrapPdT + $this[0].offsetTop;
      temp["bottom"] = temp["top"] + liHeight;
      liDataArr[index] = temp;
    })
  }

  var resizeLiHeight = throttle(setLiHeight, 50);

  $(window).resize(function() {
    resizeLiHeight();
  });
  setLiHeight();

  //检测当前手指位于哪个li里，并传给callback
  var detect = function(eventY) {
    for (var i = 0; i < liDataArr.length; i++) {
      if (liDataArr[i]["top"] <= eventY && eventY <= liDataArr[i]["bottom"]) {
        callback(liDataArr[i]["target"], liDataArr[i]["text"]);
      }
    }
  };

  //节流 89ms做一次判断
  var throttleDetect = throttle(detect, 89);

  //触摸开关
  var touchSwitch = (function() {
    var switchState = false;
    var eventStr;
    if(detectTouch()){
      eventStr = "touchstart touchmove";
    }else{
      eventStr = "click";
    }
    var contro;
    //对$wrapUl绑定touchstart touchmove事件
    var bindTouch = function() {
      if (switchState === true) return;
      $wrapUl.bind(eventStr, function(e) {
        var eventY = e.pageY || e.changedTouches[0].pageY;
        throttleDetect(eventY - $(window).scrollTop());
        $wrapUl.addClass("active")
        clearTimeout(contro)
        contro=setTimeout(function(){
            $wrapUl.removeClass("active")
        },100)
        e.preventDefault();
      });
      switchState = true;
    };
    //对$wrapUl解除绑定
    var unbindTouch = function() {
      if (switchState === false) return;
      $wrapUl.unbind(eventStr);
      switchState = false;
    };

    return function(b) {
      if (b || !switchState) {
        bindTouch();
      } else {
        unbindTouch();
      }
    };
  })();

  //执行绑定
  touchSwitch();

  //返回touchSwitch方法
  return {
    touchSwitch: touchSwitch
  };
}
