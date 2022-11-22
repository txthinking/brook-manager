import { echo, now, sh, sh1, s2h } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";
import helper from "./helper.js";

export async function new_instance(instance_id) {
    var row = await db.r("instance", instance_id);
    var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
    var site_domain = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
    var users = await db.query("select * from user where baned=1 and id in (select user_id from user_vip where vip_id=? and expiration>?) order by id asc", [row.vip_id, now()]);
    users = users.filter(v=>!v.instance_ids || v.instance_ids.split(':').length < 10).slice(0, 100);
    if(!users.length){
        return;
    }
    for(var i=0;i<users.length;i++){
        var row = await db.r("instance", instance_id);
        var user = users[i];
        row.user_ids = !row.user_ids ? `${user.id}` : row.user_ids + ':' + user.id;
        if(row.kind == 2){
            var l = await db.query("select * from user where id in ?", [row.user_ids.split(':')]);
            await helper.instance_single_add_user(row, user, key, site_domain, l);
        }
        if(row.kind == 1){
            await helper.instance_multi_add_user(row, user, key, site_domain);
        }
        await db.u('instance', {id: row.id, user_ids: row.user_ids});
        await db.u('user', {id: user.id, instance_ids: !user.instance_ids ? row.id : user.instance_ids + ':' + row.id});
    }
}

export async function delete_instance(instance_id) {
    var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
    var site_domain = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
    var row = await db.r("instance", instance_id);
    if(!row.user_ids){
        return;
    }
    var user_ids = row.user_ids.split(':');
    for(var j=0;j<user_ids.length;j++){
        var user = await db.r('user', user_ids[j]);
        user.instance_ids = user.instance_ids.split(':').filter(v=>v!=instance_id).join(':');
        await db.u('user', {id: user.id, instance_ids: user.instance_ids});
        var done = false;
        var instances = await db.query("select * from instance where vip_id=? and isdeleted=1 order by id asc", [row.vip_id]);
        try{
            for(var i=0;i<instances.length;i++){
                if(instances[i].user_ids && (instances[i].user_ids.split(':').length>=100 || instances[i].user_ids.split(':').indexOf(`${user.id}`) != -1)){
                    continue;
                }
                instances[i].user_ids = !instances[i].user_ids ? `${user.id}` : instances[i].user_ids + ':' + user.id;
                if(instances[i].kind == 2){
                    var users = await db.query("select * from user where id in ?", [instances[i].user_ids.split(':')]);
                    await helper.instance_single_add_user(instances[i], user, key, site_domain, users);
                }
                if(instances[i].kind == 1){
                    await helper.instance_multi_add_user(instances[i], user, key, site_domain);
                }
                await db.u('instance', {id: instances[i].id, user_ids: instances[i].user_ids});
                await db.u('user', {id: user.id, instance_ids: !user.instance_ids ? instances[i].id : user.instance_ids + ':' + instances[i].id});
                done = true;
                break;
            }
        }catch(e){
            echo(`${e}`);
        }
        if(!done){
            echo(`delete_instance ${instance_id} when migrate user ${user.id} to aother instance, but no seats left`);
        }
    }
}

export async function recover(user_id) {
    var rows = await db.query("select * from user_vip where user_id=? and expiration>?", [user_id, now()]);
    if(!rows.length){
        return;
    }
    await new_vip(user_id, rows[0].vip_id);
}

export async function new_vip(user_id, vip_id) {
    var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
    var site_domain = (await db.query("select * from setting where k='site_domain' limit 1"))[0].v;
    var instances = await db.query("select * from instance where vip_id=? and isdeleted=1 order by id asc", [vip_id]);
    var n = 0;
    for(var i=0;i<instances.length;i++){
        if(instances[i].user_ids && instances[i].user_ids.split(':').length>=100){
            continue;
        }
        try{
            var user = await db.r('user', user_id);
            instances[i].user_ids = !instances[i].user_ids ? `${user_id}` : instances[i].user_ids + ':' + user_id;
            if(instances[i].kind == 2){
                var users = await db.query("select * from user where id in ?", [instances[i].user_ids.split(':')]);
                await helper.instance_single_add_user(instances[i], user, key, site_domain, users);
            }
            if(instances[i].kind == 1){
                await helper.instance_multi_add_user(instances[i], user, key, site_domain);
            }
            await db.u('instance', {id: instances[i].id, user_ids: instances[i].user_ids});
            await db.u('user', {id: user.id, instance_ids: !user.instance_ids? instances[i].id : user.instance_ids + ':' + instances[i].id});
        }catch(e){
            echo(`${e}`);
            continue;
        }
        n++;
        if(n==10){
            break;
        }
    }
    if(n == 0){
        throw 'no seats left';
        return;
    }
    if(n < 10){
        throw 'not enough seats';
        return;
    }
}

export async function ban(user_id) {
    await expiration(user_id);
}

export async function expiration(user_id) {
    var user = await db.r("user", user_id);
    await db.u('user', {id: user.id, instance_ids: ''});
    var rows = await db.query("select * from instance where id in ?", [user.instance_ids ? user.instance_ids.split(':') : []]);
    for (var j = 0; j < rows.length; j++) {
        var row = rows[j];
        await db.u('instance', {id:row.id, user_ids: row.user_ids.split(':').filter(v=>v!=user.id).join(':')});
        try{
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
                await sh1(`hancock ${s2h(row.address)} joker stop ${l1[0]}`);
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
                await sh1(`hancock ${s2h(row.address)} jinbe remove ${l1[0]}`);
            }
        }catch(e){
            echo(`${e}`);
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
        await sh1(`hancock ${s2h(row.address)} iptables -Z INPUT`);
        await sh1(`hancock ${s2h(row.address)} iptables -Z OUTPUT`);
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
        await sh1(`hancock ${s2h(row.address)} iptables -Z INPUT`);
        await sh1(`hancock ${s2h(row.address)} iptables -Z OUTPUT`);
    }
}
