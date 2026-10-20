import React from 'react';

interface VerificationBadgeProps {
  isValid: boolean;
  citations: string[];
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ isValid, citations }) => {
  if (isValid && citations.length > 0) {
    return (
      <span className="badge-tag badge-success" title="Căn cứ điều luật đã được kiểm chứng khớp 100% trong CSDL quốc gia">
        ✅ Đã kiểm chứng CSDL ({citations.join(', ')})
      </span>
    );
  }

  if (!isValid) {
    return (
      <span className="badge-tag badge-warning" title="Phát hiện trích dẫn chưa xác minh trong CSDL luật gốc">
        ⚠️ Cảnh báo trích dẫn
      </span>
    );
  }

  return null;
};

export default VerificationBadge;
