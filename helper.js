import { join } from "https://deno.land/std@0.130.0/path/mod.ts";
import { md5, sh, sh1, home, s2b, b2s, s2h, joinhostport, echo, splithostport } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";

var helper = {};

helper.init_instance = async (row) => {
    if (row.kind == 1 && row.enable_brook_wssserver == 2) {
        if (!row.domain) {
            throw "miss domain";
        }
        if (!row.cert) {
            throw "miss cert";
        }
        if (!row.certkey) {
            throw "miss certkey";
        }
        if (row.wssserver_kind == 2 || row.wssserver_kind == 3) {
            if (!row.ca) {
                throw "miss ca";
            }
        }
        // TODO: check common name == row.domain
    }
    if (row.kind == 2) {
        if (!row.single_port) {
            throw "miss single_port";
        }
        if (!row.domain) {
            throw "miss domain";
        }
        if (row.single_kind == 2 || row.single_kind == 3 || row.single_kind == 4) {
            if (!row.cert) {
                throw "miss cert";
            }
            if (!row.certkey) {
                throw "miss certkey";
            }
        }
        if (row.single_kind == 3 || row.single_kind == 4) {
            if (!row.ca) {
                throw "miss ca";
            }
        }
        if (row.single_kind == 2 || row.single_kind == 3 || row.single_kind == 4) {
            // TODO: check common name == row.domain
        }
    }
    if ((row.kind == 1 && row.enable_brook_wssserver == 2 && row.wssserver_kind != 3) || (row.kind == 2 && row.single_kind != 4)) {
        var [ip, _] = splithostport(row.address);
        var t = "A";
        if (ip.indexOf(":") != -1) {
            t = "AAAA";
        }
        if (Deno.build.os != "windows") {
            if ((await sh1(`dig +short -t ${t} ${row.domain} | head -n 1`)).trim() != ip) {
                throw `Please set ${row.domain} ${t} to ${ip} first`;
            }
        }
        if (Deno.build.os == "windows") {
            // TODO
        }
    }

    await Deno.mkdir(`${home(".brook-manager")}`, { recursive: true });

    var s = `hancock add --name ${s2h(row.address)} --server ${row.address} --user ${row.user}`;
    if (row.password) {
        s += ` --password ${row.password}`;
    }
    if (row.sshkey) {
        await Deno.writeFile(home(".brook-manager", s2h(row.address)) + ".sshkey", s2b(row.sshkey));
        s += ` --key ${home(".brook-manager", s2h(row.address)) + ".sshkey"}`;
    }
    await sh(s);
    await sh(`hancock ${s2h(row.address)} echo`);
    if ((await sh1(`hancock ${s2h(row.address)} whoami`)).trim() != "root") {
        throw `the user must be allowed to execute sudo without a password`;
    }
    await sh(`hancock ${s2h(row.address)} nami install brook.hancock nico jinbe`);
    if (row.ca) {
        await Deno.writeFile(home(".brook-manager", s2h(row.address)) + ".ca", s2b(row.ca));
        await sh(`hancock ${s2h(row.address)} upload ${home(".brook-manager", s2h(row.address)) + ".ca"}`);
    }
    if (row.cert) {
        await Deno.writeFile(home(".brook-manager", s2h(row.address)) + ".cert", s2b(row.cert));
        await sh(`hancock ${s2h(row.address)} upload ${home(".brook-manager", s2h(row.address)) + ".cert"}`);
    }
    if (row.certkey) {
        await Deno.writeFile(home(".brook-manager", s2h(row.address)) + ".certkey", s2b(row.certkey));
        await sh(`hancock ${s2h(row.address)} upload ${home(".brook-manager", s2h(row.address)) + ".certkey"}`);
    }
    if (row.kind == 2 && row.single_kind != 1) {
        await sh(`hancock ${s2h(row.address)} sh -c 'rm -rf /root/.nico && mkdir -p /root/.nico/ && cp /root/.nami/bin/${s2h(row.address)}.cert /root/.nico/${row.domain}.cert.pem && cp /root/.nami/bin/${s2h(row.address)}.certkey /root/.nico/${row.domain}.key.pem'`);
    }
    if (row.kind == 2) {
        await sh(`hancock ${s2h(row.address)} sh -c 'echo NICO_PORT=${row.single_port} > /root/.nico.env'`);
    }
};

helper.after_add_instance_single = async (row, users, key, site_domain) => {
    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var password = md5(`${key}${user.id}`);
        var path = md5(`${key}${user.username}`);

        var s = `hancock ${s2h(row.address)} joker brook wsserver --listen 127.0.0.1:${user.port0} --password ${password} --path /${path}${row.single_iswithoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"} --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
        if (Deno.env.get("dev")) {
            s = `hancock ${s2h(row.address)} joker brook wsserver --listen 127.0.0.1:${user.port0} --password ${password} --path /${path}${row.single_iswithoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"}`;
        }
        await sh(s);

        var s = `hancock ${s2h(row.address)} jinbe joker brook wsserver --listen 127.0.0.1:${user.port0} --password ${password} --path /${path}${row.single_iswithoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"} --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
        if (Deno.env.get("dev")) {
            s = `hancock ${s2h(row.address)} jinbe joker brook wsserver --listen 127.0.0.1:${user.port0} --password ${password} --path /${path}${row.single_iswithoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"}`;
        }
        await sh(s);

        var s = await sh1(`hancock ${s2h(row.address)} iptables -nvx -L`);
        if (s.indexOf(`tcp dpt:${user.port0}`) == -1) {
            await sh(`hancock ${s2h(row.address)} iptables -A INPUT -p tcp --dport ${user.port0}`);
        }
        await sh(`hancock ${s2h(row.address)} jinbe iptables -A INPUT -p tcp --dport ${user.port0}`);
        if (s.indexOf(`tcp spt:${user.port0}`) == -1) {
            await sh(`hancock ${s2h(row.address)} iptables -A OUTPUT -p tcp --sport ${user.port0}`);
        }
        await sh(`hancock ${s2h(row.address)} jinbe iptables -A OUTPUT -p tcp --sport ${user.port0}`);
    }

    var nicoid = 0;
    var l = (await sh1(`hancock ${s2h(row.address)} joker list`)).split("\n");
    l.forEach((v) => {
        var l1 = v.match(/\S+/g);
        if (!l1 || l1.length < 5) {
            return;
        }
        if (!l1[4].endsWith("nico")) {
            return;
        }
        nicoid = l1[0];
    });
    if (nicoid) {
        await sh(`hancock ${s2h(row.address)} joker stop ${nicoid}`);
    }
    var s = `hancock ${s2h(row.address)} joker nico`;
    users.forEach((v) => {
        var path = md5(`${key}${v.username}`);
        s += ` ${row.domain}/${path} http://127.0.0.1:${v.port0}`;
    });
    await sh(s);
    var nicoid = 0;
    var l = (await sh1(`hancock ${s2h(row.address)} jinbe list`)).split("\n");
    l.forEach((v) => {
        var l1 = v.match(/\S+/g);
        if (!l1 || l1.length < 3) {
            return;
        }
        if (!l1[2].endsWith("nico")) {
            return;
        }
        nicoid = l1[0];
    });
    if (nicoid) {
        await sh(`hancock ${s2h(row.address)} jinbe remove ${nicoid}`);
    }
    var s = `hancock ${s2h(row.address)} jinbe joker nico`;
    users.forEach((v) => {
        var path = md5(`${key}${v.username}`);
        s += ` ${row.domain}/${path} http://127.0.0.1:${v.port0}`;
    });
    await sh(s);
};

helper.after_add_instance_multi = async (row, users, key, site_domain) => {
    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var password = md5(`${key}${user.id}`);

        if (row.enable_brook_server == 2) {
            var s = `hancock ${s2h(row.address)} joker brook server --listen :${user.port1} --password ${password} --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
            if (Deno.env.get("dev")) {
                s = `hancock ${s2h(row.address)} joker brook server --listen :${user.port1} --password ${password}`;
            }
            await sh(s);

            var s = `hancock ${s2h(row.address)} jinbe joker brook server --listen :${user.port1} --password ${password} --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
            if (Deno.env.get("dev")) {
                s = `hancock ${s2h(row.address)} jinbe joker brook server --listen :${user.port1} --password ${password}`;
            }
            await sh(s);

            var s = await sh1(`hancock ${s2h(row.address)} iptables -nvx -L`);
            if (s.indexOf(`tcp dpt:${user.port1}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A INPUT -p tcp --dport ${user.port1}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A INPUT -p tcp --dport ${user.port1}`);
            if (s.indexOf(`tcp spt:${user.port1}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A OUTPUT -p tcp --sport ${user.port1}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A OUTPUT -p tcp --sport ${user.port1}`);
            if (s.indexOf(`udp dpt:${user.port1}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A INPUT -p udp --dport ${user.port1}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A INPUT -p udp --dport ${user.port1}`);
            if (s.indexOf(`udp spt:${user.port1}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A OUTPUT -p udp --sport ${user.port1}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A OUTPUT -p udp --sport ${user.port1}`);
        }

        if (row.enable_brook_wsserver == 2) {
            var s = `hancock ${s2h(row.address)} joker brook wsserver --listen :${user.port2} --password ${password} --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
            if (Deno.env.get("dev")) {
                s = `hancock ${s2h(row.address)} joker brook wsserver --listen :${user.port2} --password ${password}`;
            }
            await sh(s);

            var s = `hancock ${s2h(row.address)} jinbe joker brook wsserver --listen :${user.port2} --password ${password} --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
            if (Deno.env.get("dev")) {
                s = `hancock ${s2h(row.address)} jinbe joker brook wsserver --listen :${user.port2} --password ${password}`;
            }
            await sh(s);

            var s = await sh1(`hancock ${s2h(row.address)} iptables -nvx -L`);
            if (s.indexOf(`tcp dpt:${user.port2}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A INPUT -p tcp --dport ${user.port2}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A INPUT -p tcp --dport ${user.port2}`);
            if (s.indexOf(`tcp spt:${user.port2}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A OUTPUT -p tcp --sport ${user.port2}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A OUTPUT -p tcp --sport ${user.port2}`);
        }

        if (row.enable_brook_wssserver == 2) {
            var s = `hancock ${s2h(row.address)} joker brook wssserver --domainaddress ${row.domain}:${user.port3} --password ${password}${row.enable_brook_wssserver_withoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"} --cert /root/.nami/bin/${s2h(row.address)}.cert --certkey /root/.nami/bin/${s2h(row.address)}.certkey --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
            if (Deno.env.get("dev")) {
                s = `hancock ${s2h(row.address)} joker brook wssserver --domainaddress ${row.domain}:${user.port3} --password ${password}${row.enable_brook_wssserver_withoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"} --cert /root/.nami/bin/${s2h(row.address)}.cert --certkey /root/.nami/bin/${s2h(row.address)}.certkey`;
            }
            await sh(s);

            var s = `hancock ${s2h(row.address)} jinbe joker brook wssserver --domainaddress ${row.domain}:${user.port3} --password ${password}${row.enable_brook_wssserver_withoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"} --cert /root/.nami/bin/${s2h(row.address)}.cert --certkey /root/.nami/bin/${s2h(row.address)}.certkey --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
            if (Deno.env.get("dev")) {
                s = `hancock ${s2h(row.address)} jinbe joker brook wssserver --domainaddress ${row.domain}:${user.port3} --password ${password}${row.enable_brook_wssserver_withoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"} --cert /root/.nami/bin/${s2h(row.address)}.cert --certkey /root/.nami/bin/${s2h(row.address)}.certkey`;
            }
            await sh(s);

            var s = await sh1(`hancock ${s2h(row.address)} iptables -nvx -L`);
            if (s.indexOf(`tcp dpt:${user.port3}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A INPUT -p tcp --dport ${user.port3}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A INPUT -p tcp --dport ${user.port3}`);
            if (s.indexOf(`tcp spt:${user.port3}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A OUTPUT -p tcp --sport ${user.port3}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A OUTPUT -p tcp --sport ${user.port3}`);
        }
    }
};

helper.instance_single_add_user = async (instances, user, users, key, site_domain) => {
    var password = md5(`${key}${user.id}`);
    var path = md5(`${key}${user.username}`);

    for (var i = 0; i < instances.length; i++) {
        var row = instances[i];

        var s = `hancock ${s2h(row.address)} joker brook wsserver --listen 127.0.0.1:${user.port0} --password ${password} --path /${path}${row.single_iswithoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"} --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
        if (Deno.env.get("dev")) {
            s = `hancock ${s2h(row.address)} joker brook wsserver --listen 127.0.0.1:${user.port0} --password ${password} --path /${path}${row.single_iswithoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"}`;
        }
        await sh(s);

        var s = `hancock ${s2h(row.address)} jinbe joker brook wsserver --listen 127.0.0.1:${user.port0} --password ${password} --path /${path}${row.single_iswithoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"} --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
        if (Deno.env.get("dev")) {
            s = `hancock ${s2h(row.address)} jinbe joker brook wsserver --listen 127.0.0.1:${user.port0} --password ${password} --path /${path}${row.single_iswithoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"}`;
        }
        await sh(s);

        var s = await sh1(`hancock ${s2h(row.address)} iptables -nvx -L`);
        if (s.indexOf(`tcp dpt:${user.port0}`) == -1) {
            await sh(`hancock ${s2h(row.address)} iptables -A INPUT -p tcp --dport ${user.port0}`);
        }
        await sh(`hancock ${s2h(row.address)} jinbe iptables -A INPUT -p tcp --dport ${user.port0}`);
        if (s.indexOf(`tcp spt:${user.port0}`) == -1) {
            await sh(`hancock ${s2h(row.address)} iptables -A OUTPUT -p tcp --sport ${user.port0}`);
        }
        await sh(`hancock ${s2h(row.address)} jinbe iptables -A OUTPUT -p tcp --sport ${user.port0}`);

        var nicoid = 0;
        var l = (await sh1(`hancock ${s2h(row.address)} joker list`)).split("\n");
        l.forEach((v) => {
            var l1 = v.match(/\S+/g);
            if (!l1 || l1.length < 5) {
                return;
            }
            if (!l1[4].endsWith("nico")) {
                return;
            }
            nicoid = l1[0];
        });
        if (nicoid) {
            await sh(`hancock ${s2h(row.address)} joker stop ${nicoid}`);
        }
        var s = `hancock ${s2h(row.address)} joker nico`;
        users.forEach((v) => {
            var path = md5(`${key}${v.username}`);
            s += ` ${row.domain}/${path} http://127.0.0.1:${v.port0}`;
        });
        await sh(s);
        var nicoid = 0;
        var l = (await sh1(`hancock ${s2h(row.address)} jinbe list`)).split("\n");
        l.forEach((v) => {
            var l1 = v.match(/\S+/g);
            if (!l1 || l1.length < 3) {
                return;
            }
            if (!l1[2].endsWith("nico")) {
                return;
            }
            nicoid = l1[0];
        });
        if (nicoid) {
            await sh(`hancock ${s2h(row.address)} jinbe remove ${nicoid}`);
        }
        var s = `hancock ${s2h(row.address)} jinbe joker nico`;
        users.forEach((v) => {
            var path = md5(`${key}${v.username}`);
            s += ` ${row.domain}/${path} http://127.0.0.1:${v.port0}`;
        });
        await sh(s);
    }
};

helper.instance_multi_add_user = async (instances, user, users, key, site_domain) => {
    var password = md5(`${key}${user.id}`);

    for (var i = 0; i < instances.length; i++) {
        var row = instances[i];
        if (row.enable_brook_server == 2) {
            var s = `hancock ${s2h(row.address)} joker brook server --listen :${user.port1} --password ${password} --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
            if (Deno.env.get("dev")) {
                s = `hancock ${s2h(row.address)} joker brook server --listen :${user.port1} --password ${password}`;
            }
            await sh(s);

            var s = `hancock ${s2h(row.address)} jinbe joker brook server --listen :${user.port1} --password ${password} --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
            if (Deno.env.get("dev")) {
                s = `hancock ${s2h(row.address)} jinbe joker brook server --listen :${user.port1} --password ${password}`;
            }
            await sh(s);

            var s = await sh1(`hancock ${s2h(row.address)} iptables -nvx -L`);
            if (s.indexOf(`tcp dpt:${user.port1}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A INPUT -p tcp --dport ${user.port1}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A INPUT -p tcp --dport ${user.port1}`);
            if (s.indexOf(`tcp spt:${user.port1}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A OUTPUT -p tcp --sport ${user.port1}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A OUTPUT -p tcp --sport ${user.port1}`);
            if (s.indexOf(`udp dpt:${user.port1}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A INPUT -p udp --dport ${user.port1}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A INPUT -p udp --dport ${user.port1}`);
            if (s.indexOf(`udp spt:${user.port1}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A OUTPUT -p udp --sport ${user.port1}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A OUTPUT -p udp --sport ${user.port1}`);
        }

        if (row.enable_brook_wsserver == 2) {
            var s = `hancock ${s2h(row.address)} joker brook wsserver --listen :${user.port2} --password ${password} --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
            if (Deno.env.get("dev")) {
                s = `hancock ${s2h(row.address)} joker brook wsserver --listen :${user.port2} --password ${password}`;
            }
            await sh(s);

            var s = `hancock ${s2h(row.address)} jinbe joker brook wsserver --listen :${user.port2} --password ${password} --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
            if (Deno.env.get("dev")) {
                s = `hancock ${s2h(row.address)} jinbe joker brook wsserver --listen :${user.port2} --password ${password}`;
            }
            await sh(s);

            var s = await sh1(`hancock ${s2h(row.address)} iptables -nvx -L`);
            if (s.indexOf(`tcp dpt:${user.port2}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A INPUT -p tcp --dport ${user.port2}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A INPUT -p tcp --dport ${user.port2}`);
            if (s.indexOf(`tcp spt:${user.port2}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A OUTPUT -p tcp --sport ${user.port2}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A OUTPUT -p tcp --sport ${user.port2}`);
        }

        if (row.enable_brook_wssserver == 2) {
            var s = `hancock ${s2h(row.address)} joker brook wssserver --domainaddress ${row.domain}:${user.port3} --password ${password}${row.enable_brook_wssserver_withoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"} --cert /root/.nami/bin/${s2h(row.address)}.cert --certkey /root/.nami/bin/${s2h(row.address)}.certkey --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
            if (Deno.env.get("dev")) {
                s = `hancock ${s2h(row.address)} joker brook wssserver --domainaddress ${row.domain}:${user.port3} --password ${password}${row.enable_brook_wssserver_withoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"} --cert /root/.nami/bin/${s2h(row.address)}.cert --certkey /root/.nami/bin/${s2h(row.address)}.certkey`;
            }
            await sh(s);

            var s = `hancock ${s2h(row.address)} jinbe joker brook wssserver --domainaddress ${row.domain}:${user.port3} --password ${password}${row.enable_brook_wssserver_withoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"} --cert /root/.nami/bin/${s2h(row.address)}.cert --certkey /root/.nami/bin/${s2h(row.address)}.certkey --updateListInterval 86400 --blockDomainList https://${site_domain}/block/domain.txt --blockCIDR4List https://${site_domain}/block/cidr4.txt --blockCIDR6List https://${site_domain}/block/cidr6.txt`;
            if (Deno.env.get("dev")) {
                s = `hancock ${s2h(row.address)} jinbe joker brook wssserver --domainaddress ${row.domain}:${user.port3} --password ${password}${row.enable_brook_wssserver_withoutbrookprotocol == 1 ? "" : " --withoutBrookProtocol"} --cert /root/.nami/bin/${s2h(row.address)}.cert --certkey /root/.nami/bin/${s2h(row.address)}.certkey`;
            }
            await sh(s);

            var s = await sh1(`hancock ${s2h(row.address)} iptables -nvx -L`);
            if (s.indexOf(`tcp dpt:${user.port3}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A INPUT -p tcp --dport ${user.port3}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A INPUT -p tcp --dport ${user.port3}`);
            if (s.indexOf(`tcp spt:${user.port3}`) == -1) {
                await sh(`hancock ${s2h(row.address)} iptables -A OUTPUT -p tcp --sport ${user.port3}`);
            }
            await sh(`hancock ${s2h(row.address)} jinbe iptables -A OUTPUT -p tcp --sport ${user.port3}`);
        }
    }
};

helper.init_unmanaged_instance = async (row) => {
    var ports = row.ports
        .split(",")
        .map((v) => parseInt(v.trim()))
        .filter((v) => !isNaN(v));

    await Deno.mkdir(`${home(".brook-manager")}`, { recursive: true });

    var s = `hancock add --name ${s2h(row.address)} --server ${row.address} --user ${row.user}`;
    if (row.password) {
        s += ` --password ${row.password}`;
    }
    if (row.sshkey) {
        await Deno.writeFile(home(".brook-manager", s2h(row.address)) + ".sshkey", s2b(row.sshkey));
        s += ` --key ${home(".brook-manager", s2h(row.address)) + ".sshkey"}`;
    }
    await sh(s);
    await sh(`hancock ${s2h(row.address)} echo`);
    if ((await sh1(`hancock ${s2h(row.address)} whoami`)).trim() != "root") {
        throw `${b2s(stdout)} ${b2s(stderr)} the user must be allowed to execute sudo without a password`;
    }
    await sh(`hancock ${s2h(row.address)} nami install jinbe`);
    for (var i = 0; i < ports.length; i++) {
        var s = await sh1(`hancock ${s2h(row.address)} iptables -nvx -L`);
        if (s.indexOf(`tcp dpt:${ports[i]}`) == -1) {
            await sh(`hancock ${s2h(row.address)} iptables -A INPUT -p tcp --dport ${ports[i]}`);
        }
        await sh(`hancock ${s2h(row.address)} jinbe iptables -A INPUT -p tcp --dport ${ports[i]}`);
        if (s.indexOf(`tcp spt:${ports[i]}`) == -1) {
            await sh(`hancock ${s2h(row.address)} iptables -A OUTPUT -p tcp --sport ${ports[i]}`);
        }
        await sh(`hancock ${s2h(row.address)} jinbe iptables -A OUTPUT -p tcp --sport ${ports[i]}`);
        if (s.indexOf(`udp dpt:${ports[i]}`) == -1) {
            await sh(`hancock ${s2h(row.address)} iptables -A INPUT -p udp --dport ${ports[i]}`);
        }
        await sh(`hancock ${s2h(row.address)} jinbe iptables -A INPUT -p udp --dport ${ports[i]}`);
        if (s.indexOf(`udp spt:${ports[i]}`) == -1) {
            await sh(`hancock ${s2h(row.address)} iptables -A OUTPUT -p udp --sport ${ports[i]}`);
        }
        await sh(`hancock ${s2h(row.address)} jinbe iptables -A OUTPUT -p udp --sport ${ports[i]}`);
    }
};

export default helper;
