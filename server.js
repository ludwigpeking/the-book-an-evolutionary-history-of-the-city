const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// 中间件配置
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ========== 健康检查端点 ========== //
app.get("/health", (req, res) => res.status(200).send("OK")); // [1,2,5](@ref)

// ========== PDF生成端点 ========== //
app.get("/generate-pdf", async (req, res) => {
  let browser;
  try {
    // 启动Puppeteer浏览器实例
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      timeout: 30000, // 增加启动超时时间
    });

    const page = await browser.newPage();

    // 构建完整书籍HTML
    const chapters = await getChapterFiles();
    const fullHTML = await buildBookHTML(chapters);

    // 设置页面内容并等待加载完成
    await page.setContent(fullHTML, {
      waitUntil: "networkidle0",
      timeout: 90000, // 增加页面加载超时
    });

    // 生成PDF缓冲区
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "2cm", right: "2cm", bottom: "3cm", left: "2cm" },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:9pt;text-align:center;width:100%;">城市进化史</div>`,
      footerTemplate: `<div style="font-size:8pt;text-align:center;width:100%;padding-top:10px">第 <span class="pageNumber"></span> 页 / 共 <span class="totalPages"></span> 页</div>`,
      timeout: 180000, // 增加PDF生成超时
    });

    // 发送PDF响应
    res.contentType("application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="城市进化史.pdf"'
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF生成失败:", error);
    res.status(500).json({
      error: "PDF生成失败",
      message: error.message,
      solution: "请检查章节文件是否存在且格式正确",
    });
  } finally {
    // 确保浏览器实例关闭
    if (browser)
      await browser.close().catch((e) => console.error("浏览器关闭失败:", e));
  }
});

// ========== 辅助函数 ========== //
async function getChapterFiles() {
  try {
    const chaptersDir = path.join(__dirname, "chapters");
    const files = await fs.readdir(chaptersDir);

    return files
      .filter((file) => file.endsWith(".html"))
      .sort((a, b) => parseInt(a) - parseInt(b)) // 按数字顺序排序
      .map((file) => path.join(chaptersDir, file));
  } catch (error) {
    throw new Error(`读取章节失败: ${error.message}`);
  }
}

async function buildBookHTML(chapterPaths) {
  try {
    let html = `<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <base href="file://${__dirname}/">
      <link rel="stylesheet" href="style.css">
      <style>
        @media print {
          .chapter { page-break-before: always; margin-top: 2cm; }
          body { padding: 0; margin: 0; font-family: 'SimSun', serif; }
          h1, h2, h3 { page-break-after: avoid; }
          img { max-width: 100% !important; height: auto !important; }
        }
      </style>
    </head><body>`;

    for (const file of chapterPaths) {
      const content = await fs.readFile(file, "utf8");
      html += `<div class="chapter">${content}</div>`;
    }

    html += `</body></html>`;
    return html;
  } catch (error) {
    throw new Error(`构建HTML失败: ${error.message}`);
  }
}

// ========== 错误处理中间件 ========== //
app.use((err, req, res, next) => {
  console.error("全局错误:", err.stack);
  res.status(500).send("服务器内部错误");
});

// ========== 启动服务器 ========== //
app.listen(port, () => {
  console.log(`PDF服务已启动: http://localhost:${port}/generate-pdf`);
  console.log(`健康检查端点: http://localhost:${port}/health`);
});
