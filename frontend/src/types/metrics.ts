export interface TierMetric {
  tier_name: string;
  recall_at_5: number;
  mrr: number;
  bert_score_f1?: number | null;
  rouge_l?: number | null;
  citation_precision_rate: number;
  avg_latency_ms: number;
  avg_vram_mb: number;
}

export interface BenchmarkEvaluationResponse {
  num_test_samples: number;
  tiers: TierMetric[];
  system_profile: {
    gpu: string;
    ram: string;
    os: string;
    quantization: string;
  };
}
