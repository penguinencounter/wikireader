window.addEventListener('load', () => {
    document.getElementById('state').innerHTML = "ready"
    document.getElementById('input').addEventListener('input', e => {
        let output = document.getElementById('output')
        try {
            let url = new URL(e.currentTarget.value);
            if (url.search.length === 0) {
                output.innerHTML = "no query"
            } else {
                let query = new URLSearchParams(url.search.substring(1))
                let result = {}
                for (let pair of query) {
                    result[pair[0]] = pair[1]
                }
                output.innerHTML = JSON.stringify(result, null, 2)
            }
        } catch {
            output.innerHTML = "invalid URL :("
        }
    })
})