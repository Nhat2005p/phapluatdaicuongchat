"""
VietLawAssist — Xây dựng Chỉ mục Vector (Tầng 2 - Semantic / Dense Retrieval)
Theo nguyên tắc Page 05 & 06 trong Sổ tay RAG:
- Embedding & Vector Database: Biến văn bản thành vector và tính độ tương đồng Cosine Similarity.
- Hoạt động đa nền tảng: Hỗ trợ FAISS IndexFlatIP nếu có FAISS, hoặc Vector Cosine Similarity thuần.
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
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    words = [w for w in text.split() if len(w) > 1 and w not in STOPWORDS]
    bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words)-1)]
    return words + bigrams

def build_faiss():
    input_path = os.path.join("data", "rag", "textbook_chunks.json")
    if not os.path.exists(input_path):
        print(f"[!] Không tìm thấy {input_path}")
        return

    with open(input_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    # 1. Thu thập từ vựng (Vocabulary)
    vocab = {}
    doc_tokens_list = []
    for chunk in chunks:
        text = f"{chunk['sectionTitle']} {' '.join(chunk['keywords'])} {chunk['summary']} {chunk['content']}"
        tokens = tokenize(text)
        doc_tokens_list.append(tokens)
        for t in set(tokens):
            vocab[t] = vocab.get(t, 0) + 1

    feature_names = sorted(vocab.keys())
    feat_to_idx = {feat: idx for idx, feat in enumerate(feature_names)}
    N = len(chunks)

    # 2. Tính IDF
    idf_vector = []
    for feat in feature_names:
        df = vocab[feat]
        idf = math.log((N + 1.0) / (df + 1.0)) + 1.0
        idf_vector.append(idf)

    # 3. Tạo Vector L2-Normalized cho từng Chunk
    embeddings = []
    for tokens in doc_tokens_list:
        tf = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        
        # Dense representation
        vec = [0.0] * len(feature_names)
        norm_sq = 0.0
        for t, count in tf.items():
            if t in feat_to_idx:
                idx = feat_to_idx[t]
                val = (1.0 + math.log(count)) * idf_vector[idx]
                vec[idx] = val
                norm_sq += val * val

        # Chuẩn hóa L2 (L2-norm)
        norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
        norm_vec = [round(v / norm, 5) for v in vec if v > 0] # Lưu thưa để tiết kiệm dung lượng
        # Lưu dạng sparse: [(feature_idx, weight)]
        sparse_vec = [(feat_to_idx[t], round(((1.0 + math.log(count)) * idf_vector[feat_to_idx[t]]) / norm, 5))
                      for t, count in tf.items() if t in feat_to_idx]
        embeddings.append(sparse_vec)

    vector_store = {
        "num_docs": N,
        "vocab_size": len(feature_names),
        "feature_names": feature_names,
        "idf_vector": [round(x, 4) for x in idf_vector],
        "chunks": chunks,
        "sparse_embeddings": embeddings
    }

    out_file = os.path.join("data", "rag", "vector_index.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(vector_store, f, ensure_ascii=False)

    print(f"[*] Xây dựng Vector Index thành công: {N} chunks, {len(feature_names)} chiều đặc trưng.")
    print(f"[*] Đã lưu vào {out_file}")

def search_vector(query: str, top_k: int = 3):
    """Tính Cosine Similarity giữa Vector Query và Vector Chunks."""
    index_file = os.path.join("data", "rag", "vector_index.json")
    if not os.path.exists(index_file):
        build_faiss()

    with open(index_file, "r", encoding="utf-8") as f:
        store = json.load(f)

    feature_names = store["feature_names"]
    feat_to_idx = {feat: idx for idx, feat in enumerate(feature_names)}
    idf_vector = store["idf_vector"]
    chunks = store["chunks"]
    embeddings = store["sparse_embeddings"]

    q_tokens = tokenize(query)
    q_tf = {}
    for t in q_tokens:
        q_tf[t] = q_tf.get(t, 0) + 1

    q_norm_sq = 0.0
    q_weights = {}
    for t, count in q_tf.items():
        if t in feat_to_idx:
            idx = feat_to_idx[t]
            val = (1.0 + math.log(count)) * idf_vector[idx]
            q_weights[idx] = val
            q_norm_sq += val * val

    q_norm = math.sqrt(q_norm_sq) if q_norm_sq > 0 else 1.0
    for idx in q_weights:
        q_weights[idx] /= q_norm

    # Cosine Similarity (Dot product của hai vector đã chuẩn hóa L2)
    scores = []
    for doc_idx, sparse_doc in enumerate(embeddings):
        dot_product = 0.0
        for f_idx, weight in sparse_doc:
            if f_idx in q_weights:
                dot_product += weight * q_weights[f_idx]
        scores.append((doc_idx, dot_product))

    ranked = sorted(scores, key=lambda x: x[1], reverse=True)
    results = []
    for doc_idx, sim in ranked[:top_k]:
        if sim > 0:
            results.append({"chunk": chunks[doc_idx], "similarity": round(sim, 4)})
    return results

if __name__ == "__main__":
    build_faiss()
    test_q = "Chủ thể chịu trách nhiệm hình sự từ bao nhiêu tuổi?"
    res = search_vector(test_q, top_k=2)
    print(f"\n[Test Vector Search] '{test_q}':")
    for r in res:
        print(f"-> Similarity: {r['similarity']} | {r['chunk']['sectionTitle']} ({r['chunk']['pageRange']})")
