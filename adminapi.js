import helper from "./helper.js";
import { s2h, sh, sh1, b2s, echo, ok, err, home } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";

export default async function (httpserver, db, c) {
    httpserver.path("/adminapi/auth", async (r) => {
        var j = await r.json();
        var rows = await db.query('select * from setting where k="username" or k="password" limit 2');
        var u = rows.find((v) => v.k == "username").v;
        var p = rows.find((v) => v.k == "password").v;
        if (j.username != u || j.password != p) {
            throw "Username or password is not correct";
        }
        var token = await c.encrypt("token", "admin");
        return ok({
            token,
        });
    });
    httpserver.path("/adminapi/get_vip_rows", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var rows = await db.query("select * from vip");
        return ok(rows);
    });
    httpserver.path("/adminapi/get_user_vip_rows", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var rows = await db.query("select * from user_vip");
        return ok(rows);
    });
    httpserver.path("/adminapi/get_user_rows", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var rows = await db.query("select * from user");
        return ok(rows);
    });
    httpserver.path("/adminapi/get_payment_rows", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var rows = await db.query("select * from payment");
        return ok(rows);
    });
    httpserver.path("/adminapi/get_vip_row", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var row = await db.r("vip", j.id);
        return ok(row);
    });
    httpserver.path("/adminapi/save_vip_row", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        j.row.id = parseInt(j.row.id);
        if (isNaN(j.row.id)) {
            throw "id should be a number";
        }
        j.row.level = parseInt(j.row.level);
        if (isNaN(j.row.level) || j.row.level < 0 || j.row.level > 100) {
            throw "level should be a number >= 0 and <= 100";
        }
        j.row.isdeleted = parseInt(j.row.isdeleted);
        if (isNaN(j.row.isdeleted) || (j.row.isdeleted != 1 && j.row.isdeleted != 2)) {
            throw "isdeleted should be 1 or 2";
        }
        if (!j.row.id) {
            var row = j.row;
            row = await db.c("vip", row);
        } else {
            var row = await db.r("vip", j.row.id);
            if (j.row.level != row.level) {
                throw "You cannot change vip level";
            }
            if (j.row.level == 0 && j.row.isdeleted != 1) {
                throw "You cannot delete default free vip level";
            }
            var row = j.row;
            var row = await db.u("vip", row);
        }
        return ok(row);
    });
    httpserver.path("/adminapi/get_product_rows", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var rows = await db.query("select * from product");
        return ok(rows);
    });
    httpserver.path("/adminapi/get_product_row", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var row = await db.r("product", j.id);
        return ok(row);
    });
    httpserver.path("/adminapi/save_product_row", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        j.row.id = parseInt(j.row.id);
        if (isNaN(j.row.id)) {
            throw "id should be a number";
        }
        j.row.vip_id = parseInt(j.row.vip_id);
        if (isNaN(j.row.vip_id)) {
            throw "vip_id should be > 0";
        }
        j.row.price_yuan = parseInt(j.row.price_yuan);
        if (isNaN(j.row.price_yuan)) {
            throw "price_yuan should be a number";
        }
        j.row.price_usd = parseInt(j.row.price_usd);
        if (isNaN(j.row.price_usd)) {
            throw "price_usd should be a number";
        }
        j.row.duration = parseInt(j.row.duration);
        if (isNaN(j.row.duration)) {
            throw "duration should be a number";
        }
        j.row.isdeleted = parseInt(j.row.isdeleted);
        if (isNaN(j.row.isdeleted) || (j.row.isdeleted != 1 && j.row.isdeleted != 2)) {
            throw "isdeleted should be 1 or 2";
        }
        if (!j.row.id) {
            var row = j.row;
            if (!(await db.r("vip", row.vip_id))) {
                throw `vip_id ${row.vip_id} not exists`;
            }
            row = await db.c("product", row);
        } else {
            var row = j.row;
            if (!(await db.r("vip", row.vip_id))) {
                throw `vip_id ${row.vip_id} not exists`;
            }
            row = await db.u("product", row);
        }
        return ok(row);
    });
    httpserver.path("/adminapi/get_instance_rows", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var rows = await db.query("select * from instance");
        return ok(rows);
    });
    httpserver.path("/adminapi/get_instance_row", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var row = await db.r("instance", j.id);
        return ok(row);
    });
    httpserver.path("/adminapi/save_instance_row", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        if (j.row.id) {
            var row = await db.r("instance", j.row.id);
            if (row.isdeleted == 2) {
                throw "Can't restore deleted instance, but you can re-add new instance with same info";
            }
            var row = j.row;
            var row = await db.u("instance", { id: row.id, isdeleted: row.isdeleted });
        } else {
            if (j.row.kind == 2) {
                var rows = await db.query("select * from user where port0=? or port1=? or port2=? or port3=? limit 1", [j.row.single_port, j.row.single_port, j.row.single_port, j.row.single_port]);
                if (rows.length) {
                    throw "single_port is assigned to user, please select another port";
                }
            }
            var rows = await db.query("select * from instance where address=? and isdeleted=1 limit 1", [j.row.address]);
            if (rows.length) {
                throw `Please delete ${j.row.address} before re-add it`;
            }
            await helper.init_instance(j.row);
            var row = j.row;
            if (!(await db.r("vip", row.vip_id))) {
                throw `vip_id ${row.vip_id} not exists`;
            }
            row = await db.c("instance", row);
            var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
            var site_domain = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
            var vip = await db.r("vip", row.vip_id);
            var users = await db.query("select * from user");
            if (vip.level != 0) {
                var rows = await db.query("select * from user_vip");
                users = users.filter((v) => rows.findIndex((vv) => vv.vip_id == vip.id && vv.user_id == v.id && vv.expiration > parseInt(Date.now() / 1000)) != -1);
            }
            users = users.filter((v) => v.baned == 1);

            if (row.kind == 1) {
                await helper.after_add_instance_multi(row, users, key, site_domain);
            }
            if (row.kind == 2) {
                await helper.after_add_instance_single(row, users, key, site_domain);
            }
        }
        return ok(row);
    });
    httpserver.path("/adminapi/test_instance", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var rows = await db.query("select * from instance where address=? and isdeleted=1 limit 1", [j.row.address]);
        if (rows.length) {
            throw `Please delete ${j.row.address} before re-add it`;
        }
        await helper.init_instance(j.row);
        return ok();
    });
    httpserver.path("/adminapi/get_setting", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var rows = await db.query("select * from setting");
        return ok(rows);
    });
    httpserver.path("/adminapi/update_setting", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var row = j.kvs.find((v) => v.k == "site_domain");
        if (row && row.v) {
            if (!Deno.env.get("dev")) {
                if (/\d+\.\d+\.\d+\.\d+(:\d+)?/.test(r.headers.get("Host"))) {
                    throw "Please use nico to configure the domain name for the site before configuring site_domain";
                }
                if (/\[?\w*:\w*:\w*\]?(:\d+)?/.test(r.headers.get("Host"))) {
                    throw "Please use nico to configure the domain name for the site before configuring site_domain";
                }
            }
            if (r.headers.get("Host") != row.v) {
                throw `${r.headers.get("Host")} != ${row.v}`;
            }
        }
        var v = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
        if (v && row && v != row.v) {
            throw "Please don't change site_domain, will boom";
        }
        var kvs = j.kvs;
        for (var i = 0; i < kvs.length; i++) {
            await db.query("update setting set v=? where k=?", [kvs[i].v, kvs[i].k]);
        }
        return ok();
    });
    httpserver.path("/adminapi/mad", async (r) => {
        var rid = crypto.randomUUID().replace(/-/g, "");
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var p = Deno.run({
            cmd: ["mad", "ca", "--ca", home(".brook-manager", rid+".ca.pem"), "--key", home(".brook-manager", rid+".ca_key.pem"), "--organization", j.organization ?? "github.com/txthinking/mad", "--organizationUnit", j.organizationUnit ?? "github.com/txthinking/mad", "--commonName", j.commonName ?? "github.com/txthinking/mad"],
            stdout: "piped",
            stderr: "piped",
        });
        var [status, stdout, stderr] = await Promise.all([p.status(), p.output(), p.stderrOutput()]);
        p.close();
        if (status.code != 0) {
            throw `${b2s(stdout)} ${b2s(stderr)}`;
        }
        var p = Deno.run({
            cmd: ["mad", "cert", "--ca", home(".brook-manager", rid+".ca.pem"), "--ca_key", home(".brook-manager", rid+".ca_key.pem"), "--cert", home(".brook-manager", rid+".cert.pem"), "--key", home(".brook-manager", rid+".cert_key.pem"), "--organization", j.organization ?? "github.com/txthinking/mad", "--organizationUnit", j.organizationUnit ?? "github.com/txthinking/mad", "--domain", j.domain],
            stdout: "piped",
            stderr: "piped",
        });
        var [status, stdout, stderr] = await Promise.all([p.status(), p.output(), p.stderrOutput()]);
        p.close();
        if (status.code != 0) {
            throw `${b2s(stdout)} ${b2s(stderr)}`;
        }
        return ok({
            "ca.pem": b2s(await Deno.readFile(home(".brook-manager", rid+".ca.pem"))),
            "cert.pem": b2s(await Deno.readFile(home(".brook-manager", rid+".cert.pem"))),
            "cert_key.pem": b2s(await Deno.readFile(home(".brook-manager", rid+".cert_key.pem"))),
        });
    });
    httpserver.path("/adminapi/joker_list", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var row = await db.r("instance", j.id);
        var p = Deno.run({
            cmd: ["hancock", s2h(row.address), "joker", "list"],
            stdout: "piped",
            stderr: "piped",
        });
        var [status, stdout, stderr] = await Promise.all([p.status(), p.output(), p.stderrOutput()]);
        p.close();
        if (status.code != 0) {
            throw `${b2s(stdout)} ${b2s(stderr)}`;
        }
        return ok({ output: b2s(stdout) });
    });
    httpserver.path("/adminapi/add_brook_link", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        if (j.row.vip_or_user == 1) {
            if (!(await db.r("vip", j.row.vip_id))) {
                throw `vip_id ${j.row.vip_id} not exists`;
            }
        }
        if (j.row.vip_or_user == 2) {
            if (!(await db.r("user", j.row.user_id))) {
                throw `user_id ${j.row.user_id} not exists`;
            }
        }
        j.row = await db.c("brook_link", j.row);
        return ok(j.row);
    });
    httpserver.path("/adminapi/delete_brook_link", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        await db.d("brook_link", j.id);
        return ok();
    });
    httpserver.path("/adminapi/get_brook_link_rows", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var rows = await db.query("select * from brook_link");
        return ok(rows);
    });
    httpserver.path("/adminapi/add_unmanaged_instance", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var rows = await db.query("select * from instance where address=? and isdeleted=1 limit 1", [j.row.address]);
        if (rows.length) {
            throw `Please delete ${j.row.address} before re-add it`;
        }
        await helper.init_unmanaged_instance(j.row);
        j.row = await db.c("unmanaged_instance", j.row);
        return ok(j.row);
    });
    httpserver.path("/adminapi/delete_unmanaged_instance", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        await db.d("unmanaged_instance", j.id);
        return ok();
    });
    httpserver.path("/adminapi/get_unmanaged_instance_rows", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var rows = await db.query("select * from unmanaged_instance");
        return ok(rows);
    });
    httpserver.path("/adminapi/update_user_vip", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var row = await db.r("vip", j.vip_id);
        if (row.level == 0) {
            throw "Invalid vip_id";
        }
        var row = await db.r("user", j.user_id);
        var uv = await db.query("select * from user_vip where user_id=? and vip_id=? limit 1", [j.user_id, j.vip_id]);
        if (!uv.length) {
            await db.c("user_vip", {
                user_id: j.user_id,
                vip_id: j.vip_id,
                expiration: j.expiration,
            });
        }
        if (uv.length) {
            uv[0].expiration = j.expiration;
            await db.u("user_vip", uv[0]);
        }
        if (j.expiration > parseInt(Date.now() / 1000)) {
            var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
            var site_domain = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
            var instances = await db.query("select * from instance where vip_id=? and isdeleted=1", [j.vip_id]);
            var users = await db.query("select * from user");
            var rows = await db.query("select * from user_vip");
            users = users.filter((v) => rows.findIndex((vv) => vv.vip_id == j.vip_id && vv.user_id == v.id && vv.expiration > parseInt(Date.now() / 1000)) != -1);
            var user = await db.r("user", j.user_id);
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
        }
        return ok();
    });
    httpserver.path("/adminapi/ban_user", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var l = [];
        var vip = (await db.query("select * from vip where level=0 limit 1"))[0];
        l.push(vip.id);
        var uv = await db.query("select * from user_vip where user_id=? and expiration>?", [j.id, parseInt(Date.now() / 1000)]);
        uv.forEach((v) => l.push(v.vip_id));
        var user = await db.r("user", j.id);
        var rows = await db.query("select * from instance where isdeleted=1 and vip_id in ?", [l]);

        user.baned = 2;
        await db.u("user", user);
        for (let j = 0; j < rows.length; j++) {
            try {
                var row = rows[j];
                var p = Deno.run({
                    cmd: ["hancock", s2h(row.address), "joker", "list"],
                    stdout: "piped",
                    stderr: "piped",
                });
                var [status, stdout, stderr] = await Promise.all([p.status(), p.output(), p.stderrOutput()]);
                p.close();
                if (status.code != 0) {
                    throw `${b2s(stdout)} ${b2s(stderr)}`;
                }
                var s = b2s(stdout);
                var l = s.split("\n");
                for (var k = 0; k < l.length; k++) {
                    var l1 = l[k].match(/\S+/g);
                    if (!l1 || l1.length < 5) {
                        continue;
                    }
                    if (l1[4] == "nico") {
                        continue;
                    }
                    if (l[k].indexOf(`:${user.port0}`) == -1 && l[k].indexOf(`:${user.port1}`) == -1 && l[k].indexOf(`:${user.port2}`) == -1 && l[k].indexOf(`:${user.port3}`) == -1) {
                        continue;
                    }
                    var p = Deno.run({
                        cmd: ["hancock", s2h(row.address), "joker", "stop", l1[0]],
                        stdout: "piped",
                        stderr: "piped",
                    });
                    var [status, stdout, stderr] = await Promise.all([p.status(), p.output(), p.stderrOutput()]);
                    p.close();
                    if (status.code != 0) {
                        throw `${b2s(stdout)} ${b2s(stderr)}`;
                    }
                }
                // TODO remove jinbe
            } catch (e) {
                echo(e);
            }
        }
        return ok();
    });
    httpserver.path("/adminapi/recover_user", async (r) => {
        var j = await r.json();
        if ((await c.decrypt("token", j.token)) != "admin") {
            throw "Not admin token";
        }
        var l = [];
        var vip = (await db.query("select * from vip where level=0 limit 1"))[0];
        l.push(vip.id);
        var uv = await db.query("select * from user_vip where user_id=? and expiration>?", [j.id, parseInt(Date.now() / 1000)]);
        uv.forEach((v) => l.push(v.vip_id));
        var user = await db.r("user", j.id);
        var rows = await db.query("select * from instance where isdeleted=1 and vip_id in ?", [l]);

        var users = await db.query("select * from user");
        user.baned = 1;
        await db.u("user", user);
        var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
        var site_domain = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
        await helper.instance_single_add_user(
            rows.filter((v) => v.kind == 2),
            user,
            users,
            key,
            site_domain
        );
        await helper.instance_multi_add_user(
            rows.filter((v) => v.kind == 1),
            user,
            users,
            key,
            site_domain
        );
        return ok();
    });
}
