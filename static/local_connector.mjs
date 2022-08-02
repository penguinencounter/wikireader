import {applyDefaults} from './base.mjs'


export let lcon = {
    TEST_SITE: "https://en.wikipedia.org",
    HEADERS: new Headers(
        {
            "Api-User-Agent": `WikiReader/0.1 (on browser, code by en:PenguinEncounter2 miles.h.lin(at)gmail.com) js-fetch/?`,
        }
    ),
    DEFAULT_ARGS: {
        origin: "*",
        format: "json"
    },
    sites: {

    }
}


export async function guess_api(site) {
    // Guess API by hitting the site
    const TARGETS = [
        "/api.php",
        "/w/api.php"
    ]
    for (let target of TARGETS) {
        try {
            const resp = await fetch(site + target + "?origin=*", {
                headers: lcon.HEADERS
            });
            if (resp.ok) {
                return site + target;
            }
        } catch {}
    }
    return null;
}


export async function connect(site) {
    let api_target = await guess_api(site);
    if (api_target == null) {
        return null;
    }
    lcon.sites[site] = api_target;
    return api_target;
}


export async function requestAt(site, content) {
    content = applyDefaults(content, lcon.DEFAULT_ARGS)
    var qparts=Object.keys(content).map(function(k){
        return [k,content[k]].map(encodeURIComponent).join("=")
    })
    var queryString=qparts.length?"?"+qparts.join("&"):""

    const resp = await fetch(site + queryString, {
        headers: lcon.HEADERS
    })
    return await resp.json()
}

window.debugAccess = window.debugAccess??{};
window.debugAccess.localConnector = {
    guess_api: guess_api,
    connect: connect,
    requestAt: requestAt
};
