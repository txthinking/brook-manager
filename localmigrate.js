import { encode as hexencode } from "https://deno.land/std@0.130.0/encoding/hex.ts";
import { randomBytes } from "https://deno.land/std@0.130.0/node/crypto.ts";
import localstorage from "./localstorage.js";

export default async function () {
    var s = await localstorage.getItem("setting");
    if (!s) {
        var rows = [];
        var id = 1;
        rows.push({
            id,
            k: "key",
            v: new TextDecoder().decode(hexencode(randomBytes(16))),
        });
        id = id + 1;
        rows.push({
            id,
            k: "username",
            v: "brook",
        });
        id = id + 1;
        rows.push({
            id,
            k: "password",
            v: "brook",
        });
        id = id + 1;
        rows.push({
            id,
            k: "simulate_payment",
            v: "true",
        });
        id = id + 1;
        rows.push({
            id,
            k: "start_port",
            v: "10000",
        });
        id = id + 1;
        rows.push({
            id,
            k: "site_name",
            v: "Your Site Name",
        });
        id = id + 1;
        rows.push({
            id,
            k: "last_port",
            v: "0",
        });
        id = id + 1;
        rows.push({
            id,
            k: "site_telegram",
            v: "https://t.me/yourgroup",
        });
        id = id + 1;
        rows.push({
            id,
            k: "site_domain",
            v: "",
        });
        id = id + 1;
        rows.push({
            id,
            k: "domainlist",
            v: "a.com\nb.com",
        });
        id = id + 1;
        rows.push({
            id,
            k: "cidr4list",
            v: "127.0.0.0/8\n10.0.0.0/8\n169.254.0.0/16\n172.16.0.0/12\n192.168.0.0/16\n224.0.0.0/4",
        });
        id = id + 1;
        rows.push({
            id,
            k: "cidr6list",
            v: "::1/128\n2400:da00::/32",
        });
        await localstorage.setItem("setting", JSON.stringify(rows));
    }
    var s = await localstorage.getItem("vip");
    var vip1id, vip2id;
    if (!s) {
        var rows = [];
        var id = 1;
        rows.push({
            id,
            name: "Free(免费)",
            level: 0,
            isdeleted: 1,
        });
        id = id + 1;
        rows.push({
            id,
            name: "Ordinary VIP(普通VIP)",
            level: 1,
            isdeleted: 1,
        });
        vip1id = id;
        id = id + 1;
        rows.push({
            id,
            name: "Premium VIP(高级VIP)",
            level: 2,
            isdeleted: 2,
        });
        vip2id = id;
        await localstorage.setItem("vip", JSON.stringify(rows));
    }
    var s = await localstorage.getItem("product");
    if (!s) {
        var rows = [];
        var id = 1;
        rows.push({
            id,
            vip_id: vip1id,
            name: "Ordinary VIP 1 month(普通VIP1个月)",
            price_yuan: 990,
            price_usd: 990,
            duration: 30 * 24 * 60 * 60,
            isdeleted: 1,
        });
        id = id + 1;
        rows.push({
            id,
            vip_id: vip1id,
            name: "Ordinary VIP 6 months(普通VIP6个月)",
            price_yuan: 5990,
            price_usd: 5990,
            duration: 6 * 30 * 24 * 60 * 60,
            isdeleted: 1,
        });
        id = id + 1;
        rows.push({
            id,
            vip_id: vip1id,
            name: "Ordinary VIP 12 months(普通VIP12个月)",
            price_yuan: 11990,
            price_usd: 11990,
            duration: 12 * 30 * 24 * 60 * 60,
            isdeleted: 1,
        });
        id = id + 1;
        rows.push({
            id,
            vip_id: vip2id,
            name: "Premium VIP 1 month(高级VIP1个月)",
            price_yuan: 990 * 2,
            price_usd: 990 * 2,
            duration: 30 * 24 * 60 * 60,
            isdeleted: 2,
        });
        id = id + 1;
        rows.push({
            id,
            vip_id: vip2id,
            name: "Premium VIP 6 months(高级VIP6个月)",
            price_yuan: 5990 * 2,
            price_usd: 5990 * 2,
            duration: 6 * 30 * 24 * 60 * 60,
            isdeleted: 2,
        });
        id = id + 1;
        rows.push({
            id,
            vip_id: vip2id,
            name: "Premium VIP 12 months(高级VIP12个月)",
            price_yuan: 11990 * 2,
            price_usd: 11990 * 2,
            duration: 12 * 30 * 24 * 60 * 60,
            isdeleted: 2,
        });
        await localstorage.setItem("product", JSON.stringify(rows));
    }
    var s = await localstorage.getItem("instance");
    if (!s) {
        await localstorage.setItem("instance", "[]");
    }
    var s = await localstorage.getItem("user");
    if (!s) {
        await localstorage.setItem("user", "[]");
    }
    var s = await localstorage.getItem("payment");
    if (!s) {
        await localstorage.setItem("payment", "[]");
    }
    var s = await localstorage.getItem("user_vip");
    if (!s) {
        await localstorage.setItem("user_vip", "[]");
    }
    var s = await localstorage.getItem("brook_link");
    if (!s) {
        await localstorage.setItem("brook_link", "[]");
    }
    var s = await localstorage.getItem("unmanaged_instance");
    if (!s) {
        await localstorage.setItem("unmanaged_instance", "[]");
    }
    var rows = JSON.parse(await localstorage.getItem("setting"));
    if (rows.findIndex((v) => v.k == "txthinking_payments") == -1) {
        var id = rows.length ? rows[rows.length - 1].id + 1 : 1;
        rows.push({
            id,
            k: "txthinking_payments",
            v: "false",
        });
        await localstorage.setItem("setting", JSON.stringify(rows));
    }
    var rows = JSON.parse(await localstorage.getItem("setting"));
    if (rows.findIndex((v) => v.k == "txthinking_payments_key") == -1) {
        var id = rows.length ? rows[rows.length - 1].id + 1 : 1;
        rows.push({
            id,
            k: "txthinking_payments_key",
            v: "",
        });
        await localstorage.setItem("setting", JSON.stringify(rows));
    }
    var rows = JSON.parse(await localstorage.getItem("setting"));
    if (rows.findIndex((v) => v.k == "recaptcha") == -1) {
        var id = rows.length ? rows[rows.length - 1].id + 1 : 1;
        rows.push({
            id,
            k: "recaptcha",
            v: "false",
        });
        await localstorage.setItem("setting", JSON.stringify(rows));
    }
    var rows = JSON.parse(await localstorage.getItem("setting"));
    if (rows.findIndex((v) => v.k == "recaptcha_site_key") == -1) {
        var id = rows.length ? rows[rows.length - 1].id + 1 : 1;
        rows.push({
            id,
            k: "recaptcha_site_key",
            v: "",
        });
        await localstorage.setItem("setting", JSON.stringify(rows));
    }
    var rows = JSON.parse(await localstorage.getItem("setting"));
    if (rows.findIndex((v) => v.k == "recaptcha_secret_key") == -1) {
        var id = rows.length ? rows[rows.length - 1].id + 1 : 1;
        rows.push({
            id,
            k: "recaptcha_secret_key",
            v: "",
        });
        await localstorage.setItem("setting", JSON.stringify(rows));
    }
    var rows = JSON.parse(await localstorage.getItem("setting"));
    if (rows.findIndex((v) => v.k == "enable_signup") == -1) {
        var id = rows.length ? rows[rows.length - 1].id + 1 : 1;
        rows.push({
            id,
            k: "enable_signup",
            v: "false",
        });
        await localstorage.setItem("setting", JSON.stringify(rows));
    }
    var rows = JSON.parse(await localstorage.getItem("user"));
    if(rows.length > 0 && !rows[0].baned){
        rows.forEach(v=>v.baned = 1);
        await localstorage.setItem("user", JSON.stringify(rows));
    }
}
