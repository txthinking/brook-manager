import helper from "./helper.js";
import { lock, lockport } from "./lock.js";
import { md5, ok, sh1, s2b, b2s, joinhostport, echo, splithostport } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";

export default async function (httpserver, db, c) {
    httpserver.path("/userapi/get_setting", async (r) => {
        var rows = await db.query("select * from setting where k='simulate_payment' or k='site_name' or k='site_telegram' or k='site_domain' or k='txthinking_payments' or k='recaptcha' or k='recaptcha_site_key'");
        return ok(rows);
    });
    httpserver.path("/userapi/signup", async (r) => {
        var j = await r.json();

        var recaptcha = (await db.query("select * from setting where k='recaptcha'"))[0].v;
        var recaptcha_secret_key = (await db.query("select * from setting where k='recaptcha_secret_key'"))[0].v;
        if (recaptcha == "true") {
            var res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    secret: recaptcha_secret_key,
                    response: j.recaptcha_token,
                }).toString(),
            });
            var r = await res.json();
            if (!r.success) {
                throw JSON.stringify(r);
            }
        }

        var row = (await db.query("select * from setting where k='site_domain'"))[0];
        if (!row.v) {
            throw "Please configure the site_domain before signup";
        }

        var row = (await db.query("select * from setting where k='enable_signup'"))[0];
        if (row.v != "true") {
            throw "Registration is temporarily closed. 注册暂时关闭。";
        }

        var rows = await db.query("select * from user where username=? limit 1", [j.username]);
        if (rows.length) {
            throw "Username exists";
        }
        var username = j.username;
        var password = md5(j.password);
        var row = await lockport(async () => {
            var p0 = (await db.query("select * from setting where k='start_port' limit 1"))[0].v;
            var p1 = (await db.query("select * from setting where k='last_port' limit 1"))[0].v;
            var port = p1 == 0 ? p0 : p1;
            var port0, port1, port2, port3;
            for (;;) {
                port++;
                if ((await db.query("select * from user where port0=? or port1=? or port2=? or port3=? limit 1", [port, port, port, port])).length == 0 && (await db.query("select * from instance where single_port=? or address like ? limit 1", [port, `%:${port}`])).length == 0) {
                    port0 = port;
                    break;
                }
            }
            for (;;) {
                port++;
                if ((await db.query("select * from user where port0=? or port1=? or port2=? or port3=? limit 1", [port, port, port, port])).length == 0 && (await db.query("select * from instance where single_port=? or address like ? limit 1", [port, `%:${port}`])).length == 0) {
                    port1 = port;
                    break;
                }
            }
            for (;;) {
                port++;
                if ((await db.query("select * from user where port0=? or port1=? or port2=? or port3=? limit 1", [port, port, port, port])).length == 0 && (await db.query("select * from instance where single_port=? or address like ? limit 1", [port, `%:${port}`])).length == 0) {
                    port2 = port;
                    break;
                }
            }
            for (;;) {
                port++;
                if ((await db.query("select * from user where port0=? or port1=? or port2=? or port3=? limit 1", [port, port, port, port])).length == 0 && (await db.query("select * from instance where single_port=? or address like ? limit 1", [port, `%:${port}`])).length == 0) {
                    port3 = port;
                    break;
                }
            }
            var row = await db.c("user", { username, password, port0, port1, port2, port3, transfer: 0 });
            return row;
        });
        var _ = async (db, row) => {
            var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
            var site_domain = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
            var vip = (await db.query("select * from vip where level=0 limit 1"))[0];
            var instances = await db.query("select * from instance where vip_id=? and isdeleted=1", [vip.id]);
            var users = await db.query("select * from user");
            await helper.instance_single_add_user(
                instances.filter((v) => v.kind == 2),
                row,
                users,
                key,
                site_domain
            );
            await helper.instance_multi_add_user(
                instances.filter((v) => v.kind == 1),
                row,
                users,
                key,
                site_domain
            );
        };
        lock(async () => {
            await _(db, row);
        });
        return ok();
    });
    httpserver.path("/userapi/signin", async (r) => {
        var j = await r.json();
        var username = j.username;
        var password = md5(j.password);
        var rows = await db.query("select * from user where username=? and password=? limit 1", [username, password]);
        if (!rows.length) {
            throw "Username or password is not correct";
        }
        var token = await c.encrypt("id", rows[0].id);
        return ok({
            token,
        });
    });
    httpserver.path("/userapi/get_user_row", async (r) => {
        var j = await r.json();
        var id = await c.decrypt("id", j.token);
        var row = await db.r("user", id);
        return ok(row);
    });
    httpserver.path("/userapi/update_password", async (r) => {
        var j = await r.json();
        var id = await c.decrypt("id", j.token);
        var password = md5(j.password);
        var row = await db.u("user", { id, password });
        return ok(row);
    });
    httpserver.path("/userapi/get_vip_rows", async (r) => {
        var rows = await db.query("select * from vip");
        return ok(rows);
    });
    httpserver.path("/userapi/get_product_rows", async (r) => {
        var rows = await db.query("select * from product where isdeleted = 1");
        return ok(rows);
    });
    httpserver.path("/userapi/create_payment", async (r) => {
        var j = await r.json();
        var id = await c.decrypt("id", j.token);
        var row = await db.r("user", id);
        if (row.baned == 2) {
            throw "Baned";
        }
        var p = await db.r("product", j.id);
        if (p.isdeleted == 2) {
            throw "Product does not exist";
        }
        if (j.method == "simulate_payment") {
            if ((await db.query("select * from setting where k='simulate_payment'"))[0].v != "true") {
                throw "This payment method closed";
            }
            var row = {
                user_id: id,
                product_id: j.id,
                paymentid: "",
                paymentmethod: j.method,
                status: 1,
            };
            row = await db.c("payment", row);
            return ok({
                url: `./simulate_payment.html?id=${row.id}`,
            });
        }
        if (j.method == "txthinking_payments") {
            if ((await db.query("select * from setting where k='txthinking_payments'"))[0].v != "true") {
                throw "This payment method closed";
            }
            var key = (await db.query("select * from setting where k='txthinking_payments_key' limit 1"))[0].v;
            var domain = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
            var row = {
                user_id: id,
                product_id: j.id,
                paymentid: "",
                paymentmethod: j.method,
                status: 1,
            };
            row = await db.c("payment", row);
            var res = await fetch("https://api.txthinking.com/payments/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    Key: key,
                    OrderID: row.id.toString(),
                    Webhook: `https://${domain}/userapi/payment_callback`,
                    USD: p.price_usd,
                }),
            });
            var q = new URLSearchParams(await res.json());
            return ok({
                url: `./cryptocurrency_payment.html?${q.toString()}`,
            });
        }
        throw "Invalid payment method";
    });
    httpserver.path("/userapi/payment_callback", async (r) => {
        var j = await r.json();
        var id = j.OrderID;
        var row = await db.r("payment", id);
        var key = (await db.query("select * from setting where k='txthinking_payments_key' limit 1"))[0].v;
        if (row.status == 2) {
            return ok();
        }
        var paymentid = "";
        if (row.paymentmethod == "txthinking_payments") {
            if (j.Key != key) {
                throw "Hacking";
            }
            paymentid = j.B + ":" + j.Txn;
        }
        row.status = 2;
        row.paymentid = paymentid;
        var p = await db.r("product", row.product_id);
        var uv = await db.query("select * from user_vip where user_id=? and vip_id=? limit 1", [row.user_id, p.vip_id]);
        if (!uv.length) {
            await db.c("user_vip", {
                user_id: row.user_id,
                vip_id: p.vip_id,
                expiration: parseInt(Date.now() / 1000) + p.duration,
            });
        }
        if (uv.length) {
            if (uv[0].expiration < parseInt(Date.now() / 1000)) {
                uv[0].expiration = parseInt(Date.now() / 1000);
            }
            uv[0].expiration += p.duration;
            await db.u("user_vip", uv[0]);
        }
        await db.u("payment", row);

        var _ = async (db, row) => {
            var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
            var site_domain = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
            var instances = await db.query("select * from instance where vip_id=? and isdeleted=1", [p.vip_id]);
            var users = await db.query("select * from user");
            var rows = await db.query("select * from user_vip");
            users = users.filter((v) => rows.findIndex((vv) => vv.vip_id == p.vip_id && vv.user_id == v.id && vv.expiration > parseInt(Date.now() / 1000)) != -1);
            var user = await db.r("user", row.user_id);
            await helper.instance_single_add_user(
                instances.filter((v) => v.kind == 2),
                user,
                users,
                key,
                site_domain
            );
            await helper.instance_multi_add_user(
                instances.filter((v) => v.kind == 1),
                user,
                users,
                key,
                site_domain
            );
        };
        lock(async () => {
            await _(db, row);
        });
        return ok();
    });
    httpserver.path("/userapi/get_user_vip_rows", async (r) => {
        var j = await r.json();
        var id = await c.decrypt("id", j.token);
        var rows = await db.query("select * from user_vip where user_id=? and expiration>?", [id, parseInt(Date.now() / 1000)]);
        return ok(rows);
    });
    httpserver.path("/block/domain.txt", async (r) => {
        var s = (await db.query("select * from setting where k='domainlist'"))[0].v;
        return new Response(s);
    });
    httpserver.path("/block/cidr4.txt", async (r) => {
        var s = (await db.query("select * from setting where k='cidr4list'"))[0].v;
        return new Response(s);
    });
    httpserver.path("/block/cidr6.txt", async (r) => {
        var s = (await db.query("select * from setting where k='cidr6list'"))[0].v;
        return new Response(s);
    });
    httpserver.path("/brook_link.txt", async (r) => {
        var id = await c.decrypt("id", new URL(r.url).searchParams.get("token"));
        var level = parseInt(new URL(r.url).searchParams.get("level"));

        var vip_id = (await db.query("select * from vip where level=? limit 1", [level]))[0].id;
        var user = await db.r("user", id);
        var key = (await db.query('select * from setting where k="key" limit 1'))[0].v;
        var password = md5(`${key}${user.id}`);
        var path = md5(`${key}${user.username}`);

        if (level != 0) {
            var rows = await db.query("select * from user_vip where user_id=? and vip_id=? and expiration>?", [id, vip_id, parseInt(Date.now() / 1000)]);
            if (!rows.length) {
                return new Response("");
            }
        }
        var rows = await db.query("select * from instance where isdeleted=1 and vip_id=?", [vip_id]);
        var l = [];
        rows.forEach((v) => {
            var [ip, _] = splithostport(v.address);
            if (v.kind == 1) {
                if (v.enable_brook_server == 2) {
                    var q = new URLSearchParams();
                    q.set("server", joinhostport(ip, user.port1));
                    q.set("password", password);
                    q.set("name", v.name);
                    l.push(`brook://server?${q.toString()}`);
                    q.set("udpovertcp", "true");
                    q.set("name", v.name + "(udpovertcp)");
                    l.push(`brook://server?${q.toString()}`);
                }
                if (v.enable_brook_wsserver == 2) {
                    var q = new URLSearchParams();
                    q.set("wsserver", "ws://" + joinhostport(ip, user.port2));
                    q.set("password", password);
                    q.set("name", v.name);
                    l.push(`brook://wsserver?${q.toString()}`);
                }
                if (v.enable_brook_wssserver == 2) {
                    var q = new URLSearchParams();
                    q.set("wssserver", "wss://" + joinhostport(v.domain, user.port3));
                    q.set("password", password);
                    q.set("address", joinhostport(ip, user.port3));
                    if (v.enable_brook_wssserver_withoutbrookprotocol == 2) {
                        q.set("withoutBrookProtocol", "true");
                    }
                    if (v.wssserver_kind == 2 || v.wssserver_kind == 3) {
                        q.set("ca", v.ca);
                    }
                    q.set("name", v.name);
                    l.push(`brook://wssserver?${q.toString()}`);
                }
            }
            if (v.kind == 2) {
                var q = new URLSearchParams();
                q.set("wssserver", "wss://" + joinhostport(v.domain, v.single_port) + "/" + path);
                q.set("password", password);
                q.set("address", joinhostport(ip, v.single_port));
                if (v.single_iswithoutbrookprotocol == 2) {
                    q.set("withoutBrookProtocol", "true");
                }
                if (v.single_kind == 3 || v.single_kind == 4) {
                    q.set("ca", v.ca);
                }
                q.set("name", v.name);
                l.push(`brook://wssserver?${q.toString()}`);
            }
        });
        var rows = await db.query("select * from brook_link where (vip_or_user=1 and vip_id=?) or (vip_or_user=2 and user_id=?)", [vip_id, id]);
        rows.forEach((v) => {
            l.push(v.brook_link);
        });
        return new Response(l.join("\n"));
    });
}
