function requestExpandedContent(page) {
    const pageWNamespace = page.includes(":")?page:":"+page;
    return {
        action: "expandtemplates",
        text: `{{${pageWNamespace}}}`,
        prop: "wikitext"
    }
}

function searchWiki(query) {
    return {
        action: "query",
        list: "search",
        srsearch: query,
        srprop: "snippet",
        srlimit: "10"
    }
}

window.debugAccess = window.debugAccess??{};
window.debugAccess.actions = {
    requestExpandedContent: requestExpandedContent,
    searchWiki: searchWiki
};
window.bridge = window.bridge??{};
window.bridge.actions = {
    requestExpandedContent: requestExpandedContent,
    searchWiki: searchWiki
}
