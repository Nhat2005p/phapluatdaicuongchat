"""
VietLawAssist — Xây dựng Chỉ mục BM25 (Tầng 1 - Keyword Retrieval)
Theo nguyên tắc Page 05 & 06 trong Sổ tay RAG:
- Truy xuất kết hợp (Hybrid Search): BM25 cho thuật ngữ chính xác + Vector cho ngữ nghĩa.
- Sử dụng thuật toán Okapi BM25 chuẩn (k1 = 1.5, b = 0.75).
"""
import json
import math
import os
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

STOPWORDS = {
    'và', 'hoặc', 'của', 'là', 'những', 'các', 'cho', 'với', 'trong', 'được',
    'theo', 'về', 'khi', 'nào', 'này', 'đó', 'tại', 'thì', 'ở', 'đến', 'từ'
}

def tokenize(text: str):
    """Tách từ tiếng Việt đơn giản (unigram + bigram) và chuẩn hóa chữ thường."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    words = [w for w in text.split() if len(w) > 1 and w not in STOPWORDS]
    # Thêm bigram để bắt cụm từ pháp lý (ví dụ: "thừa kế", "hình sự", "pháp luật")
    bigrams = []
    for i in range(len(words) - 1):
        bigrams.append(f"{words[i]}_{words[i+1]}")
    return words + bigrams

def build_bm25():
    input_path = os.path.join("data", "rag", "textbook_chunks.json")
    if not os.path.exists(input_path):
        print(f"[!] Không tìm thấy {input_path}")
        return

    with open(input_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    N = len(chunks)
    doc_lengths = {}
    inverted_index = {}  # term -> {doc_id: freq}
    doc_metadata = {}

    total_len = 0
    for chunk in chunks:
        doc_id = chunk["id"]
        # Kết hợp tiêu đề + từ khóa + nội dung + căn cứ pháp lý để index
        text_to_index = f"{chunk['sectionTitle']} {' '.join(chunk['keywords'])} {chunk['summary']} {chunk['content']} {' '.join(chunk['legalBasis'])}"
        tokens = tokenize(text_to_index)
        doc_len = len(tokens)
        doc_lengths[doc_id] = doc_len
        total_len += doc_len

        tf_map = {}
        for token in tokens:
            tf_map[token] = tf_map.get(token, 0) + 1

        for token, count in tf_map.items():
            if token not in inverted_index:
                inverted_index[token] = {}
            inverted_index[token][doc_id] = count

        doc_metadata[doc_id] = {
            "id": chunk["id"],
            "chapterNumber": chunk["chapterNumber"],
            "chapterTitle": chunk["chapterTitle"],
            "sectionCode": chunk["sectionCode"],
            "sectionTitle": chunk["sectionTitle"],
            "pageRange": chunk["pageRange"],
            "source": chunk["source"],
            "keywords": chunk["keywords"],
            "summary": chunk["summary"],
            "legalBasis": chunk["legalBasis"],
            "content": chunk["content"]
        }

    avgdl = total_len / N if N > 0 else 1

    # Tính IDF cho từng term
    idf_map = {}
    for term, posting in inverted_index.items():
        df = len(posting)
        idf_map[term] = math.log(((N - df + 0.5) / (df + 0.5)) + 1.0)

    index_data = {
        "N": N,
        "avgdl": avgdl,
        "doc_lengths": doc_lengths,
        "idf": idf_map,
        "inverted_index": inverted_index,
        "docs": doc_metadata
    }

    out_file = os.path.join("data", "rag", "bm25_index.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"[*] Xây dựng BM25 Index thành công: {N} tài liệu, {len(idf_map)} từ khóa/cụm từ.")
    print(f"[*] Đã lưu vào {out_file}")

def search_bm25(query: str, top_k: int = 3, k1: float = 1.5, b: float = 0.75):
    """Tìm kiếm BM25 trực tiếp từ chỉ mục đã lưu."""
    index_file = os.path.join("data", "rag", "bm25_index.json")
    if not os.path.exists(index_file):
        build_bm25()

    with open(index_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    avgdl = data["avgdl"]
    doc_lengths = data["doc_lengths"]
    idf = data["idf"]
    inverted = data["inverted_index"]
    docs = data["docs"]

    q_tokens = tokenize(query)
    scores = {doc_id: 0.0 for doc_id in doc_lengths}

    for token in q_tokens:
        if token in inverted:
            token_idf = idf.get(token, 0.0)
            for doc_id, freq in inverted[token].items():
                dl = doc_lengths[doc_id]
                numerator = freq * (k1 + 1.0)
                denominator = freq + k1 * (1.0 - b + b * (dl / avgdl))
                scores[doc_id] += token_idf * (numerator / denominator)

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    results = []
    for doc_id, score in ranked[:top_k]:
        if score > 0:
            results.append({"doc": docs[doc_id], "score": round(score, 4)})
    return results

if __name__ == "__main__":
    build_bm25()
    # Test thử 1 câu hỏi
    test_q = "Tuân thủ pháp luật và thi hành pháp luật khác nhau thế nào?"
    res = search_bm25(test_q, top_k=2)
    print(f"\n[Test Search] '{test_q}':")
    for r in res:
        # pyrefly: ignore[bad-index]
        print(f"-> Score: {r['score']} | {r['doc']['sectionTitle']} ({r['doc']['pageRange']})")
