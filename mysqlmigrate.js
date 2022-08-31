import migrate from "https://raw.githubusercontent.com/txthinking/denolib/master/migrate.js";
import { encode as hexencode } from "https://deno.land/std@0.130.0/encoding/hex.ts";
import { randomBytes } from "https://deno.land/std@0.130.0/node/crypto.ts";

export default async function (db) {
    var mg = await migrate(db);

    await mg(
        "create setting table",
        `
    CREATE TABLE setting (
        id int(10) unsigned NOT NULL AUTO_INCREMENT,
        k varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        v varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        PRIMARY KEY (id),
        UNIQUE KEY (k)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`
    );
    await mg(
        "init key in setting table",
        `
insert into setting values(null, 'key', '${new TextDecoder().decode(hexencode(randomBytes(16)))}')
`
    );
    await mg(
        "init username in setting table",
        `
insert into setting values(null, 'username', 'brook')
`
    );
    await mg(
        "init password in setting table",
        `
insert into setting values(null, 'password', 'brook')
`
    );
    await mg(
        "init simulate_payment in setting table",
        `
insert into setting values(null, 'simulate_payment', 'true')
`
    );
    await mg(
        "init start_port in setting table",
        `
insert into setting values(null, 'start_port', '10000')
`
    );
    await mg(
        "init site_name in setting table",
        `
insert into setting values(null, 'site_name', 'Your Site Name')
`
    );
    await mg(
        "init last_port in setting table",
        `
insert into setting values(null, 'last_port', '0')
`
    );
    await mg(
        "init site_telegram in setting table",
        `
insert into setting values(null, 'site_telegram', 'https://t.me/yourgroup')
`
    );
    await mg(
        "init site_domain in setting table",
        `
insert into setting values(null, 'site_domain', '')
`
    );
    await mg(
        "init domainlist in setting table",
        `
insert into setting values(null, 'domainlist', 'a.com\nb.com')
`
    );
    await mg(
        "init cidr4list in setting table",
        `
insert into setting values(null, 'cidr4list', '127.0.0.0/8\n10.0.0.0/8\n169.254.0.0/16\n172.16.0.0/12\n192.168.0.0/16\n224.0.0.0/4')
`
    );
    await mg(
        "init cidr6list in setting table",
        `
insert into setting values(null, 'cidr6list', '::1/128\n2400:da00::/32')
`
    );

    await mg(
        "create vip table",
        `
    CREATE TABLE vip (
        id int(10) unsigned NOT NULL AUTO_INCREMENT,
        name varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        level int(10) NOT NULL default 0,
        isdeleted int(1) NOT NULL default 0,
        PRIMARY KEY (id),
        UNIQUE KEY (level)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`
    );
    await mg(
        "init vip0 in vip table",
        `
insert into vip values(1, 'Free(免费)', 0, 1)
`
    );
    await mg(
        "init vip1 in vip table",
        `
insert into vip values(2, 'Ordinary VIP(普通VIP)', 1, 1)
`
    );
    await mg(
        "init vip2 in vip table",
        `
insert into vip values(3, 'Premium VIP(高级VIP)', 2, 1)
`
    );

    await mg(
        "create product table",
        `
    CREATE TABLE product (
        id int(10) unsigned NOT NULL AUTO_INCREMENT,
        vip_id int(10) NOT NULL default 0,
        name varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        price_yuan int(10) NOT NULL default 0,
        price_usd int(10) NOT NULL default 0,
        duration int(10) NOT NULL default 0,
        isdeleted int(1) NOT NULL default 0,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`
    );
    await mg(
        "init p11 in product table",
        `
insert into product values(null, 2, 'Ordinary VIP 1 month(普通VIP1个月)', 990, 990, ${30 * 24 * 60 * 60}, 1)
`
    );
    await mg(
        "init p12 in product table",
        `
insert into product values(null, 2, 'Ordinary VIP 6 months(普通VIP6个月)', 5990, 5990, ${6 * 30 * 24 * 60 * 60}, 1)
`
    );
    await mg(
        "init p13 in product table",
        `
insert into product values(null, 2, 'Ordinary VIP 12 months(普通VIP12个月)', 11990, 11990, ${12 * 30 * 24 * 60 * 60}, 1)
`
    );
    await mg(
        "init p21 in product table",
        `
insert into product values(null, 3, 'Premium VIP 1 month(高级VIP1个月)', ${990 * 2},${990 * 2}, ${30 * 24 * 60 * 60}, 2)
`
    );
    await mg(
        "init p22 in product table",
        `
insert into product values(null, 3, 'Premium VIP 6 months(高级VIP6个月)', ${5990 * 2}, ${5990 * 2}, ${6 * 30 * 24 * 60 * 60}, 2)
`
    );
    await mg(
        "init p23 in product table",
        `
insert into product values(null, 3, 'Premium VIP 12 months(高级VIP12个月)', ${11990 * 2}, ${11990 * 2}, ${12 * 30 * 24 * 60 * 60}, 2)
`
    );

    await mg(
        "create instance table",
        `
    CREATE TABLE instance (
        id int(10) unsigned NOT NULL AUTO_INCREMENT,
        vip_id int(10) NOT NULL default 0,
        name varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        address varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        user varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        password varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        sshkey text,
        kind int(10) NOT NULL default 0, -- 1 multi-port/multi-user 2 single port/multi-user
        enable_brook_server int(10) NOT NULL default 0,
        enable_brook_wsserver int(10) NOT NULL default 0,
        enable_brook_wssserver int(10) NOT NULL default 0,
        enable_brook_wssserver_withoutbrookprotocol int(10) NOT NULL default 0,
        wssserver_kind int(10) NOT NULL default 0,
        single_port int(10) NOT NULL default 0,
        single_iswithoutbrookprotocol int(10) NOT NULL default 0,
        single_kind int(10) NOT NULL default 0,
        domain varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        cert text,
        certkey text,
        ca text,
        isdeleted int(10) NOT NULL default 0, -- 1 no 2 yes
        PRIMARY KEY (id)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`
    );

    await mg(
        "create user table",
        `
    CREATE TABLE user (
        id int(10) unsigned NOT NULL AUTO_INCREMENT,
        username varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        password varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        port0 int(10) NOT NULL default 0,
        port1 int(10) NOT NULL default 0,
        port2 int(10) NOT NULL default 0,
        port3 int(10) NOT NULL default 0,
        transfer int(10) NOT NULL default 0,
        PRIMARY KEY (id),
        UNIQUE KEY (port0),
        UNIQUE KEY (port1),
        UNIQUE KEY (port2),
        UNIQUE KEY (port3),
        UNIQUE KEY (username)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`
    );

    await mg(
        "create payment table",
        `
    CREATE TABLE payment (
        id int(10) unsigned NOT NULL AUTO_INCREMENT,
        user_id int(10) NOT NULL default 0,
        product_id int(10) NOT NULL default 0,
        paymentid varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        paymentmethod varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        status int(10) NOT NULL default 0,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`
    );

    await mg(
        "create user_vip table",
        `
    CREATE TABLE user_vip (
        id int(10) unsigned NOT NULL AUTO_INCREMENT,
        user_id int(10) NOT NULL default 0,
        vip_id int(10) NOT NULL default 0,
        expiration int(10) NOT NULL default 0,
        UNIQUE KEY (user_id, vip_id),
        PRIMARY KEY (id)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`
    );
    await mg(
        "create brook_link table",
        `
    CREATE TABLE brook_link (
        id int(10) unsigned NOT NULL AUTO_INCREMENT,
        vip_or_user int(10) NOT NULL default 0,
        user_id int(10) NOT NULL default 0,
        vip_id int(10) NOT NULL default 0,
        brook_link text,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`
    );

    await mg(
        "create unmanaged_instance table",
        `
    CREATE TABLE unmanaged_instance (
        id int(10) unsigned NOT NULL AUTO_INCREMENT,
        name varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        address varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        user varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        password varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL default '',
        sshkey text,
        ports text,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`
    );
    await mg(
        "init txthinking_payments in setting table",
        `
insert into setting values(null, 'txthinking_payments', 'false')
`
    );
    await mg(
        "init txthinking_payments_key in setting table",
        `
insert into setting values(null, 'txthinking_payments_key', '')
`
    );
    await mg(
        "transfer bigint ",
        `
alter table user change transfer transfer bigint not null default 0
`
    );
    await mg(
        "init recaptcha in setting table",
        `
insert into setting values(null, 'recaptcha', 'false')
`
    );
    await mg(
        "init recaptcha_site_key in setting table",
        `
insert into setting values(null, 'recaptcha_site_key', '')
`
    );
    await mg(
        "init recaptcha_secret_key in setting table",
        `
insert into setting values(null, 'recaptcha_secret_key', '')
`
    );
    await mg(
        "init enable_signup in setting table",
        `
insert into setting values(null, 'enable_signup', 'false')
`
    );
    // 1 not baned 2 banned
    await mg(
        "add baned in user table",
        `
alter table user add column baned int(11) not null default 1
`
    );
    await mg(
        "init announcement in setting table",
        `
insert into setting values(null, 'announcement', '')
`
    );
    await mg(
        "update setting v to text",
        `
alter table setting change v v text
`
    );
}
