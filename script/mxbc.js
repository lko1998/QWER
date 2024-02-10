/**************************************
脚本名称：蜜雪冰城小程序 签到
脚本作者：@Sliverkiss
更新日期：2024.02.06 15:14:11

脚本兼容：Surge、QuantumultX、Loon、Shadowrocket、Node.js
只测试过loon和青龙，其它环境请自行尝试

*************************
【 签到脚本使用教程 】:
*************************
单账号&多账号：
1.将签到脚本拉取到本地
2.打开小程序，随便逛逛，提示获取cookie成功则可以使用该脚本
3.关闭获取cookie脚本，防止产生不必要的mitm

------------------ Surge 配置 -----------------

[Script]
蜜雪冰城获取token = type=http-request,pattern=^https:\/\/mxsa\.mxbc\.net\/api\/v1\/customer\/info,requires-body=0,max-size=0,script-path=https://gist.githubusercontent.com/Sliverkiss/865c82e42a5730bb696f6700ebb94cee/raw/mxbc.js

蜜雪冰城小程序签到 = type=cron,cronexp=22 8 * * *,timeout=60,script-path=https://gist.githubusercontent.com/Sliverkiss/865c82e42a5730bb696f6700ebb94cee/raw/mxbc.js,script-update-interval=0

[MITM]
hostname = mxsa.mxbc.net
====================================
⚠️【免责声明】
------------------------------------------
1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。
******************************************/
// env.js 全局
const $ = new Env("蜜雪冰城小程序签到");
const ckName = "mxbc_data";
//-------------------- 一般不动变量区域 -------------------------------------
const Notify = 1;//0为关闭通知,1为打开通知,默认为1
const notify = $.isNode() ? require('./sendNotify') : '';
let envSplitor = ["@"]; //多账号分隔符
let userCookie = ($.isNode() ? process.env[ckName] : $.getdata(ckName)) || '';
let userList = [];
let userIdx = 0;
let userCount = 0;
//调试
$.is_debug = ($.isNode() ? process.env.IS_DEDUG : $.getdata('is_debug')) || 'false';
// 为通知准备的空数组
$.notifyMsg = [];
//---------------------- 自定义变量区域 -----------------------------------

//脚本入口函数main()
async function main() {
    await getNotice()
    console.log('\n================== 任务 ==================\n');
    for (let user of userList) {
        console.log(`🔷账号${user.index} >> Start work`)
        console.log(`随机延迟${user.getRandomTime()}ms`);
        //执行签到
        await user.signin();
        if (user.ckStatus) {
            //查询用户信息
            let userInfo = await user.userInfo();
            DoubleLog(`当前用户: ${userInfo.user}\n签到任务: ${$.signMsg}\n总共积分: ${userInfo.point}`)
        } else {
            //将ck过期消息存入消息数组
            $.notifyMsg.push(`❌账号${user.index} >> Check ck error!`)
        }
    }
}

class UserInfo {
    constructor(user) {
        this.index = ++userIdx;
        this.token = user;
        this.ckStatus = true
        this.headers = {
            "app": "mxbc",
            "appchannel": "xiaomi",
            "appversion": "3.0.3",
            "Access-Token": this.token,
            "Host": "mxsa.mxbc.net",
            "User-Agent": "okhttp/4.4.1"
        }
    }
    getRandomTime() {
        return randomInt(1000, 3000)
    }
    //请求二次封装
    Request(options, method) {
        typeof (method) === 'undefined' ? ('body' in options ? method = 'post' : method = 'get') : method = method;
        return new Promise((resolve, reject) => {
            $.http[method.toLowerCase()](options)
                .then((response) => {
                    let res = response.body;
                    res = $.toObj(res) || res;
                    resolve(res);
                })
                .catch((err) => reject(err));
        });
    };
    //签到
    async signin() {
        try {
            const options = {
                url: `https://mxsa.mxbc.net/api/v1/customer/signin?appId=d82be6bbc1da11eb9dd000163e122ecb&t=${ts13()}&sign=${getSHA256withRSA('appId=d82be6bbc1da11eb9dd000163e122ecb&t=' + ts13())}`,
                headers: this.headers,
            };
            //post方法
            let res = await this.Request(options);
            debug(res, "签到");
            if (res?.code == 0 || res?.code == 5020) {
                $.signMsg = res?.data ? `累计${res?.data?.ruleValueGrowth}天,获得${res?.data?.ruleValuePoint}币` : res?.msg
            } else {
                this.ckStatus = false;
            }
        } catch (e) {
            $.log(`❌签到执行失败！原因为${e}`);
        }
    }
    //查询积分
    async userInfo() {
        try {
            const options = {
                url: `https://mxsa.mxbc.net/api/v1/customer/info?appId=d82be6bbc1da11eb9dd000163e122ecb&t=${ts13()}&sign=${getSHA256withRSA('appId=d82be6bbc1da11eb9dd000163e122ecb&t=' + ts13())}`,
                headers: this.headers,
            };
            //post方法
            let res = await this.Request(options);
            debug(res, "查询积分");
            return {
                user: res?.data?.mobilePhone,
                level: res?.data?.customerLevel,
                levelName: res?.data?.customerLevelVo?.levelName,
                point: res?.data?.customerPoint
            }
        } catch (e) {
            $.log(`❌查询用户信息执行失败！原因为${e}`);
        }
    }
}
//获取Cookie
async function getCookie() {
    if ($request && $request.method != 'OPTIONS') {
        //请求头大小写转换,兼容代理软件环境
        const headers = ObjectKeys2LowerCase($request.headers);
        //获取token
        const tokenValue = headers[`access-token`];
        if (tokenValue) {
            $.setdata(tokenValue, ckName);
            $.msg($.name, "", "获取签到Cookie成功🎉");
        } else {
            $.msg($.name, "", "❌获取签到Cookie失败");
        }
    }
}


async function getNotice() {
    try {
        const urls = ["https://raw.githubusercontent.com/Sliverkiss/GoodNight/main/notice.json", "https://raw.githubusercontent.com/Sliverkiss/GoodNight/main/tip.json"];
        for (const url of urls) {
            const options = {
                url: url,
                headers: { "User-Agent": "" }
            };
            const result = await httpRequest(options);
            if (result) console.log(result.notice);
        }
    } catch (e) {
        console.log(e);
    }
}

//主程序执行入口
!(async () => {
    //没有设置变量,执行Cookie获取
    if (typeof $request != "undefined") {
        await getCookie();
        return;
    }
    //未检测到ck，退出
    if (!(await checkEnv())) { throw new Error(`❌未检测到ck，请添加环境变量`) };
    //加载模块
    if (!(await loadModule())) { throw new Error(`❌加载模块失败，请检查模块路径是否正常`) }
    //存在账号，则执行任务
    if (userList.length > 0) {
        await main();
    }
})()
    .catch((e) => $.notifyMsg.push(e.message || e))//捕获登录函数等抛出的异常, 并把原因添加到全局变量(通知)
    .finally(async () => {
        await SendMsg($.notifyMsg.join('\n'))//带上总结推送通知
        $.done({ ok: 1 }); //调用Surge、QX内部特有的函数, 用于退出脚本执行
    });

/** --------------------------------辅助函数区域------------------------------------------- */

// 双平台log输出
function DoubleLog(data) {
    if ($.isNode()) {
        if (data) {
            console.log(`${data}`);
            $.notifyMsg.push(`${data}`);
        }
    } else {
        console.log(`${data}`);
        $.notifyMsg.push(`${data}`);
    }
}

// DEBUG
function debug(text, title = 'debug') {
    if ($.is_debug === 'true') {
        if (typeof text == "string") {
            console.log(`\n-----------${title}------------\n`);
            console.log(text);
            console.log(`\n-----------${title}------------\n`);
        } else if (typeof text == "object") {
            console.log(`\n-----------${title}------------\n`);
            console.log($.toStr(text));
            console.log(`\n-----------${title}------------\n`);
        }
    }
}


//检查变量
async function checkEnv() {
    if (userCookie) {
        let e = envSplitor[0];
        for (let o of envSplitor)
            if (userCookie.indexOf(o) > -1) {
                e = o;
                break;
            }
        for (let n of userCookie.split(e)) n && userList.push(new UserInfo(n));
        userCount = userList.length;
    } else {
        console.log("未找到CK");
        return;
    }
    return console.log(`共找到${userCount}个账号`), true;//true == !0
}

/**
 * 随机整数生成
 */
function randomInt(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}
// 发送消息
async function SendMsg(message) {
    if (!message) return;
    if (Notify > 0) {
        if ($.isNode()) {
            await notify.sendNotify($.name, message)
        } else {
            $.msg($.name, '', message)
        }
    } else {
        console.log(message)
    }
}

function ts13() {
    return Math.round(new Date().getTime()).toString()
}
function getSHA256withRSA(content) {
    var privateKeyString = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCtypUdHZJKlQ9L
L6lIJSphnhqjke7HclgWuWDRWvzov30du235cCm13mqJ3zziqLCwstdQkuXo9sOP
Ih94t6nzBHTuqYA1whrUnQrKfv9X4/h3QVkzwT+xWflE+KubJZoe+daLKkDeZjVW
nUku8ov0E5vwADACfntEhAwiSZUALX9UgNDTPbj5ESeII+VztZ/KOFsRHMTfDb1G
IR/dAc1mL5uYbh0h2Fa/fxRPgf7eJOeWGiygesl3CWj0Ue13qwX9PcG7klJXfToI
576MY+A7027a0aZ49QhKnysMGhTdtFCksYG0lwPz3bIR16NvlxNLKanc2h+ILTFQ
bMW/Y3DRAgMBAAECggEBAJGTfX6rE6zX2bzASsu9HhgxKN1VU6/L70/xrtEPp4SL
SpHKO9/S/Y1zpsigr86pQYBx/nxm4KFZewx9p+El7/06AX0djOD7HCB2/+AJq3iC
5NF4cvEwclrsJCqLJqxKPiSuYPGnzji9YvaPwArMb0Ff36KVdaHRMw58kfFys5Y2
HvDqh4x+sgMUS7kSEQT4YDzCDPlAoEFgF9rlXnh0UVS6pZtvq3cR7pR4A9hvDgX9
wU6zn1dGdy4MEXIpckuZkhwbqDLmfoHHeJc5RIjRP7WIRh2CodjetgPFE+SV7Sdj
ECmvYJbet4YLg+Qil0OKR9s9S1BbObgcbC9WxUcrTgECgYEA/Yj8BDfxcsPK5ebE
9N2teBFUJuDcHEuM1xp4/tFisoFH90JZJMkVbO19rddAMmdYLTGivWTyPVsM1+9s
tq/NwsFJWHRUiMK7dttGiXuZry+xvq/SAZoitgI8tXdDXMw7368vatr0g6m7ucBK
jZWxSHjK9/KVquVr7BoXFm+YxaECgYEAr3sgVNbr5ovx17YriTqe1FLTLMD5gPrz
ugJj7nypDYY59hLlkrA/TtWbfzE+vfrN3oRIz5OMi9iFk3KXFVJMjGg+M5eO9Y8m
14e791/q1jUuuUH4mc6HttNRNh7TdLg/OGKivE+56LEyFPir45zw/dqwQM3jiwIz
yPz/+bzmfTECgYATxrOhwJtc0FjrReznDMOTMgbWYYPJ0TrTLIVzmvGP6vWqG8rI
S8cYEA5VmQyw4c7G97AyBcW/c3K1BT/9oAj0wA7wj2JoqIfm5YPDBZkfSSEcNqqy
5Ur/13zUytC+VE/3SrrwItQf0QWLn6wxDxQdCw8J+CokgnDAoehbH6lTAQKBgQCE
67T/zpR9279i8CBmIDszBVHkcoALzQtU+H6NpWvATM4WsRWoWUx7AJ56Z+joqtPK
G1WztkYdn/L+TyxWADLvn/6Nwd2N79MyKyScKtGNVFeCCJCwoJp4R/UaE5uErBNn
OH+gOJvPwHj5HavGC5kYENC1Jb+YCiEDu3CB0S6d4QKBgQDGYGEFMZYWqO6+LrfQ
ZNDBLCI2G4+UFP+8ZEuBKy5NkDVqXQhHRbqr9S/OkFu+kEjHLuYSpQsclh6XSDks
5x/hQJNQszLPJoxvGECvz5TN2lJhuyCupS50aGKGqTxKYtiPHpWa8jZyjmanMKnE
dOGyw/X4SFyodv8AEloqd81yGg==
-----END PRIVATE KEY-----
`
    const { KEYUTIL, KJUR, hextob64u } = $.Jsrsasign;
    const key = KEYUTIL.getKey(privateKeyString)
    const signature = new KJUR.crypto.Signature({ alg: 'SHA256withRSA' })
    signature.init(key)
    signature.updateString(content)
    const originSign = signature.sign()
    const sign64u = hextob64u(originSign)
    return sign64u
}

//加载模块
async function loadModule() {
    //Jsrsasign模块
    $.Jsrsasign = await loadJsrsasign();
    return $.Jsrsasign ? true : false;

}
//加载CryptoJS模块
async function loadCryptoJS() {
    let code = ($.isNode() ? require('crypto-js') : $.getdata('CryptoJS_code')) || '';
    //node环境
    if ($.isNode()) return code;
    //ios环境
    if (code && Object.keys(code).length) {
        console.log(`✅ ${$.name}: 缓存中存在CryptoJS代码, 跳过下载`)
        eval(code)
        return createCryptoJS();
    }
    console.log(`🚀 ${$.name}: 开始下载CryptoJS代码`)
    return new Promise(async (resolve) => {
        $.getScript(
            'https://cdn.jsdelivr.net/gh/Yuheng0101/X@main/Utils/CryptoJS.js'
        ).then((fn) => {
            $.setdata(fn, 'CryptoJS_code')
            eval(fn)
            const CryptoJS = createCryptoJS();
            console.log(`✅ CryptoJS加载成功, 请继续`)
            resolve(CryptoJS)
        })
    })
}
//加载Jsrsasign模块
async function loadJsrsasign() {
    let code = ($.isNode() ? require('jsrsasign') : $.getdata('Jsrsasign_code')) || '';
    //node环境
    if ($.isNode()) return code;
    //ios环境
    if (code && Object.keys(code).length) {
        console.log(`✅ ${$.name}: 缓存中存在Jsrsasign代码, 跳过下载`)
        const CryptoJS = await loadCryptoJS();
        eval(code)
        return { KEYUTIL, KJUR, hextob64u };
    }
    console.log(`🚀 ${$.name}: 开始下载Jsrsasign代码`)
    try {
        const CryptoJS = await loadCryptoJS();
        const _partFun = await $.getScript(
            'https://cdn.jsdelivr.net/gh/Yuheng0101/X@main/Utils/jsrsasign-part.js'
        )
        const _function = `${_partFun};`
        $.setdata(_function, 'Jsrsasign_code')
        eval(_function)
        console.log(`loadJsrsasign success`)
        return { KEYUTIL, KJUR, hextob64u }
    } catch (e) {
        console.log(e)
        throw new Error('loadJsrsasign error')
    }
}

/** ---------------------------------固定不动区域----------------------------------------- */
// prettier-ignore
//请求头转换成小写
function ObjectKeys2LowerCase(obj) { const _lower = Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])); return new Proxy(_lower, { get: function (target, propKey, receiver) { return Reflect.get(target, propKey.toLowerCase(), receiver) }, set: function (target, propKey, value, receiver) { return Reflect.set(target, propKey.toLowerCase(), value, receiver) } }) };
//Sakura多功能工具模块，引入模块方法如下：
async function loadSakuraUtils() { let code = ($.isNode() ? process.env['SakuraUtil_code'] : $.getdata('SakuraUtil_code')) || ''; if (code && Object.keys(code).length) { console.log(`✅${$.name}:缓存中存在SakuraUtil代码,跳过下载`); eval(code); return creatUtils() } console.log(`🚀${$.name}:开始下载SakuraUtil代码`); return new Promise(async (resolve) => { $.getScript('https://cdn.jsdelivr.net/gh/Sliverkiss/QuantumultX@main/Utils/SakuraUtil.js').then((fn) => { $.setdata(fn, "SakuraUtil_code"); eval(fn); const SakuraUtil = creatUtils(); console.log(`✅SakuraUtil加载成功,请继续`); resolve(SakuraUtil) }) }) };
//请求函数函数二次封装
function httpRequest(options, method) { typeof (method) === 'undefined' ? ('body' in options ? method = 'post' : method = 'get') : method = method; return new Promise((resolve) => { $[method](options, (err, resp, data) => { try { if (err) { console.log(`${method}请求失败`); $.logErr(err) } else { if (data) { typeof JSON.parse(data) == 'object' ? data = JSON.parse(data) : data = data; resolve(data) } else { console.log(`请求api返回数据为空，请检查自身原因`) } } } catch (e) { $.logErr(e, resp) } finally { resolve() } }) }) }
//From chavyleung's Env.js
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, a) => { s.call(this, t, (t, s, r) => { t ? a(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const a = this.getdata(t); if (a) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, a) => e(a)) }) } runScript(t, e) { return new Promise(s => { let a = this.getdata("@chavy_boxjs_userCfgs.httpapi"); a = a ? a.replace(/\n/g, "").trim() : a; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [i, o] = a.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": i, Accept: "*/*" }, timeout: r }; this.post(n, (t, e, a) => s(a)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), a = !s && this.fs.existsSync(e); if (!s && !a) return {}; { const a = s ? t : e; try { return JSON.parse(this.fs.readFileSync(a)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), a = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : a ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const a = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of a) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, a) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[a + 1]) >> 0 == +e[a + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, a] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, a, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, a, r] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(a), o = a ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), a) } catch (e) { const i = {}; this.lodash_set(i, r, t), s = this.setval(JSON.stringify(i), a) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, a) => { !t && s && (s.body = a, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, a) }); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: a, statusCode: r, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: a, statusCode: r, headers: i, rawBody: o, body: n }, n) }, t => { const { message: a, response: r } = t; e(a, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, a) => { !t && s && (s.body = a, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, a) }); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let a = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...i } = t; this.got[s](r, i).then(t => { const { statusCode: s, statusCode: r, headers: i, rawBody: o } = t, n = a.decode(o, this.encoding); e(null, { status: s, statusCode: r, headers: i, rawBody: o, body: n }, n) }, t => { const { message: s, response: r } = t; e(s, r, r && a.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let a = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in a) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? a[e] : ("00" + a[e]).substr(("" + a[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let a = t[s]; null != a && "" !== a && ("object" == typeof a && (a = JSON.stringify(a)), e += `${s}=${a}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", a = "", r) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } case "Loon": { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } case "Quantumult X": { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, a = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": a } } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, a, i(r)); break; case "Quantumult X": $notify(e, s, a, i(r)); break; case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), a && t.push(a), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, t.stack) } } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }