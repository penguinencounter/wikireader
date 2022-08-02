import * as local from './local_connector.mjs';
import * as proxy from './proxy_connector.mjs';
import {BadInputError, requiresKeys} from './base.mjs';
import * as actions from './actions.mjs';


const TEST_SITE = "https://en.wikipedia.org";  // known works
const CONNECTION_KEYS = ['success', 'connectionType', 'apiTarget']


async function provideAccess(site, forcedTarget) {
    if (forcedTarget) {
        console.warn('Using forcedTarget is not recommended.')
        if (forcedTarget !== "local" && forcedTarget !== "proxy") throw new BadInputError("invalid connection type (parsing forced_target)")
        if (forcedTarget == "local") {
            let result = await local.guess_api(site)
            if (result == null) {
                console.warn(`${site} access failed (forced local)`)
                return { success: false }
            }
            return { success: true, connectionType: "local", apiTarget: local_result }
        } else if (forcedTarget == "proxy") {
            let result = await proxy.connect(site)
            if (result == null) {
                console.warn(`${site} access failed (forced proxy)`)
                return { success: false }
            }
            return { success: true, connectionType: "proxy", apiTarget: result }
        }
    }
    let localResult = await local.guess_api(site)
    if (localResult == null) {
        console.log(`local access failed for ${site}, trying proxy`)
        let proxyResult = await proxy.connect(site)
        if (proxyResult == null) {
            console.warn(`${site} access failed`)
            return {
                success: false
            }
        } else {
            return {
                success: true,
                connectionType: 'proxy',
                apiTarget: proxyResult
            }
        }
    } else {
        return {
            success: true,
            connectionType: 'local',
            apiTarget: localResult
        }
    }
}


async function lowQuery(connection, content) {
    if (!requiresKeys(connection, CONNECTION_KEYS)) throw new BadInputError("invalid connection data")
    if (!connection.success) throw new BadInputError("connection was not successful, can't do this")
    if (connection.connectionType == 'local') {
        return local.requestAt(connection.apiTarget, content)
    } else if (connection.connectionType == 'proxy') {
        return proxy.requestAt(connection.apiTarget, content)
    } else {
        throw new BadInputError("invalid connection type")
    }
}


function mergeDataStructure(obj1, obj2) {
    let result = {}
    for (let pair of Object.entries(obj1)) {
        result[pair[0]] = pair[1]
    }
    for (let pair of Object.entries(obj2)) {
        if (pair[1] instanceof Array) {
            result[pair[0]] = [...result[pair[0]], ...pair[1]]
        } else if (typeof pair[1] == 'object') {
            result[pair[0]] = mergeDataStructure(result[pair[0]], pair[1], depth + 1)
        } else {
            result[pair[0]] = pair[1]
        }
    }
    return result
}


async function queryWithContinues(connection, content) {
    // per MediaWiki bot policy, only one request at a time

    let result = await lowQuery(connection, content)
    if (result.continue == undefined) {
        return result
    }
    let merge_with = await queryWithContinues(connection, { ...content, ...result.continue })
    let merge_result = mergeDataStructure(result, merge_with)
    return merge_result
}


window.debugAccess = window.debugAccess??{};
window.debugAccess.connector = {
    provideAccess: provideAccess,
    lowQuery: lowQuery,
    queryWithContinues: queryWithContinues
};