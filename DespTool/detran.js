async function emitirCRLV(p) {
    if (!p) {
        alert("Placa não informada");
        throw new Error("Placa não informada");
    }

    try {
        // 1. Buscar extrato
        const r1 = await fetch("https://www.veiculo.detran.pr.gov.br/detran-veiculos/consultarExtrato.do?action=consultar", {
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "content-type": "application/x-www-form-urlencoded"
            },
            body: `opcaoConsultaSelecionada=1&opcaoConsulta=1&placa=${p}&renavam=&chassi=`,
            method: "POST",
            mode: "no-cors"
        });

        const t = await r1.text();

        if (!t.includes("Acessar")) {
            alert("Não foi possível encontrar o Renavam");
            throw new Error("Renavam não encontrado");
        }

        const renavam = t.split("Renavam: ")[1].split("\n")[0].trim();

        // 2. Iniciar processo
        await fetch("https://www.veiculo.detran.pr.gov.br/detran-veiculos/emitirCRLVDigital.do?action=emitirCRLVDigital", {
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "content-type": "application/x-www-form-urlencoded"
            },
            referrer: "https://www.veiculo.detran.pr.gov.br/detran-veiculos/emitirCRLVDigital.do?action=iniciarProcesso",
            body: `placa=${p}&codRenavam=${renavam}`,
            method: "POST",
            mode: "no-cors",
            credentials: "include"
        });

        // 3. Gerar PDF
        const r3 = await fetch("https://www.veiculo.detran.pr.gov.br/detran-veiculos/emitirCRLVDigital.do?action=emitirPDFCRLVDigital", {
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "content-type": "application/x-www-form-urlencoded"
            },
            referrer: "https://www.veiculo.detran.pr.gov.br/detran-veiculos/emitirCRLVDigital.do?action=emitirCRLVDigital",
            body: `placa=${p}&codRenavam=${renavam}`,
            method: "POST",
            mode: "no-cors"
        });

        const contentType = r3.headers.get("Content-Type");

        if (contentType && contentType.includes("application/pdf")) {
            const blob = await r3.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `CRLV-e_${p}_${renavam}.pdf`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            window.open(url, "_blank");

            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } else {
            alert("Não gerou PDF");
            throw new Error("Resposta não é PDF");
        }

    } catch (err) {
        alert("Erro no emitirCRLV:", err);
        throw err; // IMPORTANTE → deixa o botão saber que falhou
    }
}

async function consultarCPF(cpf) {
    if (!cpf) {
        throw new Error("CPF não informado");
    }

    const cpfLimpo = cpf.replace(/[^\d]/g, "");

    if (!/^\d{11}$/.test(cpfLimpo)) {
        throw new Error("CPF inválido");
    }

    const url = `https://www.veiculo.detran.pr.gov.br/detran-veiculos/ajax.do?action=obterDadosCPFCNHAJAX&cpf=${cpfLimpo}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        const text = await response.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            return null;
        }

        if (!data || Object.keys(data).length === 0) {
            return null;
        }

        // Mapeamento das chaves
        const resultado = {
            registro: data.numRegistroCNH ?? null,
            uf: data.uf ?? null,
            nascimento: data.dataNasc ?? null,
            nome: data.nome ?? null,
            cpf: data.numCpf ?? null,
            pai: data.nomePai ?? null,
            validade: data.dataValidadeCNH ?? null,
            situacao: data.situacaoCNHFormatada ?? null,
            cedula: data.numCedulaCNH ?? null,
            mae: data.nomeMae ?? null,
            morto: data.morto ?? null
        };

        return resultado;

    } catch (erro) {
        alert("Erro ao consultar CPF:", erro);
        return null;
    }
}

async function consultarEndereco(cpf, codMunicipio) {
    if (!cpf) throw new Error("CPF/CNPJ não informado");
    if (!codMunicipio) throw new Error("Código do município não informado");

    const numeroCIC = cpf.replace(/[^\d]/g, "");

    if (![11, 14].includes(numeroCIC.length)) {
        throw new Error("CPF/CNPJ inválido");
    }

    const tipoNumeroCIC = numeroCIC.length === 11 ? "000" : "001";

    const url = `https://www.veiculo.detran.pr.gov.br/detran-veiculos/detranEndereco.do?action=ajaxViewListaDetranEnderecoPorCIC&numeroCIC=${numeroCIC}&tipoNumeroCIC=${tipoNumeroCIC}&chassi=CONSULTA&numProcesso=CONSULTA&codMunicipioUtrSolicitante=${codMunicipio}`;

    window.open(url, "_blank");
}


async function baixarVistoria(tipo = "pdf") {

    function sanitize(texto) {
        return texto
            .replaceAll(" ", "")
            .replaceAll("ô", "o")
            .replaceAll("-", "");
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            if (window.jspdf) return resolve();

            const script = document.createElement("script");
            script.src = url;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function toBase64(url) {
        return fetch(url)
            .then(res => res.blob())
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }));
    }

    // pegar turma
    const turma = document
        .querySelector("#canvas > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(2) > a > b")
        ?.textContent.trim();

    if (!turma) {
        alert("Essa função só funciona com a vistoria aberta!");
        return;
    }

    // pegar itens
    const items = [];
    document.querySelectorAll("#canvas li").forEach(li => {
        const src = li.querySelector("img")?.src;
        const nome = li.querySelector("strong")?.textContent.trim();

        if (src && nome) {
            items.push({ src, nome });
        }
    });

    if (!items.length) {
        alert("Nenhuma imagem encontrada. Atualize a página e tente novamente!");
        return;
    }

    // =========================
    // MODO 1 → JPG
    // =========================
    if (tipo === "foto") {
        items.forEach(({ src, nome }) => {
            const link = document.createElement("a");
            link.download = `${sanitize(nome)}-${sanitize(turma)}.jpg`;
            link.href = src.startsWith("data:") ? src : src + "?rand=" + Date.now();

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        return;
    }

    // =========================
    // MODO 2 → PDF
    // =========================
    if (tipo === "pdf") {

        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

        const { jsPDF } = window.jspdf;

        for (const item of items) {

            const base64 = item.src.startsWith("data:")
                ? item.src
                : await toBase64(item.src);

            const img = await loadImage(base64);

            const pdf = new jsPDF();

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const maxWidth = pageWidth - 20;
            const maxHeight = pageHeight - 20;

            let width = img.width;
            let height = img.height;

            const scale = Math.min(maxWidth / width, maxHeight / height);

            width *= scale;
            height *= scale;

            const x = (pageWidth - width) / 2;
            const y = (pageHeight - height) / 2;

            pdf.addImage(base64, "PNG", x, y, width, height);

            pdf.save(`${sanitize(item.nome)}-${sanitize(turma)}.pdf`);
        }

        return;
    }

    alert("Tipo inválido. Use 1 (JPG) ou 2 (PDF)");
}
