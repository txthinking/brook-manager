# brook-manager

A Web UI for fully automatic management of [Brook](https://github.com/txthinking/brook). 一个全自动管理 [Brook](https://github.com/txthinking/brook) 的 Web UI

## Features. 功能

| Features                                                                             | 功能                                                 |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Fully automatic deployment of brook                                                  | 全自动部署 brook                                     |
| User registration/payment/adding nodes will automatically trigger deployment brook   | 用户注册/支付/添加节点会自动触发部署 brook           |
| You never even need to log into the node machine                                     | 你甚至永远不需要登录节点机器                         |
| User registration                                                                    | 用户注册                                             |
| Traffic Statistics                                                                   | 流量统计                                             |
| Multi-port multi-user                                                                | 多端口多用户                                         |
| Single-port multi-user                                                               | 单端口多用户                                         |
| Audit rules                                                                          | 审计规则                                             |
| multi-level lines                                                                    | 多级别线路                                           |
| Multi-level VIP                                                                      | 多级别 VIP                                           |
| Order and payment                                                                    | 订单及支付                                           |
| Automatically generate subscription links                                            | 自动生成订阅链接                                     |
| Ban/Restore User                                                                     | 禁用/恢复用户                                        |
| One-line command deployment                                                          | 一行命令部署                                         |
| ~~Built-in database~~                                                                | ~~内置数据库~~                                       |
| MySQL database [Auth](https://github.com/denodrivers/mysql/issues/37#issuecomment-651771807)                                                                      | MySQL 数据库 [Auth](https://github.com/denodrivers/mysql/issues/37#issuecomment-651771807)                                        |
| Reset all user traffic on the 1st of every month                                     | 每月 1 号重置所有用户流量                            |
| Automatically clear their nodes when users expire                                    | 当用户到期自动清除其节点                             |
| It also supports adding your own manual deployment brook link and traffic Statistics | 同时也支持添加你自己手动部署的 brook link 和流量统计 |
| ...                                                                                  | ...                                                  |

## Install [nami](https://github.com/txthinking/nami)

#### Requirements

- Prepare a domain name to resolve to your server
- Prepare a mysql server by yourself
- And take care [mysql auth method](https://github.com/denodrivers/mysql/issues/37#issuecomment-651771807)

#### Install

```
nami install joker nico hancock mad brook-manager
```

#### Run

```
brook-manager --listen 127.0.0.1:8080 --ui default --mysqladdress 127.0.0.1:3306 --mysqlusername root --mysqlpassword 111111 --mysqldbname brook
```

The command above created a http server `http://127.0.0.1:8080`

You also need a web server for it, such as [nico](https://github.com/txthinking/nico).

Run as daemon, you may like [joker](https://github.com/txthinking/joker)

#### You Got

-   Admin: https://domain.com/admin/
-   User: https://domain.com

## Developer

```
nami install hancock mad 7z deno denobundle
git clone https://github.com/txthinking/brook-manager.git
cd brook-manager

export dev=1
deno run -Ar main.js --listen 127.0.0.1:8080 --ui default --mysqladdress 127.0.0.1:3306 --mysqlusername root --mysqlpassword 111111 --mysqldbname brook

# then open http://127.0.0.1:8080/admin/
# then open http://127.0.0.1:8080
```

### File introduction

```
├── adminapi.js     // admin api
├── build.sh
├── bundle.js
├── cron.js         // cron task
├── helper.js
├── LICENSE
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

## License

[LICENSE](https://github.com/txthinking/brook-manager/blob/master/LICENSE)
