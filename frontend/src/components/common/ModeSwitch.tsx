import React from 'react';
import { UserRole } from '../../types/auth';

interface ModeSwitchProps {
  currentMode: 'student' | 'council' | 'admin';
  onModeChange: (mode: 'student' | 'council' | 'admin') => void;
  userRole: UserRole;
}

export const ModeSwitch: React.FC<ModeSwitchProps> = ({ currentMode, onModeChange, userRole }) => {
  const isCouncilAllowed = userRole === 'lecturer' || userRole === 'admin';

  return (
    <div className="mode-switch">
      <button
        className={`mode-btn ${currentMode === 'student' ? 'active' : ''}`}
        onClick={() => onModeChange('student')}
      >
        🎓 Chế độ Học tập (Sinh viên)
      </button>
      <button
        className={`mode-btn ${currentMode === 'council' ? 'active' : ''}`}
        onClick={() => {
          if (isCouncilAllowed) {
            onModeChange('council');
          } else {
            alert('🔒 Quyền hạn không đủ: Chế độ Đối sánh Hội đồng (4 Tầng) dành riêng cho Giảng viên & Hội đồng chấm thi. Bạn có thể bấm vào avatar để chuyển đổi nhanh sang tài khoản Giảng viên.');
          }
        }}
        title={isCouncilAllowed ? 'Chế độ Đối sánh Hội đồng' : 'Yêu cầu quyền Giảng viên / Hội đồng'}
      >
        {isCouncilAllowed ? '🔬' : '🔒'} Chế độ Hội đồng (4 Tầng)
      </button>
    </div>
  );
};

export default ModeSwitch;
