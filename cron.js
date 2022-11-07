import Cron from "https://cdn.jsdelivr.net/gh/hexagon/croner@4/src/croner.js";
import { b2s, s2h, echo } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";

export default function (db) {
    Cron("0 0 0 1 * *", async () => {
        try {
            await db.execute("update user set transfer=0");
        } catch (e) {
            echo(e);
        }
    });
    Cron("0 0 0 * * *", async () => {
        try {
            var uv = await db.query("select * from user_vip where expiration>0 and expiration<=?", [parseInt(Date.now() / 1000)]);
            for (var i = 0; i < uv.length; i++) {
                var user = await db.r("user", uv[i].user_id);
                var rows = await db.query("select * from instance where isdeleted=1 and vip_id=?", [uv[i].vip_id]);
                for (var j = 0; j < rows.length; j++) {
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
                }
                // TODO remove jinbe
                await db.u("user_vip", { id: uv[i].id, expiration: 0 });
            }
        } catch (e) {
            echo(e);
        }
    });
    Cron("0 0 * * * *", async () => {
        try {
            var rows = await db.query("select * from instance where isdeleted=1");
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var p = Deno.run({
                    cmd: ["hancock", s2h(row.address), "iptables", "-vxn", "-L"],
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
                var p = Deno.run({
                    cmd: ["hancock", s2h(row.address), "iptables", "-Z", "INPUT"],
                    stdout: "piped",
                    stderr: "piped",
                });
                var [status, stdout, stderr] = await Promise.all([p.status(), p.output(), p.stderrOutput()]);
                p.close();
                if (status.code != 0) {
                    throw `${b2s(stdout)} ${b2s(stderr)}`;
                }
                var p = Deno.run({
                    cmd: ["hancock", s2h(row.address), "iptables", "-Z", "OUTPUT"],
                    stdout: "piped",
                    stderr: "piped",
                });
                var [status, stdout, stderr] = await Promise.all([p.status(), p.output(), p.stderrOutput()]);
                p.close();
                if (status.code != 0) {
                    throw `${b2s(stdout)} ${b2s(stderr)}`;
                }
            }
        } catch (e) {
            echo(e);
        }
    });
    Cron("0 0 * * * *", async () => {
        try {
            var rows = await db.query("select * from unmanaged_instance");
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var p = Deno.run({
                    cmd: ["hancock", s2h(row.address), "iptables", "-vxn", "-L"],
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
                var p = Deno.run({
                    cmd: ["hancock", s2h(row.address), "iptables", "-Z", "INPUT"],
                    stdout: "piped",
                    stderr: "piped",
                });
                var [status, stdout, stderr] = await Promise.all([p.status(), p.output(), p.stderrOutput()]);
                p.close();
                if (status.code != 0) {
                    throw `${b2s(stdout)} ${b2s(stderr)}`;
                }
                var p = Deno.run({
                    cmd: ["hancock", s2h(row.address), "iptables", "-Z", "OUTPUT"],
                    stdout: "piped",
                    stderr: "piped",
                });
                var [status, stdout, stderr] = await Promise.all([p.status(), p.output(), p.stderrOutput()]);
                p.close();
                if (status.code != 0) {
                    throw `${b2s(stdout)} ${b2s(stderr)}`;
                }
            }
        } catch (e) {
            echo(e);
        }
    });
}
