# 图表描述输入模版 / Diagram Input Template

按本模版描述需求，可减少「特殊字符转义」导致的生成失败。请尽量遵守下方规范后再输入或粘贴到 AI 绘图。

---

## 一、避免使用的字符（请替换）

| 避免使用 | 建议替换 | 说明 |
|----------|----------|------|
| `&`      | 和、与、及 | 例如：「成本&毛利」→「成本和毛利」 |
| `<` `>`  | 小于、大于；或换行写 | 例如：不用 `<br>`，直接换行分段 |
| 英文双引号 `"` 在句子中间 | 中文引号「」或直接省略 | 减少解析错误 |

---

## 二、推荐：流程/清单类描述模版

描述「可执行流程清单」「阶段+责任+输入输出」时，建议按下面结构写，**所有文字里的 & 请写成「和」或「与」**。

### 模版结构（复制后按需改内容）

```
请画一个可执行流程清单流程图，包含以下阶段（每阶段含：责任部门、输入、输出、评审点）：

阶段0 - 需求识别与机会评估（Pre-Project）
- 责任：R 市场或产品，A 事业部负责人或研发负责人，C 注册法规、医学、质量、研发、财务
- 输入：客户需求、竞品情报、临床痛点、法规分类初判、成本和毛利假设
- 输出：机会评估报告、注册路径草案、商业测算、资源预估
- 评审点：进入 G0 的准入条件（需求明确、路径可行、商业闭环初步成立）

阶段1 - G0 立项（项目启动）
- 责任：R 项目管理与产品经理，A 研发负责人，C 注册法规、质量、生产、医学
- 输入：机会评估报告、初版 PRD 或 URS、注册路径草案、风险初评
- 输出：立项批准书或项目章程、初版产品定义书、项目计划（WBS 与里程碑与资源）
- 评审点：G0 会议纪要（Go 或 No-Go 或 Go with Conditions）

阶段2 - G1 可行性研究（原理验证或样机雏形）
- 责任：R 研发，A 研发负责人，C 医学、质量、注册法规、供应链
- 输入：PRD 或 URS、目标性能指标、样本与对照资源、关键物料候选
- 输出：可行性报告、关键物料清单 BOM v0、原理样品或样机、初始性能数据包
- 评审点：路线可跑通、关键性能达到继续开发阈值、关键物料至少 2 家备选

阶段3 - 设计开发策划与设计输入冻结（DHF 启动）
- 责任：R 研发与质量，A 质量负责人与研发负责人，C 注册法规、医学、生产
- 输入：可行性报告、立项文件、法规与标准要求、同品种技术要求参考
- 输出：设计开发计划、设计输入文件 DI、风险管理计划与风险分析初稿、软件需求规格 SRS（如适用）
- 评审点：设计输入可测试可验证、关键性能指标与样本类型与报告规则与质控策略明确、变更控制规则确定
```

说明：上面全文已把「&」改为「和」「与」，把容易出问题的符号都去掉了，可直接复制到输入框使用或按需删减。

---

## 三、简短示例（可直接用于输入框）

- **简约流程图**：画一个流程图，包含三步：需求评审、开发、上线。每步用矩形，箭头连接。
- **带责任与输出**：画阶段流程图：阶段1 立项（责任 PMO，输出 项目章程）；阶段2 设计（责任 研发，输出 设计文档）；阶段3 测试（责任 质量，输出 测试报告）。用泳道或横向流程即可。

---

## 四、使用步骤建议

1. 下载本模版（或复制上述「模版结构」）。
2. 在本地把内容里的 `&` 全部改成「和」或「与」，检查是否还有 `<` `>` 等符号。
3. 将整理好的描述粘贴到 AI 图表输入框，再发送。
4. 若内容很长，可先发「阶段0 和 阶段1」，生成后再用续写或编辑补充后续阶段。

按以上方式输入，可大幅降低「需要修复 XML 特殊字符转义」类错误。

---

# Diagram Input Template (English)

To avoid "special character escaping" errors when generating diagrams, follow these rules when describing your diagram.

## 1. Characters to avoid (use replacements)

| Avoid | Use instead |
|-------|--------------|
| `&`   | and          |
| `<` `>` | less than, greater than; or use newlines instead of `<br>` |
| Unescaped `"` in the middle of text | Rephrase or use apostrophes |

## 2. Recommended format for process/checklist

When describing stages with "Responsible / Input / Output / Review points", use plain words: write "and" instead of "&", and avoid < > in labels. Example:

```
Draw a process flowchart with these stages (each with Responsible, Input, Output, Review):

Stage 0 - Opportunity assessment. R: Product; A: Business lead; Input: Customer needs, competition; Output: Assessment report; Review: Go/no-go for next stage.

Stage 1 - Project kickoff. R: PMO; A: R&D lead; Input: Assessment report, PRD draft; Output: Project charter, plan; Review: G0 meeting outcome.

Stage 2 - Feasibility. R: R&D; A: R&D lead; Input: PRD, targets; Output: Feasibility report, BOM v0; Review: Technical go-ahead.
```

Use this structure and keep all text free of & < > to avoid XML errors.
