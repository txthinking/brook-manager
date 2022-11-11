import { join } from "https://deno.land/std@0.130.0/path/mod.ts";
import httpserver from "https://raw.githubusercontent.com/txthinking/denolib/master/httpserver.js";
import { parse } from "https://deno.land/std@0.130.0/flags/mod.ts";
import mysql from "https://raw.githubusercontent.com/txthinking/denolib/master/mysql.js";
import crypto from "https://raw.githubusercontent.com/txthinking/denolib/master/crypto.js";
import helper from "./helper.js";
import mysqlmigrate from "./mysqlmigrate.js";
import adminapi from "./adminapi.js";
import userapi from "./userapi.js";
import cron from "./cron.js";
import readFileSync from "./bundle.js";
import { sleep, sh1, s2b, b2s, home, joinhostport, echo, splithostport } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";
import { ban, recover, new_vip, new_instance, new_user, expiration, transfer, unmanaged_transfer } from "./task.js";

var args = parse(Deno.args);
if (args.v || args.version || args.h || args.help || (!args.task && !args.listen) || (args.listen && !args.ui) || !args.mysqladdress || !args.mysqlusername || !args.mysqlpassword || !args.mysqldbname) {
    echo(`Run web server:`);
    echo("$ brook-manager --listen 127.0.0.1:8080 --ui default --mysqladdress 127.0.0.1:3306 --mysqlusername root --mysqlpassword 111111 --mysqldbname brook");
    echo(`Run task which read tasks and execute them:`);
    echo("$ brook-manager --task --mysqladdress 127.0.0.1:3306 --mysqlusername root --mysqlpassword 111111 --mysqldbname brook");
    echo(`v20221111`);
    Deno.exit(0);
}

if (args.listen){
    await Deno.mkdir(`${home(".brook-manager")}`, { recursive: true });

    var [h, p] = splithostport(args.mysqladdress);
    window.db = await mysql({
        hostname: h,
        port: p,
        username: args.mysqlusername,
        password: args.mysqlpassword,
        poolSize: 3,
        db: args.mysqldbname,
    });
    await mysqlmigrate(db);

    var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
    window.c = crypto(key);

    httpserver.readfile = async (path) => {
        if (Deno.env.get("dev")) {
            return await Deno.readFile(join("static", args.ui, path));
        }
        return readFileSync(`static/${args.ui}${path}`);
    };

    adminapi();
    userapi();
    cron();

    var [hostname, port] = splithostport(args.listen);
    httpserver.run({ hostname, port });
}

if (args.task){
    var [h, p] = splithostport(args.mysqladdress);
    window.db = await mysql({
        hostname: h,
        port: p,
        username: args.mysqlusername,
        password: args.mysqlpassword,
        poolSize: 3,
        db: args.mysqldbname,
    });
    for(;;){
        await sleep(1000);
        var rows = await db.query("select * from task where isdeleted=1 order by id asc limit 1");
        if(!rows.length){
            continue;
        }
        var row = rows[0];
        try{
            if(row.name == "ban"){
                var j = JSON.parse(row.data);
                await ban(j.user_id);
            }
            if(row.name == "recover"){
                var j = JSON.parse(row.data);
                await recover(j.user_id);
            }
            if(row.name == "new_vip"){
                var j = JSON.parse(row.data);
                await new_vip(j.user_id, j.vip_id);
            }
            if(row.name == "new_instance"){
                var j = JSON.parse(row.data);
                await new_instance(j.instance_id);
            }
            if(row.name == "new_user"){
                var j = JSON.parse(row.data);
                await new_user(j.user_id);
            }
            if(row.name == "expiration"){
                var j = JSON.parse(row.data);
                await expiration(j.user_id, j.vip_id);
            }
            if(row.name == "transfer"){
                await transfer();
            }
            if(row.name == "unmanaged_transfer"){
                await unmanaged_transfer();
            }
        }catch(e){
            echo(`task ${row.id} ${e}`);
        }
        row.isdeleted = 2;
        await db.u("task", row);
    }
}
