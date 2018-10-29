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

  //极速回复、快速回复、延迟回复。模拟认真聊天、
  switch (randomInt(3)) {
    case 1:
      wait += randomInt(1000);
      break;
    case 2:
      wait += 5000 + randomInt(20 * 1000);
      break;
    case 3:
      wait += 60 * 1000 + randomInt(4 * 60 * 1000);
      break;
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

const fudu = (groupId, content, name, doRepeat) => {
  let repeatFenmu = 12;
  let repeatFenzi = 1;
  if (content.indexOf("复读"))
    repeatFenzi = (repeatFenzi + 1) * 2;
  if (alreadyFudu(groupId, content, name))
    repeatFenzi = 0;
  // fenzi/fenmu概率复读
  if (randomInt(repeatFenmu) <= repeatFenzi) {
    const wait = waitTimeRandom();
    //概率加上人名来复读
    if (randomInt(10) <= 1) content = `${name}: ${content}`;
    console.log(`预备 ${wait}ms 后复读 ${content}`);
    addFuduMap(groupId, content, name);
    setTimeout(() => {
      doRepeat();
      console.log(`延时${wait}ms 复读了${content}`);
    }, wait);
  }
};

// 设置 “收到消息” 事件监听
qq.on('msg', (msg) => {
  console.log(JSON.stringify(msg));
  const { type, groupId, content, name } = msg;
  if (content !== "") {
    if (type === "group") {
      fudu(groupId, content, name, () => {
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
