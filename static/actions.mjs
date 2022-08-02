function requestExpandedContent(page) {
    const pageWNamespace = page.includes(":")?page:":"+page;
    return {
        action: "expandtemplates",
        text: `{{${pageWNamespace}}}`,
        prop: "wikitext"
    }
}

window.debugAccess = window.debugAccess??{};
window.debugAccess.actions = {
    requestExpandedContent: requestExpandedContent
};
