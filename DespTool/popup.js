(function () {
  function fixEncoding(text) {
      return text
          .replace(/Ã§/g, "ç")
          .replace(/Ã£/g, "ã")
          .replace(/Ã¡/g, "á")
          .replace(/Ã©/g, "é")
          .replace(/Ã­/g, "í")
          .replace(/Ã³/g, "ó")
          .replace(/Ãº/g, "ú")
          .replace(/Ã‰/g, "É")
          .replace(/Ã€/g, "À")
          .replace(/Ã¢/g, "â")
          .replace(/Ãª/g, "ê")
          .replace(/Ã´/g, "ô");
  }

  async function carregarMunicipios() {
  try {
    const response = await fetch('https://fesade1.github.io/DespTool/municipios.json');
    if (!response.ok) throw new Error('Erro ao carregar municípios');
    
    const dados = await response.json();
    
    // O JSON esperado deve ser um array de objetos { "nome": "...", "cod": "..." }
    state.municipios = dados;
    console.log("Municípios carregados com sucesso.");
  } catch (err) {
    console.error("Falha ao buscar lista de municípios:", err);
    // Fallback básico caso o link falhe
    state.municipios = [
      { nome: "Curitiba", cod: "7535" },
      { nome: "Almirante Tamandaré", cod: "7407" }
    ];
  }
}



  function scanAndFix(node) {
      if (node.nodeType === Node.TEXT_NODE) {
          node.textContent = fixEncoding(node.textContent);
      } else {
          node.childNodes.forEach(scanAndFix);
      }
  }
  

  function observePopup(shadowRoot) {
      const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
              mutation.addedNodes.forEach(scanAndFix);
          });
      });

      observer.observe(shadowRoot, {
          childList: true,
          subtree: true
      });

      // Corrige o que já existe
      scanAndFix(shadowRoot);
  }
  const shadow = window.__SADE_SHADOW__;
  observePopup(shadow);
  if (!shadow) {
    alert("Shadow DOM não encontrado.");
    return;
  }
  shadow.querySelector("div").addEventListener("click",(e)=>{
    if (e.target === e.currentTarget) {
          document.getElementById("sade-popup-container").remove();
        }
  })

  // Namespace global seguro
  window.__SADE__ = window.__SADE__ || {};
  const state = window.__SADE__;

  // Estado persistente
  state.current = state.current || 'atalhos';
  state.selectedCidade = state.selectedCidade || null;
  state.municipios = state.municipios || [];
  
  state.atalhos = state.atalhos || [
    "Emitir CRLV",
    "Consultar CPF",
    "Consultar Endereços",
    //"Preparar dados OS",
    "Baixar vistoria"
  ];

  state.procuracoes = state.procuracoes || [
    "Procuração de Vendedor",
    "Procuração de Comprador",
    "Procuração de Condutor"
  ];

  const cidadeInput = shadow.getElementById('cidadeInput');
  const cidadeList = shadow.getElementById('cidadeList');

  function renderList() {
    const list = shadow.getElementById('list');
    if (!list) return;

    list.innerHTML = '';

    const items = state.current === 'atalhos'
      ? state.atalhos
      : state.procuracoes;

    items.forEach(text => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerText = text;
      div.onclick = () => handleItemClick(text);
      list.appendChild(div);
    });
  }

  function toggleSwitch() {
    const slider = shadow.getElementById('slider');
    const atalhosLabel = shadow.getElementById('atalhosLabel');
    const procuracoesLabel = shadow.getElementById('procuracoesLabel');

    if (state.current === 'atalhos') {
      state.current = 'procuracoes';
      if (slider) slider.style.left = '50%';
      atalhosLabel?.classList.remove('active');
      procuracoesLabel?.classList.add('active');
    } else {
      state.current = 'atalhos';
      if (slider) slider.style.left = '0%';
      atalhosLabel?.classList.add('active');
      procuracoesLabel?.classList.remove('active');
    }

    renderList();
  }

  function checkDomain() {
    if (!window.location.href.includes("veiculo.detran.pr.gov.br")) {
      alert("Este recurso só funciona no site do Detran PR.");
      return false;
    }
    return true;
  }

  async function handleItemClick(text) {
    text = fixEncoding(text);
    if (text === "Emitir CRLV") {
      if (!checkDomain()) return;
      openPage("Emitir CRLV", "emitirCRLVPage");
    }

    if (text === "Consultar CPF") {
      if (!checkDomain()) return;
      openPage("Consultar CPF", "consultarCPFPage");
    }

    if (text === "Consultar Endereços") {
      await carregarMunicipios();
      openPage("Consultar Endereços", "consultarEnderecoPage");
    }

    if (text === "Baixar vistoria") {
      openPage("Baixar vistoria", "vistoriaPage");
    }
  }

  function openPage(title, pageId) {
    shadow.getElementById('menu')?.style && (shadow.getElementById('menu').style.display = 'none');
    shadow.querySelectorAll('.page').forEach(p => p.style.display = 'none');

    const page = shadow.getElementById(pageId);
    if (page) page.style.display = 'flex';

    const titleEl = shadow.getElementById('title');
    if (titleEl) titleEl.innerText = title;

    const backBtn = shadow.getElementById('backBtn');
    if (backBtn) backBtn.style.display = 'block';
  }

  function goBack() {
    const menu = shadow.getElementById('menu');
    if (menu) menu.style.display = 'block';

    shadow.querySelectorAll('.page').forEach(p => p.style.display = 'none');

    const titleEl = shadow.getElementById('title');
    if (titleEl) titleEl.innerText = 'Sade.AIO- DespTool';

    const backBtn = shadow.getElementById('backBtn');
    if (backBtn) backBtn.style.display = 'none';
  }

  async function handleEmitirCRLV() {
    const placa = shadow.getElementById('placaInput')?.value;
    const btn = shadow.getElementById('emitirBtn');

    if (!placa) return alert("Digite a placa");
    if (!btn) return;

    try {
      // ativa loading
      btn.classList.add('loading');
      btn.disabled = true;
      btn.innerText = "Emitindo...";
      console.log(btn)
      // aguarda execução
      await emitirCRLV(placa);

    } catch (err) {
      console.error(err);
      alert("Erro ao emitir CRLV");
    } finally {
      // remove loading
      btn.innerText = "Emitir";
      btn.classList.remove('loading');
      btn.disabled = false;
      console.log(btn)
    }
  }

  async function handleCPF() {
    const cpf = shadow.getElementById('cpfInput')?.value;
    const btn = shadow.getElementById('cpfBtn');
    const resultContainer = shadow.getElementById('cpfResult');

    if (!cpf) return alert("Digite o CPF");
    if (!btn || !resultContainer) return;

    const orderedKeys = [
      "nome",
      "cpf",
      "nascimento",
      "uf",
      "morto",
      "registro",
      "cedula",
      "situacao",
      "validade",
      "pai",
      "mae"
    ];

    function formatKey(key) {
      return key.charAt(0).toUpperCase() + key.slice(1);
    }

    function formatValue(value) {
      if (value === null) return "ERRO";
      if (value === "true") return "Sim";
      if (value === "false") return "Não";
      return String(value);
    }

    try {
      // loading
      btn.classList.add('loading');
      btn.disabled = true;
      btn.innerText = "Consultando...";

      resultContainer.innerHTML = '';

      const data = await consultarCPF(cpf);
      console.log(data);

      orderedKeys.forEach(key => {
        const value = data[key];
        const displayValue = formatValue(value);

        const item = document.createElement('div');
        item.className = 'result-item';

        const text = document.createElement('span');
        text.innerText = `${formatKey(key)}: ${displayValue}`;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerText = "Copiar";

        copyBtn.onclick = () => {
          navigator.clipboard.writeText(displayValue);
          copyBtn.innerText = "Copiado!";
          setTimeout(() => copyBtn.innerText = "Copiar", 1000);
        };

        item.appendChild(text);
        item.appendChild(copyBtn);

        resultContainer.appendChild(item);
      });

    } catch (err) {
      console.error(err);
      alert("Erro ao consultar CPF");
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
      btn.innerText = "Consultar";
    }
  }


  function handleEndereco() {
    const doc = shadow.getElementById('docInput')?.value;
    if (!state.selectedCidade) return alert("Selecione um município");

    consultarEndereco(doc, state.selectedCidade.cod);
  }

  async function handleVistoria(tipo, btn) {
      if (!btn) return;

      const originalText = btn.innerText;

      try {
        btn.disabled = true;
        btn.innerText = "Baixando...";

        await baixarVistoria(tipo);

        btn.innerText = "✔";
      } catch (err) {
        console.error(err);
        btn.innerText = "Erro";
      }

      setTimeout(() => {
        btn.innerText = originalText;
        btn.disabled = false;
      }, 1000);
    }

  if (cidadeInput && cidadeList) {
    cidadeInput.addEventListener('input', () => {
      const value = cidadeInput.value.toLowerCase();
      cidadeList.innerHTML = '';

      const filtered = state.municipios.filter(m =>
        m.nome.toLowerCase().includes(value)
      );

      if (!value || filtered.length === 0) {
        cidadeList.style.display = 'none';
        return;
      }

      filtered.forEach(m => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.innerText = m.nome;

        div.onclick = () => {
          cidadeInput.value = m.nome;
          state.selectedCidade = m;
          cidadeList.style.display = 'none';
        };

        cidadeList.appendChild(div);
      });

      cidadeList.style.display = 'block';
    });

    shadow.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete')) {
        cidadeList.style.display = 'none';
      }
    });
  }

  window.__SADE__.toggleSwitch = toggleSwitch;
  window.__SADE__.goBack = goBack;
  window.__SADE__.handleEmitirCRLV = handleEmitirCRLV;
  window.__SADE__.handleCPF = handleCPF;
  window.__SADE__.handleEndereco = handleEndereco;
  window.__SADE__.handleVistoria = handleVistoria;

  renderList();
})();
