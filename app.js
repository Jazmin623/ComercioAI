const API_BASE_URL = ''; 

console.log("=== ComercioAI 安全版加载成功 ===");

let currentLang = 'zh'; 
const i18nDict = {
  zh: { dashboard: '工作台', parse: '询盘解析', reply: '商务回信', inquiry: '询盘管理', clients: '客户管理', terms: '术语知识库', analytics: '数据与反馈', userCenter: '用户中心', breadcrumbWorkspace: '工作区', pageDashboard: '工作台', subDashboard: 'Gestiona tus consultas comerciales', pageParse: '询盘解析', subParse: 'Análisis de consultas · Extrae información comercial con IA', pageTerms: '术语知识库', subTerms: '外贸 / 财税 / 物流 专业词汇查询', searchPlaceholder: '搜索西语或中文术语...', tagAll: '全部', tagTrade: '外贸', tagTax: '财税', tagLogistics: '物流', statWeek: '本周处理询盘', statPending: '待回复', statReplied: '已回复', titleFollowup: '今日跟进 (Follow-ups)', titleActivity: '最近客户活动', followup1: '3天前 · 询问 500 箱报价', followup2: '1周前 · 催促交货期', btnFollow: '去跟进', activity1: '查阅了报价单', activity2: '发送了新的询盘邮件', time10m: '10分钟前', time2h: '2小时前' },
  es: { dashboard: 'Panel', parse: 'Análisis de consultas', reply: 'Respuestas comerciales', inquiry: 'Gestión de consultas', clients: 'Clientes', terms: 'Glosario', analytics: 'Datos y comentarios', userCenter: 'Mi cuenta', breadcrumbWorkspace: 'Espacio de trabajo', pageDashboard: 'Panel de control', subDashboard: 'Gestiona tus consultas comerciales', pageParse: 'Análisis de consultas', subParse: 'Análisis de consultas · Extrae información comercial con IA', pageTerms: 'Glosario comercial', subTerms: 'Búsqueda de términos de comercio, fiscalidad y logística', searchPlaceholder: 'Buscar términos en español o chino...', tagAll: 'Todo', tagTrade: 'Comercio', tagTax: 'Fiscalidad', tagLogistics: 'Logística', statWeek: 'Consultas esta semana', statPending: 'Pendientes', statReplied: 'Respondidas', titleFollowup: 'Seguimiento de hoy', titleActivity: 'Actividad reciente', followup1: 'Hace 3 días · Solicitó cotización de 500 cajas', followup2: 'Hace 1 semana · Urgió fecha de entrega', btnFollow: 'Hacer seguimiento', activity1: 'revisó la cotización', activity2: 'envió una nueva consulta', time10m: 'Hace 10 min', time2h: 'Hace 2 horas' }
};

function applyLanguage(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18nDict[lang][key]) el.innerText = i18nDict[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18nDict[lang][key]) el.setAttribute('placeholder', i18nDict[lang][key]);
  });
}

document.getElementById('languageToggle')?.addEventListener('click', function() {
  currentLang = currentLang === 'zh' ? 'es' : 'zh';
  this.innerText = currentLang === 'zh' ? '中文 / ES' : 'ES / 中文';
  applyLanguage(currentLang);
});

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    try {
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
      const targetId = item.getAttribute('data-target');
      if (document.getElementById(targetId)) document.getElementById(targetId).classList.add('active');
      
      if (targetId === 'view-dashboard') loadDashboard();
      if (targetId === 'view-inquiry') loadInquiries();
      if (targetId === 'view-clients') loadClients();
      if (targetId === 'view-analytics') loadAnalytics();
    } catch(e) { console.error("导航切换出错:", e); }
  });
});
async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/inquiries`);
    const inquiries = await res.json();
    
    let total = inquiries.length;
    let pending = 0;
    let replied = 0;
    
    inquiries.forEach(inq => {
      if (inq.status === 'Nuevo' || inq.status === 'Pendiente de respuesta') pending++;
      if (inq.status === 'Respondido' || inq.status === 'En seguimiento' || inq.status === 'Ganado') replied++;
    });

    if(document.getElementById('dash-total-inq')) document.getElementById('dash-total-inq').innerText = total;
    if(document.getElementById('dash-pending')) document.getElementById('dash-pending').innerText = pending;
    if(document.getElementById('dash-replied')) document.getElementById('dash-replied').innerText = replied;

    const followupRes = await fetch(`${API_BASE_URL}/api/followups`);
    const followups = await followupRes.json();
    const followupContainer = document.getElementById('dash-followup-list');
    if (followupContainer) {
      followupContainer.innerHTML = "";
      const recentFollowups = followups.slice(0, 3); 
      
      if (recentFollowups.length === 0) {
        followupContainer.innerHTML = "<p style='color: var(--text-muted);'>暂无跟进任务。</p>";
      } else {
        recentFollowups.forEach(f => {
          followupContainer.innerHTML += `
            <div class="recent-item">
              <div>
                <h4>${f.customerName}</h4>
                <p>${f.date} · ${f.note.substring(0, 20)}...</p>
              </div>
              <button class="btn btn-secondary dash-followup-btn" data-client="${f.customerName}" style="padding: 6px 12px; font-size: 12px;">去跟进</button>
            </div>
          `;
        });
      }
    }

    const activityContainer = document.getElementById('dash-activity-list');
    if (activityContainer) {
      activityContainer.innerHTML = "";
      const recentInquiries = inquiries.slice(0, 3);
      
      if (recentInquiries.length === 0) {
         activityContainer.innerHTML = "<p style='color: var(--text-muted);'>暂无活动。</p>";
      } else {
        recentInquiries.forEach((inq, idx) => {
          const color = idx === 0 ? "var(--primary)" : "var(--success)";
          activityContainer.innerHTML += `
            <div class="timeline-item dash-activity-btn" data-client="${inq.customerName}" style="cursor: pointer; padding: 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
              <div class="timeline-dot" style="background: ${color};"></div>
              <div class="timeline-content">
                <p><strong>${inq.customerName}</strong> 提交了新的询盘 (${inq.product})</p>
                <span>${inq.createdAt}</span>
              </div>
            </div>
          `;
        });
      }
    }

  } catch(e) { console.error("加载工作台数据失败", e); }
}

document.body.addEventListener('click', (e) => {
  if (e.target.classList.contains('dash-followup-btn')) {
    loadClientDetail(e.target.getAttribute('data-client'));
  }
  const activityItem = e.target.closest('.dash-activity-btn');
  if (activityItem) {
    loadClientDetail(activityItem.getAttribute('data-client'));
  }
});
loadDashboard();
const parseBtn = document.getElementById('parseBtn');
const confirmBtn = document.getElementById('confirmBtn');
const fields = {
  product: document.getElementById('field-product'),
  quantity: document.getElementById('field-quantity'),
  deadline: document.getElementById('field-deadline'),
  incoterm: document.getElementById('field-incoterm'),
  port: document.getElementById('field-port'),
  finance: document.getElementById('field-finance')
};
const sampleText = "Hola, necesitamos 500 cajas de producto X. Por favor, envíenos su mejor precio FOB y las condiciones de pago. Normalmente trabajamos con un anticipo del 30% y el resto a 30 días. Esperamos su respuesta.";

document.getElementById('loadSampleBtn')?.addEventListener('click', () => { 
  if(document.getElementById('inquiryInput')) document.getElementById('inquiryInput').value = sampleText; 
});

document.getElementById('clearBtn')?.addEventListener('click', () => {
  if(document.getElementById('inquiryInput')) document.getElementById('inquiryInput').value = "";
  Object.values(fields).forEach(el => { if(el) el.value = ""; });
  if(confirmBtn) confirmBtn.disabled = true;
  const saveInquiryBtn = document.getElementById('saveInquiryBtn');
  if(saveInquiryBtn) saveInquiryBtn.disabled = true;
  const hintMsg = document.getElementById('hint-message');
  const hintList = document.getElementById('hint-list');
  if(hintMsg) hintMsg.style.display = 'inline-block';
  if(hintList) hintList.innerHTML = "<p style='color: var(--text-muted);'>点击解析后，系统将自动检测缺失的商务信息。</p>";
});

parseBtn?.addEventListener('click', async () => {
  const text = document.getElementById('inquiryInput')?.value.trim();
  if (!text) return alert("请先粘贴一段西语询盘！");

  parseBtn.innerText = "解析中...";
  parseBtn.disabled = true;
  if(confirmBtn) confirmBtn.disabled = true;
  const saveInquiryBtn = document.getElementById('saveInquiryBtn');
  if(saveInquiryBtn) saveInquiryBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/api/parse-inquiry`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    });
    const data = await response.json();

    Object.keys(fields).forEach(key => {
      if(fields[key]) fields[key].value = (data[key] && data[key] !== '未提及') ? data[key] : "";
    });

    let hintsHTML = "";
    let missingCount = 0;
    if (!fields.product?.value) { hintsHTML += `<p>缺少产品信息，建议向客户确认具体采购意向。</p>`; missingCount++; }
    if (!fields.quantity?.value) { hintsHTML += `<p>缺少采购数量，建议明确规模以便核算价格。</p>`; missingCount++; }
    if (!fields.deadline?.value) { hintsHTML += `<p>缺少交货时间，建议询问客户期望的交期。</p>`; missingCount++; }
    const incotermVal = fields.incoterm?.value.toUpperCase() || '';
    if ((incotermVal.includes('FOB') || incotermVal.includes('CIF')) && !fields.port?.value) {
      hintsHTML += `<p>客户要求 ${incotermVal} 报价，但未提供港口信息。建议确认装运港/目的港。</p>`; missingCount++;
    } else if (!fields.port?.value) {
      hintsHTML += `<p>缺少港口信息。</p>`; missingCount++;
    }
    if (!fields.finance?.value) { hintsHTML += `<p>付款条件尚未明确，建议向客户询问付款偏好。</p>`; missingCount++; }

    const hintMsg = document.getElementById('hint-message');
    const hintList = document.getElementById('hint-list');
    if (missingCount > 0) {
      if(hintMsg) hintMsg.style.display = 'inline-block';
      if(hintList) hintList.innerHTML = hintsHTML + `<p style="color:var(--text-muted); font-size:12px; margin-top:12px;">以上为业务辅助提示，具体条款仍需人工确认。</p>`;
    } else {
      if(hintMsg) hintMsg.style.display = 'none';
      if(hintList) hintList.innerHTML = `<p style="color:var(--success);">信息提取完整，请确认无误后生成回信。</p>`;
    }
    if(confirmBtn) confirmBtn.disabled = false;
    if(saveInquiryBtn) saveInquiryBtn.disabled = false;
  } catch (error) {
    alert("AI 请求失败，请检查后端！");
  } finally {
    parseBtn.innerText = "✦ AI 解析";
    parseBtn.disabled = false;
  }
});

confirmBtn?.addEventListener('click', async () => {
  const finalData = {
    product: fields.product?.value.trim() || "未提及", quantity: fields.quantity?.value.trim() || "未提及",
    deadline: fields.deadline?.value.trim() || "未提及", incoterm: fields.incoterm?.value.trim() || "未提及",
    port: fields.port?.value.trim() || "未提及", finance: fields.finance?.value.trim() || "未提及", tone: 'formal'
  };
  confirmBtn.innerText = "正在生成..."; confirmBtn.disabled = true;
  try {
    const replyResponse = await fetch(`${API_BASE_URL}/api/generate-reply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalData)
    });
    const replyData = await replyResponse.json();
    if (replyData.reply) {
       if(document.getElementById('replyEditor')) document.getElementById('replyEditor').value = replyData.reply;
       if(document.getElementById('emailSubject')) document.getElementById('emailSubject').value = `Confirmación - ${finalData.product}`;
       if(document.getElementById('reply-context')) document.getElementById('reply-context').innerHTML = `<p><strong>产品：</strong> ${finalData.product}</p><p><strong>数量：</strong> ${finalData.quantity}</p>`;
       document.querySelector('[data-target="view-reply"]')?.click();
    }
  } catch (error) { alert("生成失败！"); } finally { confirmBtn.innerText = "确认并生成回信"; confirmBtn.disabled = false; }
});
document.getElementById('regenerateBtn')?.addEventListener('click', async function() {
  const editor = document.getElementById('replyEditor');
  if (!editor || !editor.value) return alert("请先生成草稿！");
  this.innerText = "🔄 生成中..."; this.disabled = true;
  const contextHTML = document.getElementById('reply-context')?.innerHTML || "";
  const getVal = (label) => { const match = contextHTML.match(new RegExp(`<strong>${label}：</strong>([^<]+)`)); return match ? match[1].trim() : "未提及"; };
  const newData = { product: getVal('产品'), quantity: getVal('数量'), tone: document.getElementById('emailTone')?.value || 'formal' };
  try {
    const res = await fetch(`${API_BASE_URL}/api/generate-reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newData) });
    const data = await res.json();
    if(data.reply) { editor.value = data.reply; editor.style.backgroundColor = "#f0fdf4"; setTimeout(() => editor.style.backgroundColor = "#ffffff", 500); }
  } catch(e) {} finally { this.innerText = "🔄 根据语气重新生成"; this.disabled = false; }
});

document.getElementById('copyReplyBtn')?.addEventListener('click', () => { 
  const editor = document.getElementById('replyEditor');
  if (editor) { navigator.clipboard.writeText(editor.value); alert("已复制"); }
});
document.getElementById('saveDraftBtn')?.addEventListener('click', () => { 
  const editor = document.getElementById('replyEditor');
  if (editor) { localStorage.setItem('savedDraft', editor.value); alert("已保存"); }
});
const termSearch = document.getElementById('termSearch');
const termListContainer = document.getElementById('termList');
const tagChips = document.querySelectorAll('.tag-chip');
let currentTag = '全部';
let termData = [
  { es: "pago", zh: "付款/支付", example: "El pago debe realizarse en 30 días.", tag: "财税" },
  { es: "anticipo", zh: "预付款", example: "Se requiere un anticipo del 30%.", tag: "财税" },
  { es: "plazo de entrega", zh: "交货期", example: "El plazo de entrega es de 30 días.", tag: "物流" }
];

function renderTerms(data) {
  if(!termListContainer) return;
  termListContainer.innerHTML = data.length === 0 ? "<p style='color: gray;'>没有找到相关术语。</p>" : ""; 
  data.forEach(item => {
    termListContainer.innerHTML += `<article class="term-card"><h3 class="term-es">${item.es}</h3><p class="term-zh">${item.zh}</p><p class="term-example">Ejemplo: ${item.example}</p><span class="term-tag">${item.tag}</span></article>`;
  });
}
if(termListContainer) renderTerms(termData);

tagChips.forEach(chip => {
  chip.addEventListener('click', () => {
    tagChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentTag = chip.innerText;
    if(termSearch) termSearch.value = '';
    renderTerms(termData.filter(item => (currentTag === '全部') || (item.tag === currentTag)));
  });
});

if (termSearch) {
  termSearch.addEventListener('input', () => {
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(async () => {
      const keyword = termSearch.value.toLowerCase().trim();
      const localData = termData.filter(item => item.es.toLowerCase().includes(keyword) || item.zh.toLowerCase().includes(keyword));
      if (localData.length > 0 || keyword === '') {
        renderTerms(localData);
      } else {
        termListContainer.innerHTML = `<p style='color: var(--primary); font-weight: bold;'>🔍 正在呼叫 AI 智能查词，请稍候...</p>`;
        try {
          const response = await fetch(`${API_BASE_URL}/api/ai-lookup`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword: keyword })
          });
          const data = await response.json();
          if(data.es) { renderTerms([data]); } else { termListContainer.innerHTML = `<p style='color: gray;'>没有找到 "${keyword}" 的相关释义。</p>`; }
        } catch(err) { termListContainer.innerHTML = "<p style='color: red;'>AI 请求失败，请确保终端 node server.js 是开着的。</p>"; }
      }
    }, 800); 
  });
}
let allInquiriesData = []; 

async function loadInquiries() {
  const tbody = document.getElementById('inquiry-table-body');
  if (!tbody) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/inquiries`);
    allInquiriesData = await response.json();
    renderInquiryTable();
  } catch (err) { console.error(err); }
}

function renderInquiryTable() {
  const tbody = document.getElementById('inquiry-table-body');
  if (!tbody) return;
  const keyword = document.getElementById('inquirySearch')?.value.toLowerCase().trim() || '';
  const statusFilter = document.getElementById('inquiryStatusFilter')?.value || 'all';

  const filtered = allInquiriesData.filter(inq => {
    const matchSearch = inq.id.toLowerCase().includes(keyword) || inq.customerName.toLowerCase().includes(keyword) || (inq.product && inq.product.toLowerCase().includes(keyword));
    const matchStatus = statusFilter === 'all' || inq.status === statusFilter;
    return matchSearch && matchStatus;
  });

  tbody.innerHTML = filtered.length === 0 ? "<tr><td colspan='7' style='padding: 32px; text-align: center; color: var(--text-muted);'>没有找到匹配的询盘记录。</td></tr>" : "";
  
  filtered.forEach(inq => {
    tbody.innerHTML += `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 16px 24px; font-weight: 600;">${inq.id}</td>
        <td style="padding: 16px 24px;">${inq.customerName}</td>
        <td style="padding: 16px 24px;">${inq.product}</td>
        <td style="padding: 16px 24px;">${inq.quantity}</td>
        <td style="padding: 16px 24px; color: var(--text-muted);">${inq.createdAt}</td>
        <td style="padding: 16px 24px;">
          <select onchange="updateInquiryStatus('${inq.id}', this.value)" style="padding: 4px; border-radius: 4px; border: 1px solid var(--border); background: white; font-weight: 600; color: var(--primary); cursor: pointer;">
            <option value="Nuevo" ${inq.status === 'Nuevo' ? 'selected' : ''}>Nuevo</option>
            <option value="Pendiente de respuesta" ${inq.status === 'Pendiente de respuesta' ? 'selected' : ''}>Pendiente</option>
            <option value="Respondido" ${inq.status === 'Respondido' ? 'selected' : ''}>Respondido</option>
            <option value="En seguimiento" ${inq.status === 'En seguimiento' ? 'selected' : ''}>En seguimiento</option>
            <option value="Ganado" ${inq.status === 'Ganado' ? 'selected' : ''}>Ganado</option>
            <option value="Cerrado" ${inq.status === 'Cerrado' ? 'selected' : ''}>Cerrado</option>
          </select>
        </td>
        <td style="padding: 16px 24px; text-align: right;">
          <button class="btn btn-secondary view-client-btn" data-client="${inq.customerName}" style="padding: 4px 10px; font-size: 12px; margin-right: 4px;">查看</button>
          <button class="btn btn-secondary delete-inquiry-btn" data-id="${inq.id}" style="padding: 4px 10px; font-size: 12px; color: var(--danger); border-color: var(--danger);">删除</button>
        </td>
      </tr>`;
  });
}

window.updateInquiryStatus = async function(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/inquiries/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      loadDashboard(); 
    } else {
      alert("更新状态失败，请检查后端。");
    }
  } catch (e) { alert("网络错误"); }
};

document.getElementById('inquirySearch')?.addEventListener('input', renderInquiryTable);
document.getElementById('inquiryStatusFilter')?.addEventListener('change', renderInquiryTable);

document.body.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-inquiry-btn')) {
    const id = e.target.getAttribute('data-id');
    if (confirm(`⚠️ 确定要删除询盘 ${id} 吗？`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inquiries/${id}`, { method: 'DELETE' });
        if (res.ok) { alert("✅ 已删除"); loadInquiries(); }
      } catch (err) { alert("删除失败"); }
    }
  }
});

document.getElementById('saveInquiryBtn')?.addEventListener('click', async function() {
  const dataToSave = {
    product: fields.product?.value.trim() || "未提及", quantity: fields.quantity?.value.trim() || "未提及",
    deadline: fields.deadline?.value.trim() || "未提及", incoterm: fields.incoterm?.value.trim() || "未提及",
    port: fields.port?.value.trim() || "未提及", finance: fields.finance?.value.trim() || "未提及",
    customerName: prompt("请输入客户名称：", "Carlos") || "匿名客户"
  };
  this.innerText = "保存中..."; this.disabled = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/inquiries`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSave)
    });
    if (response.ok) { alert(`✅ 保存成功！`); document.querySelector('[data-target="view-inquiry"]')?.click(); }
  } catch (err) { alert("网络错误"); } finally { this.innerText = "💾 保存至询盘库"; this.disabled = false; }
});

async function loadClients() {
  const tbody = document.getElementById('client-table-body');
  if (!tbody) return;
  try {
    const inqRes = await fetch(`${API_BASE_URL}/api/inquiries`);
    const inquiries = await inqRes.json();
    const custRes = await fetch(`${API_BASE_URL}/api/customers`);
    const customers = await custRes.json();

    const clientMap = {};
    inquiries.forEach(inq => {
      if (!clientMap[inq.customerName]) clientMap[inq.customerName] = { count: 0, lastDate: inq.createdAt };
      clientMap[inq.customerName].count++;
    });

    tbody.innerHTML = customers.length === 0 ? "<tr><td colspan='4' style='padding: 32px; text-align: center; color: var(--text-muted);'>暂无客户档案。</td></tr>" : "";
    
    customers.forEach(cust => {
      const stats = clientMap[cust.name] || { count: 0, lastDate: '暂无询盘' };
      tbody.innerHTML += `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 16px 24px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 32px; height: 32px; background: var(--primary-light); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">${cust.name.charAt(0).toUpperCase()}</div>
              <div><div style="font-weight: 600;">${cust.name}</div><div style="font-size: 12px; color: var(--text-muted);">${cust.company || '-'} · ${cust.country || '-'}</div></div>
            </div>
          </td>
          <td style="padding: 16px 24px;">${stats.count} 条</td>
          <td style="padding: 16px 24px; color: var(--text-muted);">${stats.lastDate}</td>
          <td style="padding: 16px 24px; text-align: right;">
            <button class="btn btn-secondary view-client-btn" data-client="${cust.name}" style="padding: 4px 10px; font-size: 12px;">查看档案</button>
          </td>
        </tr>`;
    });
  } catch (err) { console.error(err); }
}

document.body.addEventListener('click', (e) => {
  if (e.target.classList.contains('view-client-btn')) {
    loadClientDetail(e.target.getAttribute('data-client'));
  }
});

let currentClientName = ""; 
async function loadClientDetail(clientName) {
  currentClientName = clientName;
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('view-client-detail')?.classList.add('active');
  
  const res = await fetch(`${API_BASE_URL}/api/customers`);
  const customers = await res.json();
  const info = customers.find(c => c.name === clientName) || {};

  if(document.getElementById('client-name')) document.getElementById('client-name').innerText = clientName;
  if(document.getElementById('client-avatar')) document.getElementById('client-avatar').innerText = clientName.charAt(0).toUpperCase();
  if(document.getElementById('client-company')) document.getElementById('client-company').innerText = `${info.company || '未填写'} · ${info.country || '未知'}`;
  if(document.getElementById('client-email')) document.getElementById('client-email').innerText = info.email || '-';
  if(document.getElementById('client-phone')) document.getElementById('client-phone').innerText = info.phone || '-';
  if(document.getElementById('client-lang')) document.getElementById('client-lang').innerText = info.lang || 'Español';
  if(document.getElementById('client-status')) document.getElementById('client-status').innerText = info.status || '潜在客户';
  if(document.getElementById('client-notes')) document.getElementById('client-notes').innerText = info.notes || '无备注';

  const inqRes = await fetch(`${API_BASE_URL}/api/inquiries`);
  const allInquiries = await inqRes.json();
  const clientInquiries = allInquiries.filter(inq => inq.customerName === clientName);
  const listContainer = document.getElementById('client-inquiry-list');
  if(listContainer) {
    listContainer.innerHTML = clientInquiries.length === 0 ? "<p style='color: var(--text-muted);'>暂无询盘。</p>" : "";
    clientInquiries.forEach(inq => {
      listContainer.innerHTML += `<div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 20px;"><div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="font-size: 13px; font-weight: 600; color: var(--primary);">${inq.id}</span><span style="font-size: 12px; color: var(--text-muted);">${inq.createdAt}</span></div><h4 style="margin: 0 0 8px 0; font-size: 16px;">${inq.product}</h4></div>`;
    });
  }

  loadFollowups(clientName);
}
async function loadFollowups(clientName) {
  const container = document.getElementById('client-followup-list');
  if (!container) return;
  const response = await fetch(`${API_BASE_URL}/api/followups`);
  const allRecords = await response.json();
  const clientRecords = allRecords.filter(r => r.customerName === clientName);
  
  container.innerHTML = clientRecords.length === 0 ? "<p style='color: var(--text-muted);'>暂无跟进记录。</p>" : "";
  clientRecords.forEach(record => {
    container.innerHTML += `<div class="timeline-item"><div class="timeline-dot" style="background: var(--primary);"></div><div class="timeline-content" style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; width: 100%;"><p style="margin-bottom: 8px;"><strong>${record.date} · ${record.channel}</strong></p><p>${record.note}</p></div></div>`;
  });
}

window.addFollowup = function() {
  if(document.getElementById('followup-modal')) document.getElementById('followup-modal').style.display = 'flex';
  if(document.getElementById('modal-note')) document.getElementById('modal-note').value = '';
  if(document.getElementById('modal-next-date')) document.getElementById('modal-next-date').value = '';
};

window.submitFollowup = async function() {
  const note = document.getElementById('modal-note')?.value.trim();
  if (!note) return alert("请填写跟进内容！");
  const newRecord = {
    customerName: currentClientName, date: new Date().toISOString().slice(0, 10),
    channel: document.getElementById('modal-channel')?.value || 'Email', note: note,
    nextDate: document.getElementById('modal-next-date')?.value || ''
  };
  const response = await fetch(`${API_BASE_URL}/api/followups`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRecord)
  });
  if (response.ok) {
    if(document.getElementById('followup-modal')) document.getElementById('followup-modal').style.display = 'none';
    loadFollowups(currentClientName); 
  }
};

window.openCustomerModal = function() {
  if(document.getElementById('customer-modal')) document.getElementById('customer-modal').style.display = 'flex';
  ['cust-name', 'cust-company', 'cust-country', 'cust-email'].forEach(id => {
    if(document.getElementById(id)) document.getElementById(id).value = '';
  });
};

window.submitCustomer = async function() {
  const name = document.getElementById('cust-name')?.value.trim();
  if (!name) return alert("客户姓名不能为空！");

  const newCustomer = {
    name: name,
    company: document.getElementById('cust-company')?.value.trim() || '待补充',
    country: document.getElementById('cust-country')?.value.trim() || '待补充',
    email: document.getElementById('cust-email')?.value.trim() || '待补充',
    phone: '待补充',
    lang: 'Español',
    notes: '手动新建客户',
    status: document.getElementById('cust-status')?.value || 'Cliente potencial'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/customers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCustomer)
    });
    if (response.ok) {
      if(document.getElementById('customer-modal')) document.getElementById('customer-modal').style.display = 'none';
      alert("✅ 客户保存成功");
      loadClients(); 
    }
  } catch (err) { alert("网络错误"); }
};
let statusChartInstance = null;
let trendChartInstance = null;

async function loadAnalytics() {
  try {
    const inqRes = await fetch(`${API_BASE_URL}/api/inquiries`);
    const inquiries = await inqRes.json();
    const custRes = await fetch(`${API_BASE_URL}/api/customers`);
    const customers = await custRes.json();

    const totalInq = inquiries.length;
    const totalCust = customers.length;

    let repliedCount = 0;
    let winCount = 0;
    const statusCounts = { "Nuevo": 0, "Pendiente de respuesta": 0, "Respondido": 0, "En seguimiento": 0, "Ganado": 0, "Cerrado": 0 };

    inquiries.forEach(inq => {
      const s = inq.status || "Nuevo"; 
      if (statusCounts[s] !== undefined) statusCounts[s]++;
      if (['Respondido', 'En seguimiento', 'Ganado'].includes(s)) repliedCount++;
      if (s === 'Ganado') winCount++;
    });

    const replyRate = totalInq === 0 ? 0 : Math.round((repliedCount / totalInq) * 100);
    const winRate = totalInq === 0 ? 0 : Math.round((winCount / totalInq) * 100);

    if(document.getElementById('stat-total-inq')) document.getElementById('stat-total-inq').innerText = totalInq;
    if(document.getElementById('stat-total-cust')) document.getElementById('stat-total-cust').innerText = totalCust;
    if(document.getElementById('stat-reply-rate')) document.getElementById('stat-reply-rate').innerText = `${replyRate}%`;
    if(document.getElementById('stat-win-rate')) document.getElementById('stat-win-rate').innerText = `${winRate}%`;

    if (typeof echarts !== 'undefined') {
      try {
        renderStatusChart(statusCounts);
        renderTrendChart(inquiries);
      } catch (e) { console.warn("ECharts 渲染出错:", e); }
    }
    
    loadFeedbackList(); 
    
  } catch (err) { console.error("加载统计数据失败", err); }
}

function renderStatusChart(counts) {
  const chartDom = document.getElementById('status-chart');
  if (!chartDom) return;
  if (!statusChartInstance) statusChartInstance = echarts.init(chartDom);

  const option = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center', icon: 'circle', itemWidth: 10, itemHeight: 10, itemGap: 15, textStyle: { fontSize: 12 } },
    color: ['#4f8bff', '#65c67d', '#f2a35e', '#f6c242', '#b58df6', '#f593b6'], 
    series: [{
      name: '询盘状态', type: 'pie', radius: ['45%', '65%'], center: ['50%', '40%'], avoidLabelOverlap: true,
      itemStyle: { borderRadius: 2, borderColor: '#fff', borderWidth: 2 }, label: { show: false },
      data: [
        { value: counts["Nuevo"], name: '新询盘' }, { value: counts["Pendiente de respuesta"], name: '待回复' },
        { value: counts["Respondido"], name: '已回复' }, { value: counts["En seguimiento"], name: '跟进中' },
        { value: counts["Ganado"], name: '已成交' }, { value: counts["Cerrado"], name: '已关闭' }
      ]
    }]
  };
  statusChartInstance.setOption(option);
}

function renderTrendChart(inquiries) {
  const chartDom = document.getElementById('trend-chart');
  if (!chartDom) return;
  if (!trendChartInstance) trendChartInstance = echarts.init(chartDom);

  const monthCounts = {};
  inquiries.forEach(inq => {
    const month = inq.createdAt.slice(0, 7); 
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });

  const sortedMonths = Object.keys(monthCounts).sort();
  const xData = sortedMonths.map(m => m.slice(5) + '月'); 
  const yData = sortedMonths.map(m => monthCounts[m]);

  const option = {
    tooltip: { trigger: 'axis', backgroundColor: '#fff', textStyle: { color: '#333' }, extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px;' },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: xData.length ? xData : ['暂无'], axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }, axisLabel: { color: '#64748b' } },
    series: [{
      name: '询盘数', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
      itemStyle: { color: '#4f8bff' }, lineStyle: { width: 3 },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(79,139,255,0.2)' }, { offset: 1, color: 'rgba(79,139,255,0)' }]) },
      data: yData.length ? yData : [0]
    }]
  };
  trendChartInstance.setOption(option);
}

window.addEventListener('resize', () => {
  if (statusChartInstance) statusChartInstance.resize();
  if (trendChartInstance) trendChartInstance.resize();
});
window.submitFeedback = async function() {
  const type = document.getElementById('fb-type')?.value || 'Bug';
  const content = document.getElementById('fb-content')?.value.trim();
  if (!content) return alert("请填写反馈内容！");

  const newFeedback = { type, content, user: "当前用户" };

  try {
    const res = await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFeedback)
    });
    if (res.ok) {
      alert("✅ 感谢您的反馈！已成功提交。");
      if(document.getElementById('fb-content')) document.getElementById('fb-content').value = "";
      loadFeedbackList();
    }
  } catch (err) { alert("提交失败，请检查网络。"); }
};

async function loadFeedbackList() {
  const container = document.getElementById('feedback-list');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/feedback`);
    const feedbacks = await res.json();

    container.innerHTML = feedbacks.length === 0 ? "<p style='color: var(--text-muted);'>暂无反馈记录。</p>" : "";

    feedbacks.forEach(fb => {
      let icon = "📝"; let bgColor = "#e2e8f0";
      if (fb.type === 'Bug') { icon = "🐞"; bgColor = "var(--danger-bg)"; }
      if (fb.type === 'Feature') { icon = "💡"; bgColor = "var(--warning-bg)"; }
      if (fb.type === 'Experience') { icon = "✨"; bgColor = "var(--primary-light)"; }

      const currentStatus = fb.status || "待处理";
      const isResolved = currentStatus === "已解决";
      
      const statusBadge = isResolved 
        ? `<span style="background: var(--success-bg); color: var(--success); padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">✅ 已解决</span>`
        : `<span style="background: var(--warning-bg); color: var(--warning); padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">⏳ 待处理</span>`;

      const actionBtn = isResolved 
        ? '' 
        : `<button class="btn btn-secondary" onclick="resolveFeedback('${fb.id}')" style="padding: 4px 10px; font-size: 12px; margin-top: 12px;">标记已解决</button>`;

      container.innerHTML += `
        <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="background: ${bgColor}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${icon} ${fb.type}</span>
              ${statusBadge}
            </div>
            <span style="font-size: 12px; color: var(--text-muted);">${fb.createdAt}</span>
          </div>
          <p style="font-size: 14px; margin: 0 0 8px 0; color: var(--text-main);">${fb.content}</p>
          ${actionBtn}
        </div>
      `;
    });
  } catch (err) { console.error("加载反馈列表失败", err); }
}

window.resolveFeedback = async function(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: '已解决' })
    });
    
    if (res.ok) {
      loadFeedbackList();
    } else {
      alert("更新状态失败");
    }
  } catch (err) { console.error("请求出错", err); }
};
function downloadCSV(csvContent, fileName) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.exportInquiriesCSV = async function() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/inquiries`);
    const inquiries = await res.json();
    const headers = ["询盘编号 / ID", "客户名称 / Cliente", "产品 / Producto", "数量 / Cantidad", "交期 / Plazo", "状态 / Estado", "创建时间 / Fecha"];
    let csvContent = headers.join(",") + "\n";
    
    inquiries.forEach(inq => {
      const row = [inq.id, `"${inq.customerName || ''}"`, `"${inq.product || ''}"`, `"${inq.quantity || ''}"`, `"${inq.deadline || ''}"`, `"${inq.status || ''}"`, inq.createdAt];
      csvContent += row.join(",") + "\n";
    });
    downloadCSV(csvContent, `询盘记录_Inquiries_${new Date().toISOString().slice(0,10)}.csv`);
  } catch (err) { alert("导出失败，请检查网络。"); }
};

window.exportClientsCSV = async function() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customers`);
    const customers = await res.json();
    const headers = ["客户名称 / Nombre", "公司 / Empresa", "国家 / País", "邮箱 / Correo", "电话 / Teléfono", "状态 / Estado", "备注 / Notas"];
    let csvContent = headers.join(",") + "\n";
    
    customers.forEach(cust => {
      const row = [`"${cust.name || ''}"`, `"${cust.company || ''}"`, `"${cust.country || ''}"`, `"${cust.email || ''}"`, `"${cust.phone || ''}"`, `"${cust.status || ''}"`, `"${cust.notes || ''}"`];
      csvContent += row.join(",") + "\n";
    });
    downloadCSV(csvContent, `客户档案_Clients_${new Date().toISOString().slice(0,10)}.csv`);
  } catch (err) { alert("导出失败，请检查网络。"); }
};

window.exportFollowupsCSV = async function() {
  if (!currentClientName) return alert("请先进入某个客户的档案页。");
  try {
    const res = await fetch(`${API_BASE_URL}/api/followups`);
    const allRecords = await res.json();
    const records = allRecords.filter(r => r.customerName === currentClientName);
    if (records.length === 0) return alert("该客户暂无跟进记录。");

    const headers = ["客户名称 / Cliente", "跟进日期 / Fecha", "方式 / Canal", "跟进内容 / Detalle", "下次跟进 / Próxima fecha"];
    let csvContent = headers.join(",") + "\n";
    
    records.forEach(r => {
      const row = [`"${r.customerName || ''}"`, r.date, `"${r.channel || ''}"`, `"${r.note || ''}"`, `"${r.nextDate || ''}"`];
      csvContent += row.join(",") + "\n";
    });
    downloadCSV(csvContent, `跟进记录_${currentClientName}_${new Date().toISOString().slice(0,10)}.csv`);
  } catch (err) { alert("导出失败，请检查网络。"); }
};
if (typeof lucide !== 'undefined') lucide.createIcons();