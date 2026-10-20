import { Request, Response } from 'express';
import { BenchmarkService } from '../services/benchmarkService.js';

export class BenchmarkController {
  public static async compareTiers(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.body;
      const testQuery = query || 'Nguyễn Văn A (19 tuổi, không bị tâm thần) do mâu thuẫn đã dùng gậy sắt đánh B thương tật 22%. Hãy phân tích theo cấu thành 4 yếu tố.';

      const result = await BenchmarkService.runBenchmark(testQuery);

      res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi chạy benchmark đối sánh 4 tầng.' });
    }
  }
}
