export type IntentCode = 
  | 'QPPL_STRUCT' 
  | 'VPPL_4_ELEMENTS' 
  | 'CIVIL_INHERIT' 
  | 'TRUE_FALSE' 
  | 'CRIMINAL_AGE' 
  | 'GENERAL_THEORY';

export interface IntentDetected {
  code: IntentCode;
  confidence: number;
  target_curriculum: string;
}

export interface ArticleSnippet {
  article_id: string;
  law_name: string;
  article_num: number;
  clause_num?: number | null;
  similarity_score: number;
  content?: string;
}

export interface RetrievalStage {
  top_articles: ArticleSnippet[];
  theory_principle_applied?: string | null;
}

export interface FormattedSections {
  so_bo?: string;
  mat_khach_quan?: {
    hanh_vi?: string;
    hau_qua?: string;
    quan_he_nhan_qua?: string;
    hung_khi?: string;
  };
  mat_chu_quan?: {
    loi?: string;
    dong_co?: string;
    muc_dich?: string;
  };
  khach_the?: string;
  chu_the?: string;
  ket_luan_phap_ly?: string;
  extra_details?: Record<string, any>;
}

export interface GeneratedAnswer {
  tier_level: 'Tier_1_BM25' | 'Tier_2_Dense' | 'Tier_3_Base_RAG' | 'Tier_4_FineTuned_LoRA';
  status: string;
  formatted_sections?: FormattedSections;
  raw_text?: string;
}

export interface GuardrailValidation {
  is_citation_valid: boolean;
  scanned_citations: string[];
  hallucinated_citations: string[];
}

export interface QueryMetrics {
  latency_ms: number;
  vram_used_mb: number;
  tokens_generated: number;
  tokens_per_sec?: number;
}

export interface ProcessQueryResponse {
  query: string;
  intent_detected: IntentDetected;
  retrieval_stage: RetrievalStage;
  generated_answer: GeneratedAnswer;
  guardrail_validation: GuardrailValidation;
  metrics: QueryMetrics;
}

export interface CompareQueryResponse {
  query: string;
  intent_detected: IntentDetected;
  tier_1_bm25: ProcessQueryResponse;
  tier_2_dense: ProcessQueryResponse;
  tier_3_base_rag: ProcessQueryResponse;
  tier_4_lora: ProcessQueryResponse;
  summary_metrics: {
    recall_at_5: Record<string, number>;
    bert_score: Record<string, number>;
    latency_ms: Record<string, number>;
  };
}
