import { join } from "https://deno.land/std@0.130.0/path/mod.ts";
import httpserver from "https://raw.githubusercontent.com/txthinking/denolib/master/httpserver.js";
import { parse } from "https://deno.land/std@0.130.0/flags/mod.ts";
import mysql from "https://raw.githubusercontent.com/txthinking/denolib/master/mysql.js";
import crypto from "https://raw.githubusercontent.com/txthinking/denolib/master/crypto.js";
import helper from "./helper.js";
import mysqlmigrate from "./mysqlmigrate.js";
import localmigrate from "./localmigrate.js";
import adminapi from "./adminapi.js";
import userapi from "./userapi.js";
import cron from "./cron.js";
import readFileSync from "./bundle.js";
import localstorage from "./localstorage.js";
import { sh1, s2b, b2s, home, joinhostport, echo, splithostport } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";

// await localstorage.clear();

var args = parse(Deno.args);
if (args.v || args.version || args.h || args.help || (args.mysqladdress && (!args.mysqlusername || !args.mysqlpassword || !args.mysqldbname))) {
    echo("$ brook-manager --listen :8080 --ui default");
    echo("$ brook-manager --listen :8080 --ui default --mysqladdress 127.0.0.1:3306 --mysqlusername root --mysqlpassword 111111 --mysqldbname brook");
    echo(`v20220630`);
    Deno.exit(0);
}

await Deno.mkdir(`${home(".brook-manager")}`, { recursive: true });

if (!args.listen) {
    args.listen = ":8080";
    echo("listen on :8080");
}
if (!args.ui) {
    args.ui = "default";
    echo("default ui is activated");
}
var db = null;
if (args.mysqladdress) {
    var [h, p] = splithostport(args.mysqladdress);
    db = await mysql({
        hostname: h,
        port: p,
        username: args.mysqlusername,
        password: args.mysqlpassword,
        poolSize: 3,
        db: args.mysqldbname,
    });
    await mysqlmigrate(db);
}
if (!args.mysqladdress) {
    await localmigrate();
}

if (!db) {
    var key = JSON.parse(await localstorage.getItem("setting")).find((v) => v.k == "key").v;
}
if (db) {
    var key = (await db.query("select * from setting where k='key' limit 1"))[0].v;
}
var c = crypto(key);

httpserver.readfile = async (path) => {
    if (Deno.env.get("dev")) {
        return await Deno.readFile(join("static", args.ui, path));
    }
    return readFileSync(`static/${args.ui}${path}`);
};

adminapi(httpserver, db, c);
userapi(httpserver, db, c);
cron(db);

var [hostname, port] = splithostport(args.listen);
httpserver.run({ hostname, port });
