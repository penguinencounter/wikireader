window.addEventListener('load', () => {
    setInterval(() => {
        let divCounter = document.getElementById('div-counter');
        let count = document.querySelectorAll('div').length;
        divCounter.innerHTML = count;
    }, 500)
})