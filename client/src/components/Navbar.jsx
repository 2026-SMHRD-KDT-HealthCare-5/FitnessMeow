/**
 * Navbar.jsx — 하단 탭 바 (공통 내비게이션)
 *
 * 역할:
 *   - 앱 하단에 고정되는 탭 바
 *   - 현재 경로(location.pathname)와 탭 path 가 일치하면 active 스타일 적용
 *   - 클릭 시 해당 경로로 이동 (react-router-dom navigate 사용)
 *
 * 기존 setCurrentTab 방식 → navigate 방식으로 변경한 이유:
 *   - setCurrentTab: 상태만 바꾸기 때문에 URL이 바뀌지 않아
 *     뒤로 가기·새로고침 시 탭 상태가 초기화되는 문제 발생
 *   - navigate: URL을 실제로 변경하므로 히스토리·새로고침 모두 정상 동작
 *
 * 탭 목록 수정 방법:
 *   아래 navItems 배열에서 항목을 추가/제거/수정하면 됨
 *   - key  : 고유 식별자 (중복 불가)
 *   - path : navigate 할 경로 (router에 등록된 경로여야 함)
 *   - icon : 아이콘 이모지
 *   - label: 하단 텍스트
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/Navbar.css';

// ★ 탭 항목 목록 — 여기서 탭 추가·삭제·순서 변경 가능
const navItems = [
  { key: "mainlobby",  path: "/mainlobby",      icon: "🏠",  label: "홈"     },
  { key: "shop",       path: "/shop",            icon: "🛍️", label: "상점"   },
  { key: "exercise",   path: "/exerciseselect",  icon: "🏋️‍♂️", label: "운동"   },
  { key: "collection", path: "/collection",      icon: "📖", label: "도감"   },
  { key: "info",       path: "/info",            icon: "👤", label: "내 정보" },
];

const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation(); // 현재 URL 경로

  return (
    <nav className="footer-nav">
      {navItems.map((item) => (
        <button
          key={item.key}
          type="button"
          /* 현재 경로와 탭 path 가 일치하면 active 클래스 추가 → 노란 상단 인디케이터 표시 */
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
          aria-label={item.label}
        >
          <span aria-hidden="true">{item.icon}</span>  {/* 아이콘 이모지 */}
          <p>{item.label}</p>                            {/* 탭 이름 */}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;
