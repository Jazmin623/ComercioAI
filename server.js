const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const INQ_FILE = path.join(__dirname, 'inquiries.json');
const CUST_FILE = path.join(__dirname, 'customers.json');
const FOLLOW_FILE = path.join(__dirname, 'followups.json');
const TERM_FILE = path.join(__dirname, 'terms.json');
const FEEDBACK_FILE = path.join(__dirname, 'feedback.json');
const API_KEY = process.env.API_KEY || 'sk-你的真实Key填在这里'; 
app.post('/api/parse-inquiry', async (req, res) => {
  const inquiryText = req.body.text;
  if (!inquiryText) return res.status(400).json({ error: "没有收到文本" });
  try {
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是一个资深的外贸专家。请提取西语询盘中的信息。请严格输出JSON格式，包含以下字段：product, quantity, deadline, incoterm, port, finance, requirement, price。如果未明确提及某字段，请填 '未提及'。不要输出任何其他文字。" },
        { role: "user", content: inquiryText }
      ],
      temperature: 0.1
    }, { headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } });
    res.json(JSON.parse(response.data.choices[0].message.content));
  } catch (error) { res.status(500).json({ error: "AI 解析失败" }); }
});
app.post('/api/generate-reply', async (req, res) => {
  const parsedData = req.body;
  const tone = parsedData.tone || 'formal'; 
  try {
    let toneInstruction = "使用极其正式、严谨的商务口吻（例如开头用：Estimado/a señor/a...）。";
    if (tone === 'friendly') toneInstruction = "使用热情、友好、有亲和力的口吻（例如开头用：Hola, ¡espero que estés bien!）。";
    else if (tone === 'concise') toneInstruction = "使用极度简明扼要的口吻，直奔主题，不寒暄，直接列出确认项和问题。";
    
    const prompt = `你是一个资深的外贸业务员。请根据以下客户询盘提取出的信息，用西班牙语写一封回复邮件。
    产品：${parsedData.product || '未提及'} 数量：${parsedData.quantity || '未提及'}
    交期：${parsedData.deadline || '未提及'} 贸易术语：${parsedData.incoterm || '未提及'}
    港口：${parsedData.port || '未提及'} 付款条件：${parsedData.finance || '未提及'}
    语气要求：${toneInstruction}
    内容要求：如果客户未提及交期、港口或付款条件，必须在邮件中礼貌询问。直接输出邮件正文，不要Markdown标记。`;

    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6 
    }, { headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } });
    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) { res.status(500).json({ error: "生成回复失败" }); }
});
app.post('/api/ai-lookup', async (req, res) => {
  const keyword = req.body.keyword;
  if (!keyword) return res.status(400).json({ error: "没有收到查询词" });
  try {
    const prompt = `你是一个外贸西语词典。请帮我查询词语："${keyword}"。严格输出 JSON 格式，包含四个字段：es, zh, example, tag (分类：外贸/财税/物流)。不要输出任何多余文本。`;
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.1
    }, { headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } });
    res.json(JSON.parse(response.data.choices[0].message.content));
  } catch (error) { res.status(500).json({ error: "查词失败" }); }
});
app.get('/api/terms', (req, res) => {
  fs.readFile(TERM_FILE, 'utf8', (err, data) => { if (err) return res.status(500).json({ error: "读取失败" }); res.json(JSON.parse(data)); });
});
app.get('/api/inquiries', (req, res) => {
  fs.readFile(INQ_FILE, 'utf8', (err, data) => { if (err) return res.status(500).json({ error: "读取失败" }); res.json(JSON.parse(data)); });
});

app.post('/api/inquiries', (req, res) => {
  const newInquiry = req.body;
  fs.readFile(INQ_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: "读取询盘失败" });
    let inquiries = JSON.parse(data);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(inquiries.length + 1).padStart(3, '0');
    newInquiry.id = `INQ-${dateStr}-${seq}`;
    newInquiry.createdAt = new Date().toISOString().slice(0, 10);
    if (!newInquiry.status) newInquiry.status = "Nuevo"; 
    inquiries.unshift(newInquiry);
    
    fs.writeFile(INQ_FILE, JSON.stringify(inquiries, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "保存询盘失败" });
      fs.readFile(CUST_FILE, 'utf8', (err, custData) => {
        if (err) return res.status(500).json({ error: "读取客户表失败" });
        let customers = JSON.parse(custData);
        const existingCustomer = customers.find(c => c.name === newInquiry.customerName);
        if (!existingCustomer && newInquiry.customerName !== "匿名客户") {
          const newCustomer = { name: newInquiry.customerName, company: "待补充", country: "待补充", email: "待补充", phone: "待补充", lang: "Español", notes: `由询盘 ${newInquiry.id} 自动创建`, status: "Cliente potencial" };
          customers.push(newCustomer);
          fs.writeFile(CUST_FILE, JSON.stringify(customers, null, 2), (err) => {});
        }
        res.json({ message: "保存成功", inquiry: newInquiry });
      });
    });
  });
});

app.delete('/api/inquiries/:id', (req, res) => {
  const id = req.params.id;
  fs.readFile(INQ_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: "读取失败" });
    let inquiries = JSON.parse(data);
    inquiries = inquiries.filter(inq => inq.id !== id);
    fs.writeFile(INQ_FILE, JSON.stringify(inquiries, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "删除失败" });
      res.json({ message: "删除成功" });
    });
  });
});
app.get('/api/customers', (req, res) => {
  fs.readFile(CUST_FILE, 'utf8', (err, data) => { if (err) return res.status(500).json({ error: "读取客户失败" }); res.json(JSON.parse(data)); });
});

app.post('/api/customers', (req, res) => {
  const newCustomer = req.body;
  fs.readFile(CUST_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: "读取客户表失败" });
    let customers = JSON.parse(data);
    const existingIndex = customers.findIndex(c => c.name === newCustomer.name);
    if (existingIndex > -1) customers[existingIndex] = { ...customers[existingIndex], ...newCustomer };
    else customers.push(newCustomer);
    fs.writeFile(CUST_FILE, JSON.stringify(customers, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "保存客户失败" });
      res.json({ message: "客户保存成功", customer: newCustomer });
    });
  });
});
app.get('/api/followups', (req, res) => {
  fs.readFile(FOLLOW_FILE, 'utf8', (err, data) => { if (err) return res.status(500).json({ error: "读取跟进失败" }); res.json(JSON.parse(data)); });
});

app.post('/api/followups', (req, res) => {
  const newRecord = req.body;
  fs.readFile(FOLLOW_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: "读取失败" });
    let records = JSON.parse(data);
    newRecord.id = Date.now().toString(); 
    records.unshift(newRecord); 
    fs.writeFile(FOLLOW_FILE, JSON.stringify(records, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "保存失败" });
      res.json({ message: "添加成功", record: newRecord });
    });
  });
});
app.get('/api/feedback', (req, res) => {
  fs.readFile(FEEDBACK_FILE, 'utf8', (err, data) => { 
    if (err) return res.json([]); // 如果文件不存在，默认返回空数组
    res.json(JSON.parse(data)); 
  });
});
app.post('/api/feedback', (req, res) => {
  const newFeedback = req.body;
  fs.readFile(FEEDBACK_FILE, 'utf8', (err, data) => {
    let feedbacks = [];
    if (!err && data) {
      try { feedbacks = JSON.parse(data); } catch(e) {}
    }
    newFeedback.id = Date.now().toString();
    newFeedback.createdAt = new Date().toISOString().slice(0, 10);
    feedbacks.unshift(newFeedback);
    fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "保存失败" });
      res.json({ message: "提交成功", feedback: newFeedback });
    });
  });
});
app.patch('/api/feedback/:id', (req, res) => {
  const id = req.params.id;
  const newStatus = req.body.status; 

  fs.readFile(FEEDBACK_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: "读取失败" });
    let feedbacks = JSON.parse(data);

    const index = feedbacks.findIndex(fb => fb.id === id);
    if (index === -1) return res.status(404).json({ error: "未找到该反馈" });

    feedbacks[index].status = newStatus;

    fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "保存失败" });
      res.json({ message: "状态更新成功", feedback: feedbacks[index] });
    });
  });
});
app.listen(3000, () => {
  console.log("🚀 后端服务器已启动: http://localhost:3000");
});
app.patch('/api/inquiries/:id', (req, res) => {
  const id = req.params.id;
  const newStatus = req.body.status;

  fs.readFile(INQ_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: "读取失败" });
    let inquiries = JSON.parse(data);

    const index = inquiries.findIndex(inq => inq.id === id);
    if (index === -1) return res.status(404).json({ error: "未找到该询盘" });

    inquiries[index].status = newStatus;

    fs.writeFile(INQ_FILE, JSON.stringify(inquiries, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "保存失败" });
      res.json({ message: "状态更新成功", inquiry: inquiries[index] });
    });
  });
});