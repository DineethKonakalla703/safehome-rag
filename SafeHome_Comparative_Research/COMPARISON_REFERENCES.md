# References

Accessed 14 Nov. 2026 unless stated otherwise. Items marked **[verify]** should be checked manually before submission.

## Research literature and software (numeric citations used throughout)

[1] P. Lewis, E. Perez, A. Piktus, F. Petroni, V. Karpukhin, N. Goyal, H. Küttler, M. Lewis, W.-t. Yih, T. Rocktäschel, S. Riedel, and D. Kiela, "Retrieval-augmented generation for knowledge-intensive NLP tasks," in *Proc. Adv. Neural Inf. Process. Syst. (NeurIPS)*, vol. 33, 2020. arXiv:2005.11401.

[2] D. Edge, H. Trinh, N. Cheng, J. Bradley, A. Chao, A. Mody, S. Truitt, D. Metropolitansky, R. O. Ness, and J. Larson, "From local to global: A Graph RAG approach to query-focused summarization," arXiv:2404.16130, v2, Feb. 2025. *Not peer-reviewed.*

[3] Microsoft, "GraphRAG," GitHub repository. https://github.com/microsoft/graphrag. *Repository in maintenance mode.*

[4] Z. Guo, L. Xia, Y. Yu, T. Ao, and C. Huang, "LightRAG: Simple and fast retrieval-augmented generation," in *Findings of the Assoc. Comput. Linguistics: EMNLP 2025*, Suzhou, China, Nov. 2025, pp. 10746–10761, doi: 10.18653/v1/2025.findings-emnlp.568. arXiv:2410.05779. **[verify: camera-ready table values vs. arXiv]**

[5] B. Jiménez Gutiérrez, Y. Shu, Y. Gu, M. Yasunaga, and Y. Su, "HippoRAG: Neurobiologically inspired long-term memory for large language models," in *Adv. Neural Inf. Process. Syst. (NeurIPS)*, vol. 37, 2024, doi: 10.52202/079017-1902. arXiv:2405.14831.

[6] B. Jiménez Gutiérrez, Y. Shu, W. Qi, S. Zhou, and Y. Su, "From RAG to memory: Non-parametric continual learning for large language models," in *Proc. 42nd Int. Conf. Mach. Learn. (ICML)*, PMLR vol. 267, 2025, pp. 21497–21515. arXiv:2502.14802.

[7] Circlemind AI, "fast-graphrag," GitHub repository (MIT License). https://github.com/circlemind-ai/fast-graphrag. *Vendor README; not peer-reviewed.*

[8] H. Han, L. Ma, Y. Wang, H. Shomer, Y. Lei, Z. Qi, K. Guo, Z. Hua, B. Long, H. Liu, C. C. Aggarwal, and J. Tang, "RAG vs. GraphRAG: A systematic evaluation and key insights," arXiv:2502.11371, v4. *Preprint.* **[verify: numbers taken from v4]**

[9] Z. Xiang, C. Wu, Q. Zhang, S. Chen, Z. Hong, X. Huang, and J. Su, "When to use graphs in RAG: A comprehensive analysis for graph retrieval-augmented generation," arXiv:2506.05690, v3, Feb. 2026. **[verify: listed as an ICLR 2026 poster; judge model]**

[10] Y. Xiao, J. Dong, C. Zhou, S. Dong, Q.-W. Zhang, D. Yin, X. Sun, and X. Huang, "GraphRAG-Bench: Challenging domain-specific reasoning for evaluating graph retrieval-augmented generation," arXiv:2506.02404, v3, Jun. 2025. **[verify: evaluation LLM]**

[11] S. Es, J. James, L. Espinosa-Anke, and S. Schockaert, "RAGAs: Automated evaluation of retrieval augmented generation," in *Proc. 18th Conf. Eur. Chapter Assoc. Comput. Linguistics: System Demonstrations (EACL)*, St. Julians, Malta, Mar. 2024, pp. 150–158, doi: 10.18653/v1/2024.eacl-demo.16.

[12] Ragas documentation, "Context Precision," "Context Recall," "Response Relevancy." https://docs.ragas.io

[13] N. Muennighoff, N. Tazi, L. Magne, and N. Reimers, "MTEB: Massive text embedding benchmark," in *Proc. 17th Conf. Eur. Chapter Assoc. Comput. Linguistics (EACL)*, Dubrovnik, Croatia, May 2023, pp. 2014–2037, doi: 10.18653/v1/2023.eacl-main.148.

[14] Sentence-Transformers, "all-MiniLM-L6-v2," Hugging Face model card. https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 (ONNX export used: Xenova/all-MiniLM-L6-v2).

[15] S. Robertson and H. Zaragoza, "The probabilistic relevance framework: BM25 and beyond," *Foundations and Trends in Information Retrieval*, vol. 3, no. 4, pp. 333–389, 2009.

[16] S. Holm, "A simple sequentially rejective multiple test procedure," *Scandinavian Journal of Statistics*, vol. 6, no. 2, pp. 65–70, 1979.

[17] B. Efron and R. J. Tibshirani, *An Introduction to the Bootstrap*. New York: Chapman & Hall, 1993.

[18] W. Wang, F. Wei, L. Dong, H. Bao, N. Yang, and M. Zhou, "MiniLM: Deep self-attention distillation for task-agnostic compression of pre-trained transformers," in *Adv. Neural Inf. Process. Syst. (NeurIPS)*, vol. 33, 2020.

[19] N. Reimers and I. Gurevych, "Sentence-BERT: Sentence embeddings using Siamese BERT-networks," in *Proc. EMNLP-IJCNLP*, 2019, pp. 3982–3992.

[20] K. Järvelin and J. Kekäläinen, "Cumulated gain-based evaluation of IR techniques," *ACM Transactions on Information Systems*, vol. 20, no. 4, pp. 422–446, 2002.

## Commercial product documentation (codes used in Table 1)

The full list with URLs and dates is in `EXISTING_SYSTEMS_REVIEW.md` §7. It covers:
- Buildium: B1–B8
- AppFolio: A1–A12, including press releases dated 2025-06-11, 2025-10-14, 2026-06-16 and 2026-09-29, and a blog post dated 2026-10-30
- Yardi Breeze: Y1–Y8. Y6–Y8 returned HTTP 403 to automated retrieval **[verify]**.
- MyGate: M1–M4
- ADDA: D1–D3

All are vendor-authored marketing or documentation pages, not independent sources.

## Own artefacts (this study)

| Item | Path |
|---|---|
| Dataset generator | `dataset/build_dataset.mjs` |
| Corpus | `dataset/corpus_documents.mjs` |
| Systems | `experiments/systems.mjs` |
| Runner | `experiments/run_retrieval.mjs` |
| Parity check and deployed latency | `experiments/parity_check.mjs` |
| Statistics | `experiments/analyze.mjs` |
| Charts | `experiments/make_charts.mjs` |
| Generation evaluation (not executed) | `experiments/run_generation_eval.mjs` |

Raw results are in `results/` (run 2026-11-13/14).
