var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


const { QQ } = require('qq-bot-rebown');

// 构造函数可以添加参数
// 详情参阅 [tsd 类型定义文件](./index.d.ts) 中 QQOptions 部分
const qq = new QQ();

//{"content":"🐴","type":"group","id":2700205732,"name":"轻扬细胞带鱼人","groupId":3366371513,"groupName":"青姆S茜佐刀哥彩京JO"}

// 从1~max随机
function randomInt(max = 2) {
  return Math.floor(Math.random() * Math.floor(max)) + 1;
}

const waitTimeRandom = () => {
  const constWait = 1000;
  let wait = constWait;

  //极速回复、快速回复。模拟认真聊天、一般聊天
  switch (randomInt(2)) {
    case 1:
      //极速回复，加0~1秒
      wait += randomInt(1000);
      break;
    case 2:
      //一般聊天，加5~25秒
      wait += 5000 + randomInt(20 * 1000);
      break;
    // case 3:
    //   //缓慢聊天，加1分~5分钟
    //   wait += 60 * 1000 + randomInt(4 * 60 * 1000);
    //   break;
    default:
      break;
  }
  return wait;
};

let fuduMap = {};
const fuduMapKey = (groupId, content, name) => {
  return `${groupId}:${content}`;
}
const alreadyFudu = (groupId, content, name) => {
  if (fuduMap.hasOwnProperty(fuduMapKey(groupId, content, name)))
    return true;
  else return false;
};
const addFuduMap = (groupId, content, name) => {
  if (Object.keys(fuduMap).length > 10000) fuduMap = {};
  fuduMap[fuduMapKey(groupId, content, name)] = { name, time: new Date() };
};

const fudu = (msg, doRepeat) => {
  let { groupId, content, name } = msg;
  console.log(JSON.stringify(msg));
  return new Promise((resolve, reject) => {
    let repeatFenmu = 12;
    let repeatFenzi = 1;
    if (content.indexOf("复读") !== -1)
      repeatFenzi = (repeatFenzi + 1) * 2;
    if (alreadyFudu(groupId, content, name))
      repeatFenzi = 0;
    // fenzi/fenmu概率复读
    if (randomInt(repeatFenmu) <= repeatFenzi) {
      const wait = waitTimeRandom();
      //概率加上人名来复读
      if (randomInt(10) <= 1) content = `${name}: ${content}`;
      console.log(`概率 ${repeatFenzi}/${repeatFenmu} 预备 ${wait}ms 后复读 ${content}`);
      addFuduMap(groupId, content, name);
      setTimeout(() => {
        doRepeat(content);
        console.log(`延时${wait}ms 复读了${content}`);
        resolve(true);
      }, wait);
    }else{
      resolve(false);
    }
  });
};

let queue = [];
let busyEnd = new Date().getTime();
let busy = false;
let busyTimeout = 0;

async function busyOver(doRepeat) {
  busy = false;
  clearTimeout(busyTimeout);
  const tempQueue = [...queue];
  queue = [];
  console.log("忙完了，该处理未读复读了！", tempQueue.length);
  for (let i in tempQueue) {
    const msg = tempQueue[i];
    await Promise.resolve().then(() => fudu(msg, doRepeat));
  }
}

const fuduQueue = (msg, doRepeat) => {
  const nowTime = new Date().getTime();
  if (!busy) {
    if (randomInt(10) <= 1) {
      //对所有聊天10%触发正忙模拟，加进队列里延迟读消息。随机加1~5分钟
      busy = true;
      const busyTime = randomInt(4 * 60 * 1000) + 1 * 60 * 1000;
      busyEnd = nowTime + busyTime;
      console.log(`触发正忙模拟，准备忙 ${busyTime}ms 后再处理复读！`);
      busyTimeout = setTimeout(() => {
        console.log("到时间了，timeout结束忙");
        busyOver(doRepeat);
      }, busyTime);
    } else {
      Promise.resolve().then(() => fudu(msg, doRepeat));
    }
  }

  if (busy) {
    console.log(`因为正忙，将 "${msg.content}" 放到了消息队列忙完再看`);
    queue.push(msg);
    //过了正忙时间，或者大家聊得太多，就开始处理
    if (nowTime > busyEnd || queue.length > 20) {
      console.log("有人说话，达到条件结束忙。", nowTime > busyEnd, queue.length);
      busyOver(doRepeat);
    }
  }
};

// 设置 “收到消息” 事件监听
qq.on('msg', (msg) => {
  // console.log(JSON.stringify(msg));
  const { type, groupId, content, name } = msg;
  if (content !== "") {
    if (type === "group") {
      fuduQueue(msg, (content) => {
        qq.sendGroupMsg(groupId, content);
      });
    }
  }
});

// 设置 “收到好友消息” 事件监听
qq.on('buddy', (msg) => {
  qq.sendBuddyMsg(msg.id, `Hello, ${msg.name}`);
});

// 不要忘记启动 :)
qq.run();


module.exports = app;
