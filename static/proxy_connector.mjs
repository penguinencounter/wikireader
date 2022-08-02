import {applyDefaults} from './base.mjs';

export let pcon = {
    PROXY_ADDR: "",
    TEST_SITE: "https://en.wikipedia.org",
    DEFAULT_ARGS: {
        origin: "*",
        format: "json"
    },
    sites: {}
}


export async function connect(site) {
    const resp = await fetch(pcon.PROXY_ADDR + "/guess_api?site="+encodeURIComponent(site));
    const json = await resp.json();
    if (!json.ok) {
        return null;
    }
    return json.id;
}


export async function requestAt(site_id, content) {
    content = applyDefaults(content, pcon.DEFAULT_ARGS);
    var qparts=Object.keys(content).map(function(k){
        return [k,content[k]].map(encodeURIComponent).join("=");
    });
    var queryString=qparts.length?"?"+qparts.join("&"):"";
    const resp = await fetch(pcon.PROXY_ADDR + "/portal/" + site_id + "/do" + queryString);
    return await resp.json();
}

window.debugAccess = window.debugAccess??{};
window.debugAccess.proxyConnector = {
    connect: connect,
    requestAt: requestAt
};
