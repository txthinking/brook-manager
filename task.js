import { sh, sh1, s2h } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";
import helper from "./helper.js";

export async function ban(user_id) {
    var l = [];
    var vip = (await db.query("select * from vip where level=0 limit 1"))[0];
    l.push(vip.id);
    var uv = await db.query("select * from user_vip where user_id=? and expiration>?", [user_id, parseInt(Date.now() / 1000)]);
    uv.forEach((v) => l.push(v.vip_id));

    var rows = await db.query("select * from instance where isdeleted=1 and vip_id in ?", [l]);
    var user = await db.r("user", user_id);
    for (let j = 0; j < rows.length; j++) {
        var row = rows[j];
        var s = await sh1(`hancock ${s2h(row.address)} joker list`);
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
            await sh(`hancock ${s2h(row.address)} joker stop ${l1[0]}`);
        }
        var s = await sh1(`hancock ${s2h(row.address)} jinbe list`);
        var l = s.split("\n");
        for (var k = 0; k < l.length; k++) {
            var l1 = l[k].match(/\S+/g);
            if (!l1 || l1.length < 3) {
                continue;
            }
            if (l1[2].endsWith("nico")) {
                continue;
            }
            if (l[k].indexOf(`:${user.port0}`) == -1 && l[k].indexOf(`:${user.port1}`) == -1 && l[k].indexOf(`:${user.port2}`) == -1 && l[k].indexOf(`:${user.port3}`) == -1) {
                continue;
            }
            await sh(`hancock ${s2h(row.address)} jinbe remove ${l1[0]}`);
        }
    }
}

export async function recover(user_id) {
    var l = [];
    var vip = (await db.query("select * from vip where level=0 limit 1"))[0];
    l.push(vip.id);
    var uv = await db.query("select * from user_vip where user_id=? and expiration>?", [user_id, parseInt(Date.now() / 1000)]);
    uv.forEach((v) => l.push(v.vip_id));

    var rows = await db.query("select * from instance where isdeleted=1 and vip_id in ?", [l]);
    var user = await db.r("user", user_id);
    var users = await db.query("select * from user where baned=1");
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
}

export async function new_vip(user_id, vip_id) {
    var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
    var site_domain = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
    var instances = await db.query("select * from instance where vip_id=? and isdeleted=1", [vip_id]);
    var users = await db.query("select * from user where baned=1");
    var rows = await db.query("select * from user_vip");
    users = users.filter((v) => v.baned == 1 && rows.findIndex((vv) => vv.vip_id == vip_id && vv.user_id == v.id && vv.expiration > parseInt(Date.now() / 1000)) != -1);
    var user = await db.r("user", user_id);
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

export async function new_instance(instance_id) {
    var row = await db.r("instance", instance_id);
    var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
    var site_domain = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
    var vip = await db.r("vip", row.vip_id);
    var users = await db.query("select * from user where baned=1");
    if (vip.level != 0) {
        var rows = await db.query("select * from user_vip");
        users = users.filter((v) => rows.findIndex((vv) => vv.vip_id == vip.id && vv.user_id == v.id && vv.expiration > parseInt(Date.now() / 1000)) != -1);
    }
    if (row.kind == 1) {
        await helper.after_add_instance_multi(row, users, key, site_domain);
    }
    if (row.kind == 2) {
        await helper.after_add_instance_single(row, users, key, site_domain);
    }
}

export async function new_user(user_id) {
    var row = await db.r("user", user_id);
    var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
    var site_domain = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
    var vip = (await db.query("select * from vip where level=0 limit 1"))[0];
    var instances = await db.query("select * from instance where vip_id=? and isdeleted=1", [vip.id]);
    var users = await db.query("select * from user where baned=1");
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
}

export async function expiration(user_id, vip_id) {
    var user = await db.r("user", user_id);
    var rows = await db.query("select * from instance where isdeleted=1 and vip_id=?", [vip_id]);
    for (var j = 0; j < rows.length; j++) {
        var row = rows[j];
        var s = await sh1(`hancock ${s2h(row.address)} joker list`);
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
            await sh(`hancock ${s2h(row.address)} joker stop ${l1[0]}`);
        }
        var s = await sh1(`hancock ${s2h(row.address)} jinbe list`);
        var l = s.split("\n");
        for (var k = 0; k < l.length; k++) {
            var l1 = l[k].match(/\S+/g);
            if (!l1 || l1.length < 3) {
                continue;
            }
            if (l1[2].endsWith("nico")) {
                continue;
            }
            if (l[k].indexOf(`:${user.port0}`) == -1 && l[k].indexOf(`:${user.port1}`) == -1 && l[k].indexOf(`:${user.port2}`) == -1 && l[k].indexOf(`:${user.port3}`) == -1) {
                continue;
            }
            await sh(`hancock ${s2h(row.address)} jinbe remove ${l1[0]}`);
        }
    }
}

export async function transfer() {
    var rows = await db.query("select * from instance where isdeleted=1");
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var s = await sh1(`hancock ${s2h(row.address)} iptables -vxn -L`);
        var l = s.split("\n");
        for (var k = 0; k < l.length; k++) {
            var l1 = l[k].match(/\S+/g);
            if (!l1 || l1.length != 10 || (!l1[9].startsWith("dpt:") && !l1[9].startsWith("spt:"))) {
                continue;
            }
            var port = parseInt(l1[9].substring(4));
            var n = parseInt(parseInt(l1[1]) / 1024 / 1024);
            var users = await db.query("select * from user where port0=? or port1=? or port2=? or port3=?", [port, port, port, port]);
            if (!users.length) {
                continue;
            }
            await db.u("user", { id: users[0].id, transfer: users[0].transfer + n });
        }
        await sh(`hancock ${s2h(row.address)} iptables -Z INPUT`);
        await sh(`hancock ${s2h(row.address)} iptables -Z OUTPUT`);
    }
}

export async function unmanaged_transfer() {
    var rows = await db.query("select * from unmanaged_instance");
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var s = await sh1(`hancock ${s2h(row.address)} iptables -vxn -L`);
        var l = s.split("\n");
        for (var k = 0; k < l.length; k++) {
            var l1 = l[k].match(/\S+/g);
            if (!l1 || l1.length != 10 || (!l1[9].startsWith("dpt:") && !l1[9].startsWith("spt:"))) {
                continue;
            }
            var port = parseInt(l1[9].substring(4));
            if (
                row.ports
                    .split(",")
                    .map((v) => parseInt(v.trim()))
                    .findIndex((v) => v == port) == -1
            ) {
                continue;
            }
            var n = parseInt(l1[1]);
            var users = await db.query("select * from user where port0=? or port1=? or port2=? or port3=?", [port, port, port, port]);
            if (!users.length) {
                continue;
            }
            await db.u("user", { id: users[0].id, transfer: users[0].transfer + n });
        }
        await sh(`hancock ${s2h(row.address)} iptables -Z INPUT`);
        await sh(`hancock ${s2h(row.address)} iptables -Z OUTPUT`);
    }
}
