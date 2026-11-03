"""
VietLawAssist — Complete RAG Pipeline (Truy xuất lai & Sinh câu trả lời chuẩn Sổ tay RAG)
Thực thi trọn vẹn 2 giai đoạn:
1. Retrieval: Hybrid Search (BM25 + Vector) & Reranking.
2. Generation: Prompt chuẩn Trang 07 Sổ tay RAG với 4 quy tắc vàng.
"""
import json
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from build_bm25_index import search_bm25
from build_faiss_index import search_vector

def hybrid_retrieve(query: str, top_k: int = 2):
    """
    Truy xuất lai (Hybrid Retrieval - Trang 06 Sổ tay RAG):
    Kết hợp điểm từ khóa thưa BM25 và độ tương đồng vector Cosine.
    """
    bm25_res = search_bm25(query, top_k=5)
    vector_res = search_vector(query, top_k=5)

    # Chuẩn hóa BM25 về thang [0, 1]
    max_bm25 = max([r["score"] for r in bm25_res], default=1.0)
    if max_bm25 == 0:
        max_bm25 = 1.0

    combined = {}
    for r in bm25_res:
        doc_id = r["doc"]["id"]
        norm_bm25 = r["score"] / max_bm25
        combined[doc_id] = {
            "chunk": r["doc"],
            "bm25_score": r["score"],
            "vector_score": 0.0,
            "hybrid_score": norm_bm25 * 0.55
        }

    for r in vector_res:
        doc_id = r["chunk"]["id"]
        vec_score = r["similarity"]
        if doc_id in combined:
            combined[doc_id]["vector_score"] = vec_score
            combined[doc_id]["hybrid_score"] += vec_score * 0.45
        else:
            combined[doc_id] = {
                "chunk": r["chunk"],
                "bm25_score": 0.0,
                "vector_score": vec_score,
                "hybrid_score": vec_score * 0.45
            }

    # Sắp xếp và Rerank (Trang 06 Sổ tay RAG)
    ranked = sorted(combined.values(), key=lambda x: x["hybrid_score"], reverse=True)
    return ranked[:top_k]

def build_rag_prompt(query: str, retrieved_docs: list):
    """
    Tạo Prompt chuẩn Trang 07 Sổ tay RAG:
    Quy tắc 1: Giới hạn nguồn
    Quy tắc 2: Trích nguồn chuẩn xác
    Quy tắc 3: Cho phép nói không biết
    Quy tắc 4: Định dạng cấu trúc rõ ràng
    """
    if not retrieved_docs or retrieved_docs[0]["hybrid_score"] < 0.1:
        context_block = "[Không tìm thấy tài liệu phù hợp trong giáo trình]"
    else:
        context_parts = []
        for item in retrieved_docs:
            c = item["chunk"]
            header = f"--- [TÀI LIỆU: {c['source']} | {c['chapterTitle']} | Mục {c['sectionCode']}: {c['sectionTitle']} ({c['pageRange']})] ---"
            body = f"{c['content']}\nCăn cứ pháp lý: {', '.join(c['legalBasis'])}"
            context_parts.append(f"{header}\n{body}")
        context_block = "\n\n".join(context_parts)

    system_instruction = (
        "Bạn là Chuyên gia Trợ lý Pháp luật Đại cương (VietLawAssist), trả lời cho sinh viên.\n"
        "BẠN PHẢI TUÂN THỦ NGHIÊM NGẶT 4 QUY TẮC RAG SAU:\n"
        "1. GIỚI HẠN NGUỒN: Chỉ trả lời dựa trên nội dung được cung cấp trong phần TÀI LIỆU dưới đây. Tuyệt đối không suy diễn hoặc tự ý thêm thông tin ngoài tài liệu.\n"
        "2. TRÍCH NGUỒN CHUẨN XÁC: Luôn trích dẫn rõ tên tài liệu, chương, mục và số trang theo định dạng: [Giáo trình PLĐC ĐH Thương Mại 2021 - Chương X, tr. Y].\n"
        "3. CHO PHÉP NÓI KHÔNG BIẾT: Nếu trong tài liệu không có thông tin để trả lời câu hỏi, hãy trả lời chính xác: 'Tôi chưa tìm thấy thông tin này trong Giáo trình Pháp luật Đại cương.'\n"
        "4. ĐỊNH DẠNG BAREM KHOA HỌC: Trình bày gồm: Kết luận -> Cơ sở lý luận giáo trình -> Căn cứ pháp lý áp dụng."
    )

    prompt = (
        f"{system_instruction}\n\n"
        f"=== NGUỒN TÀI LIỆU GIÁO TRÌNH ===\n"
        f"{context_block}\n\n"
        f"=== CÂU HỎI CỦA SINH VIÊN ===\n"
        f"{query}\n\n"
        f"=== CÂU TRẢ LỜI CỦA BẠN (KÈM TRÍCH DẪN NGUỒN) ==="
    )
    return prompt

if __name__ == "__main__":
    test_query = "Nhận định sau đúng hay sai: Mọi hành vi thực hiện pháp luật đều được thực hiện dưới dạng hành động."
    print(f"[*] Câu hỏi thử nghiệm: {test_query}\n")
    
    top_matches = hybrid_retrieve(test_query, top_k=2)
    print(f"[*] Kết quả Hybrid Retrieve (Top {len(top_matches)}):")
    for idx, match in enumerate(top_matches, 1):
        c = match["chunk"]
        print(f"  {idx}. [Hybrid Score: {match['hybrid_score']:.4f}] {c['sectionTitle']} ({c['pageRange']})")
    
    prompt = build_rag_prompt(test_query, top_matches)
    print("\n" + "="*50)
    print("[*] PROMPT RAG ĐƯỢC TỰ ĐỘNG SINH:")
    print("="*50)
    print(prompt)

