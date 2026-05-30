/**
 * db.js — MySQL 커넥션 풀 생성 및 내보내기
 *
 * 목차:
 *   1. 드라이버 임포트   — mysql2/promise (async/await 지원 버전)
 *   2. 커넥션 풀 생성    — 환경변수 기반 DB 접속 정보 구성
 *   3. 모듈 내보내기     — 라우터에서 db.query() / db.getConnection() 으로 사용
 */

// ══════════════════════════════════════
// 1. 드라이버 임포트
//    mysql2/promise: Promise 기반 API 제공, async/await 사용 가능
// ══════════════════════════════════════
// src/db.js
const mysql = require('mysql2/promise');

// ══════════════════════════════════════
// 2. 커넥션 풀 생성
//    모든 접속 정보는 .env 에서 주입 (하드코딩 금지)
//    createPool: 요청마다 새 연결 대신 풀에서 재사용 → 성능 최적화
//    트랜잭션이 필요한 경우 db.getConnection() 으로 개별 커넥션을 획득
// ══════════════════════════════════════
const db = mysql.createPool({
  host:     process.env.DB_HOST,      // DB 서버 호스트 (예: localhost)
  port:     process.env.DB_PORT,      // DB 포트 (기본 3306)
  user:     process.env.DB_USER,      // DB 접속 계정
  password: process.env.DB_PASSWORD,  // DB 비밀번호
  database: process.env.DB_NAME,      // 사용할 데이터베이스 이름
});

// ══════════════════════════════════════
// 3. 모듈 내보내기
//    라우터 파일에서 require('../db') 로 가져와 사용
//    db.query(sql, params)          — 단일 쿼리 실행
//    db.getConnection()             — 트랜잭션용 개별 커넥션 획득
// ══════════════════════════════════════
module.exports = db;
