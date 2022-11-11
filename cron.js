import Cron from "https://cdn.jsdelivr.net/gh/hexagon/croner@4/src/croner.js";
import { b2s, s2h, echo } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";

export default function () {
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
                await db.c("task", { name: 'expiration', user_id: uv[i].user_id, data: JSON.stringify({user_id: uv[i].user_id, vip_id: uv[i].vip_id}) });
                await db.u("user_vip", { id: uv[i].id, expiration: 0 });
            }
        } catch (e) {
            echo(e);
        }
    });
    Cron("0 0 * * * *", async () => {
        try {
            await db.c("task", { name: 'transfer', user_id: 0, data: '' });
        } catch (e) {
            echo(e);
        }
    });
    Cron("0 0 * * * *", async () => {
        try {
            await db.c("task", { name: 'unmanaged_transfer', user_id: 0, data: '' });
        } catch (e) {
            echo(e);
        }
    });
}
