/**
 * Collection.jsx — 동물 도감 페이지
 *
 * 목차:
 *   1. 상수 정의         — 캐릭터 순서 배열, 카드 색상 맵
 *   2. 상태 및 데이터 로드 — GET /api/character 로 유저 캐릭터 키 조회
 *   3. 해금 판별 로직    — CHARACTER_ORDER 인덱스 비교로 잠금/해금 결정
 *   4. 렌더              — 헤더 → 캐릭터 카드 그리드 → Navbar
 *
 * 역할:
 *   - 게임에 등장하는 모든 고양이 캐릭터를 카드 형식으로 나열
 *   - 유저가 현재 보유한 캐릭터와 그 이전 캐릭터들은 "해금" 상태로 표시
 *   - 아직 해금하지 못한 캐릭터는 잠금 처리 (이미지에 어두운 오버레이 + 🔒 아이콘)
 *
 * 해금 판별 로직:
 *   - 서버에서 현재 유저의 character_key 를 조회
 *   - CHARACTER_ORDER 배열에서 인덱스를 비교해 현재 캐릭터 이전(포함)은 해금 상태
 *   - 예) 유저가 'russian_blue' 이면 'cheese_korean_shorthair' 와 'russian_blue' 해금,
 *         'munchkin' 은 잠금
 *
 * 캐릭터 이미지 로딩:
 *   - getCatUrl 유틸 함수 사용 (내부적으로 Vite glob 활용)
 *   - 경로 규칙: assets/characters/{key}/{key}_LV_{level}.png
 *
 * 화면 구성:
 *   ① collection-header : 페이지 제목 + 안내 문구
 *   ② collection-grid   : 캐릭터 카드 목록 (auto-fill 그리드)
 *       - 해금된 카드: 캐릭터 색상 배경 + LV1·2·3 썸네일 + 이름
 *       - 잠금된 카드: 회색 배경 + 🔒 오버레이 + "???" 이름 + 해금 조건 안내
 *   ③ Navbar            : 하단 탭 바
 *
 * API 연동:
 *   GET /api/character — 유저의 현재 캐릭터 키 조회
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar.jsx';
import { getCatUrl } from '../utils/catUtils.js'; // 캐릭터 이미지 URL 공통 유틸
import '../css/Collection.css';

// 서버 주소: .env 에 VITE_API_URL 이 있으면 사용, 없으면 로컬 3001포트
const API = '';

// ══════════════════════════════════════
// 1. 상수 정의
//    도감 표시 순서 배열 및 캐릭터별 카드 색상 맵
// ══════════════════════════════════════

// 도감에 표시할 캐릭터 순서 (= 해금 순서)
const CHARACTER_ORDER = ['cheese_korean_shorthair', 'russian_blue', 'munchkin'];

// 캐릭터 표시 이름 맵 (UI 전용 — 게임 로직 아님)
const CHARACTER_NAMES = {
  cheese_korean_shorthair: '치즈코리안숏헤어',
  russian_blue:            '러시안블루',
  munchkin:                '먼치킨',
};

// 해금된 카드 배경 색상 맵 (캐릭터별로 고유한 파스텔 색상)
const CARD_COLORS = {
  cheese_korean_shorthair: { bg: '#FFF8EE', border: '#FFD89B' }, // 따뜻한 주황
  russian_blue:            { bg: '#EEF4FF', border: '#B3CEFF' }, // 차가운 파랑
  munchkin:                { bg: '#F3EEFF', border: '#C8AAFF' }, // 부드러운 보라
};

/* ══════════════════════════════════════════════════════════════
   Collection 컴포넌트
══════════════════════════════════════════════════════════════ */
const Collection = () => {
  // ══════════════════════════════════════
  // 2. 상태 및 데이터 로드
  //    마운트 시 유저 캐릭터 키를 조회하여 해금 판별 기준 설정
  // ══════════════════════════════════════

  // 유저의 현재 캐릭터 키 — 해금 판별의 기준
  const [userCharacterKey, setUserCharacterKey] = useState(null);

  // 유저 캐릭터 조회
  useEffect(() => {
    axios.get(`${API}/api/character`, { withCredentials: true })
      .then(res => setUserCharacterKey(res.data.character_key))
      .catch(() => {}); // 비로그인 등 오류 시 기본값 유지 (첫 캐릭터만 해금으로 표시)
  }, []);

  // ══════════════════════════════════════
  // 3. 해금 판별 로직
  //    CHARACTER_ORDER 인덱스 비교 — 유저 캐릭터 이하 인덱스는 모두 해금
  // ══════════════════════════════════════

  /**
   * 특정 캐릭터가 해금되었는지 판단
   * - 유저 캐릭터 정보가 없으면 첫 번째 캐릭터만 해금
   * - 유저 캐릭터의 인덱스 이하인 캐릭터는 모두 해금
   */
  const isUnlocked = (key) => {
    if (!userCharacterKey) return key === 'cheese_korean_shorthair'; // 미로그인 시 첫 캐릭터만
    return CHARACTER_ORDER.indexOf(key) <= CHARACTER_ORDER.indexOf(userCharacterKey);
  };

  // ══════════════════════════════════════
  // 4. 렌더
  //    헤더 → 캐릭터 카드 그리드(해금/잠금) → Navbar
  // ══════════════════════════════════════
  return (
    <div className="collection-page">

      {/* ── ① 페이지 헤더 ── */}
      <div className="collection-header">
        <h2>동물 도감</h2>
        <p>운동해서 새로운 친구를 해금해보세요! 🐾</p>
      </div>

      {/* ── ② 캐릭터 카드 그리드 ── */}
      <div className="collection-grid">
        {CHARACTER_ORDER.map((key) => {
          const unlocked = isUnlocked(key);        // 해금 여부
          const colors   = CARD_COLORS[key];       // 카드 배경 색상
          // 이전 캐릭터 키 — 잠금 카드에 "OOO 달성 시 해금" 안내에 사용
          const prevKey  = CHARACTER_ORDER[CHARACTER_ORDER.indexOf(key) - 1];

          return (
            <div
              key={key}
              className={`collection-card ${unlocked ? 'unlocked' : 'locked'}`}
              // 해금된 카드만 캐릭터 고유 색상 적용, 잠금된 카드는 회색(CSS에서 처리)
              style={unlocked ? { background: colors.bg, borderColor: colors.border } : {}}
            >
              {/* ── 캐릭터 이미지 영역 ── */}
              <div className="collection-img-wrap">
                {getCatUrl(key, 1)
                  ? <img src={getCatUrl(key, 1)} alt={CHARACTER_NAMES[key]} className="collection-img" />
                  : <span style={{ fontSize: 60 }}>🐱</span>  /* 이미지 없으면 이모지 대체 */
                }
                {/* 잠금 오버레이: unlocked=false 이면 이미지 위에 어두운 레이어 + 🔒 표시 */}
                {!unlocked && (
                  <div className="lock-overlay">
                    <span className="lock-icon">🔒</span>
                  </div>
                )}
              </div>

              {/* ── 이름: 해금 = 실제 이름, 잠금 = "???" ── */}
              <p className="collection-name">{unlocked ? CHARACTER_NAMES[key] : '???'}</p>

              {/* ── 해금 상태 안내 ── */}
              <p className="collection-unlock-desc">
                {unlocked
                  ? (key === 'cheese_korean_shorthair' ? '기본 캐릭터' : '해금 완료 ✓')
                  : `${CHARACTER_NAMES[prevKey]} 달성 시 해금`
                }
              </p>

              {/* ── 레벨 썸네일 (해금된 카드만 표시): Lv1·Lv2·Lv3 이미지 ── */}
              {unlocked && (
                <div className="collection-levels">
                  {[1, 2, 3].map(lv => (
                    <div key={lv} className="collection-lv-thumb">
                      {getCatUrl(key, lv)
                        ? <img src={getCatUrl(key, lv)} alt={`Lv${lv}`} />
                        : null
                      }
                      <span>Lv.{lv}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── ③ 하단 탭 바 ── */}
      <Navbar />
    </div>
  );
};

export default Collection;
