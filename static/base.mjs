export class NotImplementedError extends Error {}
export class BadInputError extends Error {}

export function applyDefaults(target, source) {
    for (let pair of Object.entries(source)) {
        if (target[pair[0]] == undefined) {
            target[pair[0]] = pair[1];
        }
    }
    return target;
}

export function requiresKeys(target, required_keys) {
    for (let key of required_keys) {
        if (target[key] == undefined) {
            return false
        }
    }
    return true
}
