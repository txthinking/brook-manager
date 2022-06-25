# brook-manager

A Web UI for fully automatic management of Brook. 一个全自动管理 Brook 的 Web UI

## [License. 协议](LICENSE)

| ⚠️ [License](LICENSE) | [协议](LICENSE) ⚠️ |
| --- | --- |
| [GPLv3 + Affiliate Agreement](LICENSE) | [GPLv3 + 附属协议](LICENSE) |

## Features. 功能

| Features  | 功能 |
| --- | --- |
| Fully automatic deployment of brook | 全自动部署 brook |
| User registration/payment/adding nodes will automatically trigger deployment brook | 用户注册/支付/添加节点会自动触发部署 brook |
| You never even need to log into the node machine | 你甚至永远不需要登录节点机器 |
| User registration | 用户注册 |
| Traffic Statistics | 流量统计 |
| Multi-port multi-user | 多端口多用户 |
| Single-port multi-user | 单端口多用户 |
| Audit rules | 审计规则 |
| multi-level lines | 多级别线路 |
| Multi-level VIP | 多级别VIP |
| Order and payment | 订单及支付 |
| Automatically generate subscription links | 自动生成订阅链接 |
| Ban/Restore User | 禁用/恢复用户 |
| One-line command deployment | 一行命令部署 |
| Built-in database | 内置数据库 |
| optional mysql database | 可选 mysql 数据库 |
| Reset all user traffic on the 1st of every month | 每月1号重置所有用户流量 |
| Automatically clear their nodes when users expire | 当用户到期自动清除其节点 |
| It also supports adding your own manual deployment brook link and traffic Statistics | 同时也支持添加你自己手动部署的 brook link 和流量统计 |
| ... | ... |

## Install. 安装 via [nami](https://github.com/txthinking/nami)


#### Requirements. 前提

Prepare a domain name to resolve to your server. 准备一个域名解析到你的服务器

#### 安装

```
nami install joker nico hancock mad brook-manager
```

#### 运行

with built-in database. 使用内置数据库

```
joker brook-manager --listen 127.0.0.1:8080 --ui default
```

or with mysql database, no need to create a database in advance. 或使用mysql数据库, 无需提前创建数据库

```
brook-manager --listen 127.0.0.1:8080 --ui default --mysqladdress 127.0.0.1:3306 --mysqlusername root --mysqlpassword 111111 --mysqldbname brook
```

then run nico. 然后运行nico

```
joker nico domain.com http://127.0.0.1:8080
```

#### 访问

https://domain.com

## Developer. 开发者

```
nami install hancock mad deno
git clone https://github.com/txthinking/brook-manager.git
cd brook-manager
export dev=1
deno run -A main.js --listen 127.0.0.1:8080 --ui default

# then open http://127.0.0.1:8080
```

### 文件介绍

```
├── adminapi.js     // admin api
├── build.sh
├── bundle.js
├── cron.js         // cron task
├── helper.js
├── LICENSE
├── localmigrate.js // local db migration
├── localstorage.js
├── lock.js
├── main.js         // entry
├── mysqlmigrate.js // mysql db migration
├── README.md
├── static/
│   └── default/    // default ui, you can create more ui
│       ├── account.html
│       ├── admin/  // admin ui
│       ├── cryptocurrency_payment.html
│       ├── index.html
│       ├── lang/
│       ├── signin.html
│       ├── signup.html
│       ├── simulate_payment.html
│       └── vip.html
└── userapi.js      // user api
```
