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
| MySQL database [Auth](https://github.com/denodrivers/mysql/issues/37#issuecomment-651771807)                                                                      | MySQL 数据库 [Auth](https://github.com/denodrivers/mysql/issues/37#issuecomment-651771807)                                        |
| Reset all user traffic on the 1st of every month                                     | 每月 1 号重置所有用户流量                            |
| Automatically clear their nodes when users expire                                    | 当用户到期自动清除其节点                             |
| It also supports adding your own manual deployment brook link and traffic Statistics | 同时也支持添加你自己手动部署的 brook link 和流量统计 |
| ...                                                                                  | ...                                                  |

## Install [nami](https://github.com/txthinking/nami)

```
bash <(curl https://bash.ooo/nami.sh)
```

#### Install mysql

Here take Ubuntu 22.10 as an example, if there is a problem, you can google how to solve the problem of mysql installation and configuration

```
apt-get install mysql-server mysql-client
nami install mysql-init
mysql-init
systemctl restart mysql.service
```

Test via mysql client

```
mysql -h 127.0.0.1 -u root -p111111
```

#### Install brook-manager

```
nami install joker nico hancock mad brook-manager
```

#### Run brook-manager web server

Created a http server `http://127.0.0.1:8080`

```
brook-manager --listen 127.0.0.1:8080 --ui default --mysqladdress 127.0.0.1:3306 --mysqlusername root --mysqlpassword 111111 --mysqldbname brook
```

#### Run brook-manager task

```
brook-manager --task --mysqladdress 127.0.0.1:3306 --mysqlusername root --mysqlpassword 111111 --mysqldbname brook
```

#### Run a reverse proxy web server

Here is an example of nico, of course you need to prepare a domain name and resolve it to your server IP

```
nico domain.com http://127.0.0.1:8080
```

#### Daemon

You may like [joker](https://github.com/txthinking/joker)

#### Amdin URL

https://domain.com/admin/

#### User URL

https://domain.com

## I want to modify the code

```
nami install hancock mad 7z deno denobundle
git clone https://github.com/txthinking/brook-manager.git
cd brook-manager

dev=1 deno run -Ar main.js --listen 127.0.0.1:8080 --ui default --mysqladdress 127.0.0.1:3306 --mysqlusername root --mysqlpassword 111111 --mysqldbname brook
dev=1 deno run -Ar main.js --task --mysqladdress 127.0.0.1:3306 --mysqlusername root --mysqlpassword 111111 --mysqldbname brook

# then open http://127.0.0.1:8080/admin/
# then open http://127.0.0.1:8080
```

#### File introduction

```
├── adminapi.js     // admin api
├── userapi.js      // user api
├── cron.js         // cron
├── task.js         // task
├── main.js         // entry
├── mysqlmigrate.js // mysql db migration
├── static/
│   └── default/    // default ui, you can create more ui
│       ├── account.html
│       ├── admin/  // admin ui
│       ├── cryptocurrency_payment.html
│       ├── index.html
│       ├── lang/   // i18n
│       ├── signin.html
│       ├── signup.html
│       ├── simulate_payment.html
│       └── vip.html
```

## License

[LICENSE](https://github.com/txthinking/brook-manager/blob/master/LICENSE)
