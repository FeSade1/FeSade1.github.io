async function loadDespTool() {
    const e = document.getElementById("sade-popup-container");
    if (e) {
        e.remove();
        return;
    }
    try {
        const t = await fetch("https://fesade1.github.io/DespTool/popup.html");
        const n = await t.text();
        const container = document.createElement("div");
        container.id = "sade-popup-container";
        document.body.appendChild(container);
        const shadow = container.attachShadow({
            mode: "open"
        });
        window.__SADE_SHADOW__ = shadow;
        shadow.innerHTML = n;
        shadow.querySelectorAll("script").forEach(oldScript => {
            const newScript = document.createElement("script");
            if (oldScript.src) {
                newScript.src = oldScript.src;
                newScript.async = false;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            shadow.appendChild(newScript);
            oldScript.remove();
        });
    } catch (e) {
        alert("Erro ao carregar popup");
        alert(e.message);
    }
}
loadDespTool()
