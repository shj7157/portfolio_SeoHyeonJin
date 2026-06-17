import React, { useState, useEffect, useRef, useCallback } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import {
  VscFiles,
  VscSearch,
  VscSourceControl,
  VscExtensions,
  VscAccount,
  VscSettingsGear,
  VscChevronDown,
  VscChevronRight,
  VscFolder,
  VscFolderOpened,
  VscDatabase,
  VscMarkdown,
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeClose,
  VscBell,
  VscClose,
  VscFile,
  VscTerminal,
  VscFileMedia,
  VscCode,
} from "react-icons/vsc";
import { FaJava, FaJsSquare } from "react-icons/fa";

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0; padding: 0; overflow: hidden;
    background-color: #1e1e1e; color: #cccccc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
`;

// ─── 파일별 터미널 데이터 (key: "프로젝트명::파일명") ────────────────────────
const fileTerminalData = {
  "Sloway::통계 알고리즘.sql": {
    회고: `# [통계 알고리즘] 파일 회고

## 좋았던 점
- 실시간 조회 대비 조회 속도를 평균 28.3초(1000회 실행 기준) → 0.38초(1000회 실행 기준)로 약 98.8% 개선하는 성과를 냈습니다.
  Materialized View를 활용해 통계 데이터를 디스크에 저장하고, 스케줄러로 10분 주기 갱신하는 구조를 설계한 것이 핵심이었습니다.

## 아쉬운 점
- 초기 아키텍처 설계 단계에서 대용량 데이터 적재 및 고빈도 조회 상황을 예측하지 못해, 중반부에 급하게 구조를 변경해야 했습니다.
- 10분 주기 갱신이라는 실시간성 포기가 비즈니스적으로 최선인지에 대한 검토가 부족했습니다.

## 시도해볼 만한 점
- 향후에는 초기 스키마 설계 단계부터 인덱스 전략을 선제적으로 수립하겠습니다.
- materialize view 갱신 시 발생하는 배타적 락을 최소화하여, 대용량 트래픽 환경에서도 중단 없는 고속 조회 환경을 구축하고 싶습니다.`,
    트러블슈팅: `# [통계 알고리즘] 트러블슈팅: 대용량 통계 조회 성능 최적화

## 문제 상황
통계 데이터를 실시간으로 조회 시 평균 28.3초, 최대 32.1초(1000회 실행 기준)까지 소요되는 성능 저하가 발생했습니다.
웹 서비스 환경에서 30초에 육박하는 응답 시간은 브라우저 Connection Timeout을 유발하는 심각한 리스크였습니다.

## 원인 분석
- 인덱스 부재: 복합 인덱스가 설정되지 않아 Full Table Scan이 발생했습니다.
- 실시간 연산 과부하: 수백만 건 로우를 매 요청마다 집계·연산하는 구조가 DB CPU에 극심한 부하를 주고 있었습니다.

## 해결 과정
### 1단계 - 인덱스 최적화
조건절과 그룹화에 자주 쓰이는 컬럼들로 복합 인덱스를 설계 평균 28.3초(1000회 실행 기준)의 조회 시간 → 평균 12.4초로 단축 (2배 이상 개선, 1000회 실행 기준)

### 2단계 - Materialized View 도입
- 통계 데이터는 완벽한 실시간성보다 주기별 집계가 중요하다는 판단으로 구체화 뷰 패턴 도입
- Spring Boot Scheduler로 10분 주기 배치 갱신

## 최종 결과
- 조회 속도: 평균 28.3초 → 0.38초 (98.8% 향상)
- DB 피크타임 CPU 점유율 대폭 감소(평균 88% -> 평균 34%, 초당 1000건의 집중 트래픽 기준)로 다른 핵심 트랜잭션 안정성도 동시 확보`,
  },
  "Sloway::워크앤스테이 상세.java": {
    회고: `# [워크앤스테이 상세] 파일 회고

## 좋았던 점
- QueryDSL을 활용해 안전한 동적 쿼리를 작성했습니다.
- 서브쿼리로 최신 HOST_PLACE를 안정적으로 특정하는 패턴을 익혔습니다.
- 통계 카드(매출·예약수·평점)를 별도 메서드로 분리해 단일 책임 원칙을 지킨 코드 구조가 만족스러웠습니다.

## 아쉬운 점
- fetchBasicInfo, fetchSummaryCard 등 여러 쿼리를 순차 실행하는 구조여서, 트래픽이 높아질 경우 DB 커넥션 점유 시간이 길어질 수 있다는 우려가 있습니다.

## 시도해볼 만한 점
- 향후에는 독립적인 데이터 조회 로직을 비동기로 처리하여 응답 속도를 개선하겠습니다.
- 향후에는 쿼리를 통합하여 DB 왕복 횟수를 줄이는 최적화 방향을 고민해 보겠습니다.`,
    트러블슈팅: `# [워크앤스테이 상세] 트러블슈팅: 다중 JOIN 성능 및 데이터 생명주기 관리

## 문제 상황
워크앤스테이 상세 대시보드는 기본정보·통계카드·편의시설·최근예약 등 여러 종류의 데이터를 한 화면에서 보여줘야 했습니다.
이 과정에서 다중 JOIN이 발생하는 복잡한 테이블 구조로 인해 조회 성능 저하 문제가 발생했습니다.

## 원인 분석
- place_summary 미적용: Materialized View 도입 전 원본 테이블 직접 다중 JOIN으로 조회해 속도 저하 발생
- 검수 상태 관리 부재: 수정 버튼을 상태에 따라 조건부 렌더링하지 않아 검수 중인 유닛도 수정이 가능한 버그 존재

## 해결 과정
- 알고리즘을 위해 설계된 place_summary (Materialized View)를 활용해 다중 JOIN 없이 이미 집계된 데이터를 조회하도록 변경
- hostPlaceEntity.status를 조회하여 PENDING(검수대기) 상태에서는 수정 버튼을 숨기는 조건부 렌더링 구현

## 결과
- 상세 페이지 조회 속도 대폭 개선 (최소 : 6.2초, 최대 : 12.4초 -> 최소 : 0.3초, 최대 0.9초)
- 검수 프로세스 무결성 확보`,
  },
  "Sloway::검수상세 페이지.java": {
    회고: `# [검수상세 페이지] 파일 회고

## 좋았던 점
- AWS S3를 통해 이미지를 관리하여 서버 부하를 분산하고 확장성 있는 미디어 인프라를 구축한 경험이 값졌습니다.
- 이미지·편의시설·사무공간 편의시설을 별도 쿼리로 분리하여 조회 후 DTO에 주입하는 구조가 명확했습니다. 구조를 분해함으로서 데이터의 정확도와 가독성이 좋아졌습니다.

## 아쉬운 점
- 이미지·편의시설 데이터를 DTO 생성 후 별도로 set하는 방식이라 쿼리 호출이 N번 발생하는 구조입니다. 배치 처리 또는 IN 절 조회로 개선 여지가 있습니다.

## 시도해볼 만한 점
- 검수 체크리스트 검증 로직을 더 세밀하게 고도화하여, 항목별 상세 검증 결과를 어드민 화면에서 확인할 수 있도록 개선해 보겠습니다.`,
    트러블슈팅: `# [검수상세 페이지] 트러블슈팅: 검수 이력 관리 및 이미지 처리

## 문제 상황
- 검수 이력이 여러 건 쌓이는 구조에서 항상 "최신 대기(PENDING) 이력"만을 조회해야 하는 요구사항이 있었습니다.
- 이미지와 편의시설 데이터가 워크앤스테이와 워크오피스에 분산되어 있어 통합 조회가 복잡했습니다.

## 원인 분석
- HOST_PLACE 테이블에 이력이 누적되는 구조라 단순 JOIN으로는 최신 건만 가져오기 어려웠습니다.
- 워크오피스 편의시설과 워크앤스테이 편의시설이 별도 테이블로 관리되어 중복 데이터 가능성이 있었습니다.

## 해결 과정
- JPAExpressions 서브쿼리로 MAX(no) = 최신 이력 ID를 구한 뒤 해당 건만 JOIN하는 패턴을 적용했습니다.
(Auto increase 되는 Sequence Number값을 사용하기에 시도가능한 방법)
- Stream을 이용하여 두 편의시설 리스트를 병합 후 중복을 제거했습니다.

## 결과
- 항상 정확한 최신 검수 대기 이력만 조회되도록 보장
- 중복 없는 통합 편의시설 목록 제공`,
  },
  "Task-Flow::프로젝트 업데이트.java": {
    회고: `# [프로젝트 업데이트] 파일 회고

## 좋았던 점
- update 메서드 내부를 validateProj·updateProj·updateProjDept·updateProjSche 등 작은 private 메서드로 쪼개어 단일 책임 원칙을 준수하여 가독성과 유지보수성을 높였습니다.
- 담당자 존재 여부 업데이트 로직에 upsert 패턴을 적용하여 DB 접근 효율을 높이고 비즈니스 로직을 단순화했습니다.

## 아쉬운 점
- 일정 내 기능 구현을 우선순위로 두다 보니, 유효성 검증 로직의 예외 케이스를 더 촘촘하게 정의하지 못한 점이 아쉽습니다.
- 실시간으로 반영되는 기능들이 많았습니다. 웹소켓을 통한 실시간 반영이 아닌 api의 응답값에 따른 화면 리랜더링이라는 점이 아쉬웠습니다.
- 각 update 메서드에서 영향받은 행의 수를 검증하는 예외 처리 로직이 중복되었습니다. AOP나 커스텀 예외 유틸로 분리했다면 중복을 줄이고 핵심 로직에만 집중할 수 있었을 것입니다.

## 시도해볼 만한 점
- 다음 프로젝트에서는 @Transactional 롤백 시나리오를 더 세밀하게 테스트하겠습니다.
- API 폴링 방식의 한계를 극복하기 위해, STOMP를 활용한 실시간 반응형 웹페이지 구현을 도입해 보겠습니다.`,
    트러블슈팅: `# [프로젝트 업데이트] 트러블슈팅: 다중 테이블 동기화 및 담당자 관리

## 문제 상황
프로젝트 업데이트 시 PROJ, PROJ_DEPT, PROJ_SCHE, PROJ_EMPL 4개 테이블이 연동되어야 하는데,
중간에 하나라도 실패하면 데이터 불일치가 발생하는 문제가 있었습니다.

## 원인 분석
- 트랜잭션 처리 없이 각 테이블을 순서대로 update하는 구조였기 때문에, 중간 실패 시 일부만 반영된 상태로 남음
- PROJ_EMPL(담당자) 테이블은 조회 후 insert/update를 선택해야 하는 분기 로직이 필요했는데 초기에는 누락되어 있었음

## 해결 과정
- @Transactional 어노테이션 적용으로 4개 테이블 update를 하나의 원자적 작업으로 묶음
- selectProjEmplVoByNo로 담당자 존재 여부를 먼저 확인 후, null이면 insert·아니면 update하는 분기 로직 추가
- 각 update 메서드에 result != 1 시 IllegalArgumentException을 던지는 방어 로직 추가

## 결과
- 4개 테이블 동기화 완전 보장
- 담당자 중복 insert 방지`,
  },
  "Task-Flow::마일스톤 상세조회.sql": {
    회고: `# [마일스톤 상세조회] 파일 회고

## 좋았던 점
- INNER JOIN과 LEFT JOIN을 의도에 맞게 혼용하여, 필수 데이터(작성자)는 누락 없이, 선택 데이터(팔로워)는 null 허용으로 처리한 설계가 명확했습니다.
- DISTINCT를 사용해 다중 JOIN으로 인한 데이터 중복 가능성을 차단한 점이 좋았습니다.

## 아쉬운 점
- MyBatis 어노테이션에 멀티라인 SQL을 직접 작성하다 보니 가독성이 떨어지는 면이 있었습니다. XML 매퍼로 분리했으면 더 관리하기 좋았을 것입니다.
- 체크리스트의 데이터를 포함하여 조회하여, 프로젝트와 동일하게 진척도를 보여주도록 구현했으면 기능적으로 더 훌륭했을 것 같습니다.

## 시도해볼 만한 점
- 향후에는 쿼리 실행 계획을 반드시 분석하여 인덱스 누락 여부를 사전에 확인하겠습니다.
- 향후에는 기능을 구현함에 있어, 사용자 UX를 심도있게 고려하여 구현하겠습니다.`,
    트러블슈팅: `# [마일스톤 상세조회] 트러블슈팅: 권한 로직 개선 및 쿼리 성능 최적화

## 문제 상황
- '마일스톤은 담당자만 열람 가능', '체크리스트는 누구나 열람 가능'이라는 상이한 권한 정책이 혼재하여 쿼리가 복잡해졌습니다.
- 체크리스트 조회 시 권한 확인을 위한 불필요한 JOIN 연산이 매번 발생했습니다.
- N+1 문제 발생 위험이 높고 쿼리 복잡도가 증가했습니다.

## 해결 과정
- 팀원들과 기술 협의를 통해 '권한의 일관성'을 우선순위로 설정하고 정책을 재정립했습니다.
- 유저가 생성할 수 있는 데이터 범위를 프로젝트 및 부서 단위로 명확하게 제한했습니다.
- 권한 체크를 위해 복잡하게 얽혀있던 테이블 관계를 단순화하고, INNER JOIN 기반의 명확한 구조로 재설계했습니다.

## 결과
- 권한 JOIN 구조 단순화로 응답 속도 향상
- 일관된 권한 정책으로 보안성 강화
- N+1 위험 요소 제거로 유지보수 편의성 증대`,
  },
  "Trip-Tracks::메인피드조회페이지.js": {
    회고: `# [메인피드조회페이지] 파일 회고

## 좋았던 점
- 서브쿼리를 활용한 좋아요 수 집계와 현재 유저의 좋아요 여부를 단일 쿼리로 처리하여 DB 왕복 횟수를 최소화한 점이 좋았습니다.
- 게시물 노출 시마다 Ambass_Info_Log, Post_Log에 실시간 로그를 기록하는 구조로 통계 데이터 정확성을 높였습니다.

## 아쉬운 점
- for문 내에서 conn.query를 반복 호출하는 구조라 N+1 문제가 발생합니다. 게시물 수(최대 20개)가 많아질 경우 성능 이슈가 생길 수 있습니다.
- 이미지 경로를 하드코딩된 서버 URL로 조합하는 방식이라 환경 변수로 분리했으면 더 좋았을 것입니다.

## 시도해볼 만한 점
- 로그 기록은 비동기 메시지 큐(예: Redis pub/sub)를 통해 메인 조회 로직과 분리하면 응답 속도를 더 개선할 수 있을 것 같습니다.`,
    트러블슈팅: `# [메인피드조회페이지] 트러블슈팅: 다중 JOIN 데이터 중복 및 로그 기록

## 문제 상황
- Post, Post_Image, User_Info, Post_Like, Ambass_Save 등 다중 테이블 JOIN 시 이미지가 여러 장인 게시물에서 데이터 중복이 발생했습니다.
- 게시물 노출 시 로그를 기록하는 로직이 없어 사용자 통계 데이터를 수집할 수 없었습니다.

## 원인 분석
- Post_Image 테이블에 게시물당 이미지가 여러 건 존재하기 때문에, 단순 JOIN 시 Post 데이터가 이미지 수만큼 중복 반환됨
- 로그 테이블(Post_Log, Ambass_Info_Log)이 존재하지만 삽입 로직이 API에 포함되어 있지 않았음

## 해결 과정
- MIN(Post_Image.Image_Src)으로 대표 이미지 1장만 선택 + GROUP BY Post.Post_ID로 중복 제거
- for문 내에서 INSERT ... ON DUPLICATE KEY UPDATE 패턴으로 로그를 upsert 처리

## 결과
- 게시물 중복 없이 최신순 20개 정확히 반환
- 노출 통계 데이터 정상 수집 가능`,
  },
  "Trip-Tracks::엠버서더_대시보드.js": {
    회고: `# [엠버서더 대시보드] 파일 회고

## 좋았던 점
- 권한 검증을 API 진입 시점에 바로 처리하여 불필요한 DB 조회를 방지하는 구조가 좋았습니다.
- 본문, 이미지, 댓글, 좋아요, 로그 등 파편화된 데이터를 서버에서 하나의 객체로 병합하여 프론트엔드가 단순하게 사용할 수 있도록 설계했습니다.

## 아쉬운 점
- 쿼리를 5번 순차 실행하는 구조라 응답 시간이 누적됩니다. Promise.all을 활용한 병렬 처리로 개선 여지가 큽니다.
- conn.end()를 finally에서 처리하고 있지만, 커넥션 풀 반환이 보장되는지 추가 검증이 필요했습니다.

## 시도해볼 만한 점
- 5번의 쿼리들을 await을 통한 순차적 실행보다는 5건을 모두 보낸 후 응답을 받는 Promise.all로 병렬화하면 응답 시간을 크게 단축할 수 있을 것입니다.`,
    트러블슈팅: `# [엠버서더 대시보드] 트러블슈팅: 권한 관리 및 복합 데이터 조합

## 문제 상황
- 엠버서더 전용 기능임에도 불구하고 권한 검증 없이 API가 열려있어 일반 유저도 접근 가능한 보안 취약점이 있었습니다.
- 게시물 관련 데이터(이미지·댓글·좋아요·로그)가 각기 다른 테이블에 분산되어 있어 한 번에 조회하기 어려웠습니다.

## 원인 분석
- Node.js Express 라우터에 미들웨어나 권한 체크 로직이 없었음
- 단일 복합 쿼리로 모든 데이터를 JOIN 시 성능 저하 및 데이터 처리 복잡도가 너무 높아짐

## 해결 과정
- 세션에서 User_ID를 꺼내 User_Rule = 1 (엠버서더)인지 확인하는 권한 검증 로직을 라우터 최상단에 추가
- 데이터를 목적별로 분리된 쿼리로 개별 조회 후 서버에서 객체 병합하는 전략 채택

## 결과
- 엠버서더 권한 없는 유저의 접근 차단
- 복합 데이터를 안정적으로 조합하여 단일 응답으로 반환`,
  },
};

// ─── 프로젝트 데이터 ──────────────────────────────────────────────────────────
const projects = [
  {
    title: "Sloway",
    shortDesc: [
      "개인 사용자를 대상으로 한 워케이션 공간 예약 플랫폼",
      "재택근무, 디지털 노마드, 워라밸 중시 사용자 대상 워케이션 공간 탐색·예약·리뷰·결제 통합 서비스",
      "일과 휴식의 균형 있는 조화와 업무 효율성 확보 및 사용자 편의성 제공",
      "담당 역할 : DB관리자",
      "담당 기능 : 공간, 유닛, 편의시설, 찜, 공간검수, 알림",
    ],
    techStack: {
      OS: "Windows",
      Language: "JavaScript, SQL, Java, HTML, CSS",
      "Framework/Library":
        "Spring Boot, Spring Security, React, JPA, Redux-Toolkit, Flyway, Styled-components",
      Database: "PostgreSQL",
      Tool: "PGAdmin, VSCode, IntelliJ, Postman, Swagger, AWS S3",
      WAS: "Tomcat",
      Collaboration: "Git, SourceTree, Notion, Trello, Figma, ERD-Cloud",
      API: "Kakao Map API",
    },
    files: [
      {
        name: "통계 알고리즘.sql",
        type: "SQL",
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/sloway_mainPage.png",
        desc: `유닛의 예약, 리뷰 정보를 통계알고리즘을 통해 랭킹을 만들어 제공합니다.
이를 통해 사용자는 부여된 점수에 기반하여 높은 점수를 가진 공간들만 추천받을 수 있습니다.

공간이 추천되는 알고리즘 입니다.

        첫번째 컴포넌트 알고리즘 : (총 예약건수 * 0.7 + (리뷰의 평균)*0.3)+(7일이내 신규 유닛의 경우: 0.5) *100
        두번째 컴포넌트 알고리즘 : (공간에 속한 유닛들의 총 예약건수 * 0.7 + (공간에 속한 유닛들의 리뷰의 평균)*0.3)+(7일이내 신규 공간의 경우: 0.5) *100
        세번째 컴포넌트 알고리즘 : (워크앤스테이라는 타입의 유닛의 총 예약건수 * 0.7 + (워크앤스테이라는 타입의 유닛의 리뷰의 평균)*0.3)+(7일이내 신규 워크앤스테이의 경우: 0.5) *100
        
통계 데이터를 실시간으로 조회를 진행했을 시 최저 24.3초 최대 32.1초 평균값 28.3초가 소요되는 점을 발견했습니다.
init용 인덱스를 통한 튜닝 진행하여 최저 8.2초 최대 16.8초 평균 12.4초까지 속도를 개선했으나, 사용자가 사용하기에 모자라다고 판단하여 캐싱을 진행했습니다.
materialized view를 활용하여 스케줄러를 통해 10분에 한 번씩 값이 반영되도록 설계했습니다. 조회 속도가 최저 0.24초 최대 0.48초 평균 0.38초까지 개선되었습니다.█`,
        code: `-- 기존에 테이블이 있다면 삭제
DROP TABLE IF EXISTS place_summary;
DROP MATERIALIZED VIEW IF EXISTS place_summary;

CREATE MATERIALIZED VIEW place_summary AS
WITH
RsvnStats AS (
    SELECT p.no as place_no, p.type,
        COUNT(DISTINCT r.no) AS rsvn_cnt,
        AVG(rev.score_total) AS avg_score
    FROM place p
    LEFT JOIN station s ON p.type = 'STATION' AND s.place_no = p.no
    LEFT JOIN office o ON p.type = 'OFFICE' AND o.place_no = p.no
    LEFT JOIN work_stay w ON p.type = 'WORK_STAY' AND w.place_no = p.no
    LEFT JOIN rsvn r ON (
        (p.type = 'STATION' AND r.station_no = s.no)
        OR (p.type = 'OFFICE' AND r.office_no = o.no)
        OR (p.type = 'WORK_STAY' AND r.work_stay_no = w.no)
    )
    LEFT JOIN review rev ON rev.rsvn_no = r.no
    GROUP BY p.no, p.type
),
ImgInfo AS (
    SELECT DISTINCT ON (place_no) place_no, current_url FROM img_place WHERE sort = 1
),
AmenityInfo AS (
    SELECT wa.work_no, STRING_AGG(a.name, ',') as names
    FROM work_amenity wa
    JOIN amenity a ON a.no = wa.amenity_no
    GROUP BY wa.work_no
)
SELECT
    p.no as place_no, p.type,
    MAX(CASE WHEN p.type = 'STATION' THEN s.no WHEN p.type = 'OFFICE' THEN o.no ELSE w.no END) as target_no,
    MAX(p.title || ' ' || COALESCE(s.title, o.title, w.title)) as title,
    MAX(p.address) as address,
    MAX(i.current_url) as current_url,
    MAX(COALESCE(s.mon_price, (SELECT MIN(op.price) FROM office_period op WHERE op.office_no = o.no AND op.exception_start_date IS NULL), w.mon_price, 0)) as price,
    MAX(ROUND(CASE WHEN COALESCE(rs.rsvn_cnt, 0) = 0 THEN 0.0 ELSE ((rs.rsvn_cnt * 0.7) + (rs.avg_score * 0.3)) * 100 END)::int) as final_score,
    MAX(COALESCE(rs.rsvn_cnt, 0)) as rsvn_count,
    MAX(COALESCE(rs.avg_score, 0.0)) as avg_score,
    MAX(am.names) as amenities,
    MAX(p.status) as status,
    NOW() as updated_at
FROM place p
LEFT JOIN station s ON p.type = 'STATION' AND s.place_no = p.no
LEFT JOIN office o ON p.type = 'OFFICE' AND o.place_no = p.no
LEFT JOIN work_stay w ON p.type = 'WORK_STAY' AND w.place_no = p.no
LEFT JOIN RsvnStats rs ON rs.place_no = p.no AND rs.type = p.type
LEFT JOIN ImgInfo i ON i.place_no = p.no
LEFT JOIN AmenityInfo am ON am.work_no = w.no
WHERE p.status = 'I'
GROUP BY p.no, p.type;

CREATE UNIQUE INDEX idx_place_summary_unique ON place_summary (place_no, type);`,
      },
      {
        name: "워크앤스테이 상세.java",
        type: "java",
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/sloway_workStayDetailPage.png",
        desc: `워크앤스테이 상세조회 화면입니다.

다중 Join이 발생하는 테이블 구조를 알고리즘을 위해 설계된 place_summary (Materialized View)를 조회하는 방식으로 구조화하여 조회 성능을 대폭 향상했습니다.
또한, 쿼리 플랜 분석을 바탕으로 인덱스를 전략적으로 배치하여 데이터 조회 속도를 최적화했습니다.

유닛의 상태(검수/운영) 필드를 도입하여 데이터 생명주기를 관리합니다.
검수 대기 상태에서는 수정 버튼을 조건부 렌더링하여 관리자의 승인 전 수정 시도를 방지했습니다.█`,
        code: `@Override
public StationDetailRespDto selectWorkStayDetailDashBoard(Long no, Long memberNo) {
    Tuple tuple = fetchWorkStayBasicInfo(no, memberNo);
    if (tuple == null) {
        throw new IllegalArgumentException("해당 워케이션 정보를 찾을 수 없습니다. id=" + no);
    }
    StationDetailRespDto.SummaryCard summary = fetchSummaryCard(no);
    StationDetailRespDto.HeaderInfo headerInfo = buildWorkStayHeaderInfo(tuple, summary);
    StationDetailRespDto.BasicInfo basicInfo = buildWorkStayBasicInfo(tuple);
    List<String> facilities = fetchFacilities(no);
    List<StationDetailRespDto.RecentBooking> recentBookings = fetchRecentBookings(no);
    return StationDetailRespDto.builder()
            .header(headerInfo).basicInfo(basicInfo)
            .summary(summary).facilities(facilities)
            .recentBookings(recentBookings).build();
}

private Tuple fetchWorkStayBasicInfo(Long workStayId, Long memberNo) {
    var latestHostPlaceIdSubQuery = JPAExpressions
            .select(hostPlaceEntity.no.max())
            .from(hostPlaceEntity)
            .where(hostPlaceEntity.workStayEntity.no.eq(workStayId));
    return queryFactory
            .select(workStayEntity.title, placeEntity.title, placeEntity.type,
                    hostPlaceEntity.status, placeEntity.address,
                    workStayEntity.maxCnt, workStayEntity.cnt,
                    workStayEntity.monPrice, workStayEntity.holPrice,
                    workStayEntity.checkinTime, workStayEntity.checkoutTime,
                    imgWorkStayEntity.currentUrl)
            .from(workStayEntity)
            .join(placeEntity).on(placeEntity.no.eq(workStayEntity.placeEntity.no))
            .leftJoin(imgWorkStayEntity).on(imgWorkStayEntity.workStayEntity.no.eq(workStayId)
                    .and(imgWorkStayEntity.sort.eq(1)))
            .join(hostPlaceEntity).on(hostPlaceEntity.workStayEntity.no.eq(workStayEntity.no))
            .join(hostPlaceEntity.hostEntity, hostEntity)
            .where(workStayEntity.no.eq(workStayId), hostEntity.memberNo.eq(memberNo),
                    hostPlaceEntity.no.in(latestHostPlaceIdSubQuery))
            .fetchOne();
}

private StationDetailRespDto.SummaryCard fetchSummaryCard(Long workStayId) {
    YearMonth currentMonth = YearMonth.now();
    LocalDate startOfMonth = currentMonth.atDay(1);
    LocalDate endOfMonth = currentMonth.atEndOfMonth();
    Tuple bookingStats = queryFactory
            .select(rsvnEntity.no.count(), rsvnEntity.amt.sum().coalesce(0))
            .from(rsvnEntity)
            .where(rsvnEntity.workStayNo.no.eq(workStayId),
                    rsvnEntity.createdAt.between(startOfMonth.atStartOfDay(), endOfMonth.atTime(23,59,59)),
                    rsvnEntity.status.in(RsvnStatus.S, RsvnStatus.E))
            .fetchOne();
    Tuple reviewStats = queryFactory
            .select(reviewEntity.no.count(), reviewEntity.scoreTotal.avg().coalesce(0.0))
            .from(reviewEntity)
            .where(reviewEntity.rsvnNo.workStayNo.no.eq(workStayId))
            .fetchOne();
    int monthlyBookings = bookingStats != null ? bookingStats.get(0, Number.class).intValue() : 0;
    long monthlyRevenue = bookingStats != null ? bookingStats.get(1, Number.class).longValue() : 0L;
    int totalReviews = reviewStats != null ? reviewStats.get(0, Number.class).intValue() : 0;
    double averageRating = reviewStats != null ? Math.round(reviewStats.get(1, Double.class) * 10) / 10.0 : 0.0;
    return StationDetailRespDto.SummaryCard.builder()
            .monthlyBookings(monthlyBookings).monthlyRevenue(monthlyRevenue)
            .totalReviews(totalReviews).averageRating(averageRating).build();
}`,
      },
      {
        name: "검수상세 페이지.java",
        type: "java",
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/sloway_approvalDetailPage.png",
        desc: `검수 상세 페이지입니다.\n\n클라우드 스토리지 활용: 유닛 이미지 데이터를 AWS S3 Bucket을 통해 관리하여 서버의 부하를 분산하고, 확장성 있는 미디어 처리 인프라를 구축했습니다.\n\n운영 품질 관리: 검수 과정에서 사진 체크리스트 검증 로직을 강제하여, 호스트가 등록한 공간의 정보가 운영 기준을 충족했는지 체계적으로 확인하도록 설계했습니다.\n\n운영 무결성 확보: 모든 체크리스트 항목이 승인 조건에 부합해야만 검수 완료가 가능하도록 구현했습니다.`,
        code: `@Override
public ApprovalDetailRespDto findWorkStayDetail(Long no) {
    var latestPendingHostPlaceIdSubQuery = JPAExpressions
            .select(hostPlaceEntity.no.max())
            .from(hostPlaceEntity)
            .where(hostPlaceEntity.workStayEntity.no.eq(no)
                    .and(hostPlaceEntity.status.eq(ApprovalStatus.P)));

    ApprovalDetailRespDto dto = queryFactory
            .select(Projections.constructor(ApprovalDetailRespDto.class,
                    hostPlaceEntity.no, placeEntity.no, placeEntity.type,
                    workStayEntity.title, workStayEntity.content,
                    placeEntity.address, memberEntity.name,
                    workStayEntity.monPrice, workStayEntity.cnt,
                    workStayEntity.maxCnt, workStayEntity.checkinTime,
                    workStayEntity.checkoutTime))
            .from(workStayEntity)
            .join(workStayEntity.placeEntity, placeEntity)
            .join(hostPlaceEntity).on(hostPlaceEntity.no.in(latestPendingHostPlaceIdSubQuery))
            .join(hostPlaceEntity.hostEntity, hostEntity)
            .join(memberEntity).on(memberEntity.no.eq(hostEntity.memberNo))
            .where(workStayEntity.no.eq(no))
            .fetchOne();

    if (dto != null) {
        dto.setImages(queryFactory
                .select(Projections.constructor(ApprovalDetailRespDto.ImageDto.class,
                        imgWorkStayEntity.no, imgWorkStayEntity.currentUrl, imgWorkStayEntity.sort))
                .from(imgWorkStayEntity)
                .where(imgWorkStayEntity.workStayEntity.no.eq(no))
                .fetch());

        List<ApprovalDetailRespDto.AmenityDto> mainAmenities = queryFactory
                .select(Projections.constructor(ApprovalDetailRespDto.AmenityDto.class,
                        workAmenityEntity.amenityEntity.no, workAmenityEntity.amenityEntity.name))
                .from(workAmenityEntity)
                .where(workAmenityEntity.workStayEntity.no.eq(no))
                .fetch();

        dto.setAmenities(mainAmenities);
    }
    return dto;
}`,
      },
    ],
  },
  {
    title: "Task-Flow",
    shortDesc: [
      "개발회사를 대상으로 한 프로젝트 일정관리 및 개인 일정관리 웹&앱 페이지",
      "담당 역할 : DB관리자",
      "담당 기능 : 프로젝트, 마일스톤, 회사, 부서, 계약, 회의실, 로그인체크, 알림",
    ],
    techStack: {
      OS: "Windows",
      Language: "JavaScript, SQL, Java, JSP, CSS",
      "Framework / Library": "Spring Boot, MyBatis, JPA",
      DB: "Oracle",
      Tool: "SQL Developer, Eclipse, VSCode, IntelliJ, Postman",
      WAS: "Tomcat",
      Collaboration: "Git, SourceTree, Notion, Trello, Figma, ERD-Cloud",
    },
    files: [
      {
        name: "프로젝트 업데이트.java",
        type: "java",
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/TaskFlow_MainPage.png",
        desc: `프로젝트를 업데이트하기 위한 페이지입니다.

프로젝트 고유번호인 no값을 통한 조회로 유효성을 체크한 후, Project테이블의 정보들을 수정하고, 담당하는 부서를 변경합니다.
프로젝트 일정도 삭제 후 재삽입 방식으로 갱신하며, 담당자를 지정하기 위해 다대다 관계의 중계테이블을 참조하여 담당자 정보를 체크하여 수정합니다.

프로젝트의 상태값은 드래그 앤 드롭 기능을 통해 실시간으로 반영되도록 구현했습니다.
즐겨찾기 기능 또한 프로젝트 카드의 별 아이콘을 통해 실시간으로 반영되도록 구현했습니다.`,
        code: `@Transactional
public int update(ProjVo projVo, ProjEmplVo projEmplVo, ProjDeptVo projDeptVo, ProjScheVo projScheVo) {
    String projNo = String.valueOf(projVo.getNo());
    validateProj(projVo);
    updateProj(projVo);
    updateProjDept(projDeptVo, projNo);
    updateProjSche(projScheVo, projNo);
    projEmplVo.setProjNo(projNo);
    ProjEmplVo checkManagerY = projMapper.selectProjEmplVoByNo(projNo);
    if (checkManagerY == null) {
        insertNewManager(projEmplVo);
    } else {
        updateProjEmpl(projEmplVo, projNo);
    }
    return 1;
}

private int updateProj(ProjVo projVo) {
    int result = projMapper.updateProj(projVo);
    if (result != 1) throw new IllegalArgumentException("[PROJ-301] Project UPDATE Error");
    return result;
}
private int updateProjDept(ProjDeptVo projDeptVo, String projNo) {
    projDeptVo.setProjNo(projNo);
    int result = projMapper.updateProjDept(projDeptVo);
    if (result != 1) throw new IllegalArgumentException("[PROJ-302] Project_DEPT UPDATE Error");
    return result;
}
private int updateProjSche(ProjScheVo projScheVo, String projNo) {
    int result = projMapper.updateProjSche(projScheVo, projNo);
    if (result != 1) throw new IllegalArgumentException("[PROJ-303] Project_SCHE UPDATE Error");
    return result;
}
private int insertNewManager(ProjEmplVo projEmplVo) {
    int result = projMapper.insertProjEmpl(projEmplVo);
    if (result < 1) throw new IllegalArgumentException("[PROJ-306] Project_EMPL INSERT Error");
    return result;
}`,
      },
      {
        name: "마일스톤 상세조회.sql",
        type: "sql",
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/TaskFlow_MileStonePage.png",
        desc: `마일스톤 상세 조회를 위한 페이지입니다.

마일스톤과 담당 부서, 프로젝트 간의 데이터 무결성을 보장하기 위해 핵심 식별자 기반의 INNER JOIN 구조를 명확히 설계했습니다.
특히 프로젝트와 마일스톤 간 담당자 정보의 참조 관계가 모호할 수 있는 점을 고려해 조인 조건을 더욱 견고하게 최적화했으며, 성능을 위해 인덱스를 활용한 결합 조건을 적용했습니다.

마일스톤의 상태값도 프로젝트와 마찬가지로 드래그 앤 드롭 기능을 통해 실시간으로 반영되도록 구현했습니다.`,
        code: `SELECT DISTINCT
    M.NO, M.SCHE_NO AS scheno, M.TITLE, M.CONTENT, M.LABEL, M.STATE,
    M.START_DATE AS startDate, M.END_DATE AS endDate,
    M.FOLLOWER_NO AS followerNo, EM.NAME AS followerName,
    PEME.NO AS mileEmplNo, PEME.NAME AS mileEmplName,
    PEPE.NO AS projEmplNo, PEPE.NAME AS projEmplName
FROM MILE M
    LEFT JOIN EMPL EM ON EM.NO = M.FOLLOWER_NO
    INNER JOIN PROJ_EMPL PEM ON PEM.MILE_NO = M.NO AND PEM.IS_WRITER_YN = 'Y'
        INNER JOIN EMPL PEME ON PEME.NO = PEM.EMPL_NO
    LEFT JOIN PROJ_EMPL PEP ON PEP.PROJ_NO = #{projNo} AND PEP.IS_MANAGER_YN = 'Y'
        INNER JOIN EMPL PEPE ON PEPE.NO = PEP.EMPL_NO
WHERE M.DEL_AT IS NULL AND M.NO = #{no}`,
      },
    ],
  },
  {
    title: "Trip-Tracks",
    shortDesc: [
      "여행과 SNS를 결합한 새로운 서비스",
      "여행 경험과 정보를 공유하는 플랫폼",
      "담당 역할 : 2학기 팀장, 백엔드 개발자, DB관리자",
      "담당 기능 : 유저, 프로필, 게시글, 다이렉트 메시지, 게시글 좋아요, 유저간 팔로우",
    ],
    techStack: {
      OS: "Windows, macOS",
      Frontend:
        "Vue.js (Vite), Vue Router, Vuex, Axios, Socket.io-client, Vue3-Toastify",
      Backend: "Node.js (Express), Express-session, Socket.io",
      DB: "Maria-DB",
      Infrastructure: "Ubuntu Server, PM2",
      API: "Kakao Map API",
      Collaboration: "Git, GitHub, Adobe XD, Draw.io",
    },
    files: [
      {
        name: "메인피드조회페이지.js",
        type: "js",
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/Trip_Tracks_MainPage.jpg",
        desc: `메인 홈페이지입니다.\n\n사용자의 관심사와 엠버서더 활동을 반영한 최신 게시물 20개를 조회하는 기능을 구현했습니다.\n다중 조인 시 발생할 수 있는 데이터 중복과 성능 저하를 방지하기 위해, 서브쿼리를 활용한 필터링과 GROUP BY를 전략적으로 배치하여 데이터의 무결성을 확보했습니다.\n또한, 게시물 노출 시마다 실시간 로그를 기록하는 트랜잭션 구조를 설계하여 사용자 통계 데이터의 정확성을 높였습니다.`,
        code: `router.post("/", async (req, res) => {
  const { User_ID } = req.session;
  let conn;
  try {
    conn = await DBconn.getConnection();
    const selectAmbassPostsQuery = \`
      SELECT CAST(Post.Post_ID AS CHAR) AS Post_ID, Post.Post_Title,
             Post.Post_Caption, MIN(Post_Image.Image_Src) AS Image_Src,
             CAST(Post.User_ID AS CHAR) AS User_ID,
             User_Info.Profile_Img, User_Info.User_Rule,
             IFNULL(CAST(Post_Like.likeCount AS CHAR), '0') AS likeCount,
             IF(Post_Like_User.User_ID IS NOT NULL, 1, 0) AS isLike
      FROM Ambass_Save
      LEFT JOIN Post ON Ambass_Save.Post_ID = Post.Post_ID
      LEFT JOIN Post_Image ON Post.Post_ID = Post_Image.Post_ID
      LEFT JOIN User_Info ON Post.User_ID = User_Info.User_ID
      LEFT JOIN (SELECT Post_ID, COUNT(*) AS likeCount FROM Post_Like GROUP BY Post_ID) AS Post_Like
             ON Post.Post_ID = Post_Like.Post_ID
      LEFT JOIN (SELECT Post_ID, User_ID FROM Post_Like WHERE User_ID = ?) AS Post_Like_User
             ON Post.Post_ID = Post_Like_User.Post_ID
      WHERE Ambass_Save.User_ID = ? AND User_Info.User_Rule = 1
      GROUP BY Post.Post_ID
      ORDER BY Post.Post_ID DESC LIMIT 20
    \`;
    const posts = await conn.query(selectAmbassPostsQuery, [User_ID, User_ID]);
    for (let item of posts) {
      item.Profile_Img = "http://triptracks.co.kr/imgserver/" + item.Profile_Img;
      item.Image_Src = "http://triptracks.co.kr/imgserver/" + item.Image_Src;
    }
    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ error: "내부 서버 오류" });
  } finally {
    if (conn) conn.end();
  }
});`,
      },
      {
        name: "엠버서더_대시보드.js",
        type: "js",
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/Trip_Tracks_dash.jpg",
        desc: `엠버서더 권한을 가진 유저의 게시글 대시보드 화면입니다.\n\n게시물 상세 페이지에 필요한 방대한 데이터(본문, 이미지, 댓글, 좋아요, 로그)를 조회하는 API를 구현했습니다.\n단일 쿼리로 해결할 수 없는 파편화된 데이터들을 논리적으로 그룹화하여 서버 단에서 병합하는 로직을 구성했습니다.\n특히, 반복적인 DB 커넥션 호출에 따른 성능 저하를 방지하기 위해 비동기 흐름을 정교하게 제어했습니다.`,
        code: `router.use("/", async (req, res, next) => {
  const { User_ID } = req.session;
  const { Post_ID } = req.body;
  if (!User_ID) return res.status(501).json({ success: false, msg: "로그인이 필요합니다." });
  let conn;
  try {
    conn = await pool.getConnection();
    let [User_Info] = await conn.query("SELECT User_Rule FROM User_Info WHERE User_ID=?", [User_ID]);
    if (!User_Info) return res.status(501).json({ success: false, msg: "사용자 정보 없음" });
    if (User_Info.User_Rule !== 1) return res.status(501).json({ success: false, msg: "권한 없음" });

    let [post] = await conn.query("SELECT P.Post_Caption, P.Post_Title FROM Post P WHERE P.Post_ID = ?", [Post_ID]);
    let images = await conn.query("SELECT PI.Image_Src FROM Post_Image PI WHERE PI.Post_ID = ?", [Post_ID]);
    let comments = await conn.query(\`
      SELECT PC.User_ID AS Comment_User_ID, PC.Comment_Text, UI.Profile_Img
      FROM Post_Comments PC LEFT JOIN User_Info UI ON PC.User_ID = UI.User_ID
      WHERE PC.Post_ID = ?\`, [Post_ID]);
    let likes = await conn.query(\`
      SELECT PL.User_ID AS Like_User_ID, UI.Profile_Img
      FROM Post_Like PL LEFT JOIN User_Info UI ON PL.User_ID = UI.User_ID
      WHERE PL.Post_ID = ?\`, [Post_ID]);

    const BASE = "http://triptracks.co.kr/imgserver/";
    const post_info = {
      ...post,
      Images: images.map(i => BASE + i.Image_Src),
      Comments: comments.map(c => ({
        User_ID: c.Comment_User_ID,
        Profile_Img: BASE + c.Profile_Img,
        Comment: c.Comment_Text,
      })),
      Likes: likes.map(l => ({ User_ID: l.Like_User_ID, Profile_Img: BASE + l.Profile_Img })),
    };
    return res.status(200).json({ post_info });
  } catch (error) {
    res.status(500).json({ message: "오류 발생" });
  } finally {
    if (conn) conn.end();
  }
});`,
      },
    ],
  },
];

const techData = {
  OS: "Linux (Ubuntu)",
  Language: "Java, JavaScript, JSP, C#",
  Framework:
    "Spring Boot, Spring Security, Spring Data JPA, DevExpress, Redis, Flyway",
  ORM: "QueryDsl, JPA, MyBatis",
  DB: "Oracle, MS-SQL, MariaDB, MySQL, AWS RDS, PostgreSQL",
  "IDE/Tool":
    "SQL Developer, IntelliJ, Eclipse, VSCode, Postman, pgAdmin, MySQL Workbench, Visual Studio",
  Infrastructure: "AWS EC2, AWS S3, Tomcat, PM2",
  DevOps: "GitHub Actions, Docker, Azure Storage Explorer",
  Collaboration:
    "Notion, Trello, Figma, ERD-Cloud, Draw.io, Adobe XD, SourceTree, Git, Github",
};

const getFileIcon = (name) => {
  if (name.endsWith(".java"))
    return <FaJava style={{ color: "#e66a05", fontSize: "15px" }} />;
  if (name.endsWith(".js"))
    return <FaJsSquare style={{ color: "#f1e05a", fontSize: "15px" }} />;
  if (name.endsWith(".sql"))
    return <VscDatabase style={{ color: "#e38c00", fontSize: "15px" }} />;
  if (name.endsWith(".md"))
    return <VscMarkdown style={{ color: "#007acc", fontSize: "15px" }} />;
  return <VscFile style={{ color: "#cccccc", fontSize: "15px" }} />;
};

const getLang = (type) => {
  if (!type) return "javascript";
  const t = type.toLowerCase();
  if (t === "java") return "java";
  if (t === "sql") return "sql";
  if (t === "md" || t === "markdown") return "markdown";
  return "javascript";
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function Portfolio() {
  const [viewMode, setViewMode] = useState(0);
  const [openTabs, setOpenTabs] = useState([
    { projectTitle: projects[0].title, file: projects[0].files[0] },
  ]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [showImage, setShowImage] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const [terminalTab, setTerminalTab] = useState("설명");
  const [imgWidthPct, setImgWidthPct] = useState(50);
  const [consoleHeight, setConsoleHeight] = useState(260);
  const [openPkgs, setOpenPkgs] = useState({
    Sloway: true,
    "Task-Flow": true,
    "Trip-Tracks": true,
  });
  const [expandedProject, setExpandedProject] = useState(null);
  const [typedDesc, setTypedDesc] = useState("");

  const isDraggingEditor = useRef(false);
  const isDraggingConsole = useRef(false);
  const editorAreaRef = useRef(null);
  const mainContainerRef = useRef(null);

  const activeTab = openTabs[activeTabIndex] ?? openTabs[0];
  const activeFile = activeTab?.file;
  const activeProject = activeTab?.projectTitle;
  const terminalKey =
    activeProject && activeFile ? `${activeProject}::${activeFile.name}` : null;
  const fileTerminal = terminalKey
    ? (fileTerminalData[terminalKey] ?? null)
    : null;

  const getTerminalContent = () => {
    if (terminalTab === "설명") return activeFile?.desc || "설명이 없습니다.";
    if (!fileTerminal) return `이 파일에 대한 ${terminalTab} 내용이 없습니다.`;
    return fileTerminal[terminalTab] || `내용이 없습니다.`;
  };

  const openTab = useCallback((projectTitle, file) => {
    setOpenTabs((prev) => {
      const idx = prev.findIndex(
        (t) => t.projectTitle === projectTitle && t.file.name === file.name,
      );
      if (idx !== -1) {
        setActiveTabIndex(idx);
        return prev;
      }
      const next = [...prev, { projectTitle, file }];
      setActiveTabIndex(next.length - 1);
      return next;
    });
    setTerminalTab("설명");
    setShowImage(true);
    setShowCode(true);
  }, []);

  const closeTab = useCallback((e, idx) => {
    e.stopPropagation();
    setOpenTabs((prev) => {
      if (prev.length === 1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      setActiveTabIndex((cur) => {
        if (cur >= next.length) return next.length - 1;
        if (cur > idx) return cur - 1;
        return Math.min(cur, next.length - 1);
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (viewMode !== 2) return;
    setTypedDesc("");
    let i = 0;
    const text = getTerminalContent();
    const id = setInterval(() => {
      setTypedDesc(text.slice(0, i));
      i += 6;
      if (i > text.length + 6) {
        setTypedDesc(text);
        clearInterval(id);
      }
    }, 10);
    return () => clearInterval(id);
  }, [activeFile, terminalTab, viewMode]); // eslint-disable-line

  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingEditor.current || !editorAreaRef.current) return;
      const rect = editorAreaRef.current.getBoundingClientRect();
      const pct = Math.min(
        Math.max(((e.clientX - rect.left) / rect.width) * 100, 15),
        85,
      );
      setImgWidthPct(pct);
    };
    const onUp = () => {
      isDraggingEditor.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingConsole.current || !mainContainerRef.current) return;
      const rect = mainContainerRef.current.getBoundingClientRect();
      const fromBottom = rect.bottom - e.clientY;
      setConsoleHeight(Math.min(Math.max(fromBottom, 80), rect.height * 0.7));
    };
    const onUp = () => {
      isDraggingConsole.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const hasImage = !!activeFile?.img;
  const showBoth = hasImage && showImage && showCode;
  const showOnlyImg = hasImage && showImage && !showCode;
  const showOnlyCode = !showImage || !hasImage;

  if (viewMode === 0) {
    return (
      <IntroScreen>
        <div className="content">
          <h1 className="title">Hello, I'm a Developer. Seo Hyeonjin</h1>
          <span className="highlight">안정적인 아키텍처 설계</span>와
          <span className="highlight"> 빠르고 쾌적한 서비스 환경</span>을
          끊임없이 고민하는 개발자입니다.
          <p className="guide-text">
            ※ F11을 눌러 전체 화면으로 보시는 것을 추천드립니다.
          </p>
          <button className="next-btn" onClick={() => setViewMode(1)}>
            포트폴리오 보기 ➔
          </button>
        </div>
      </IntroScreen>
    );
  }

  if (viewMode === 1) {
    return (
      <SplitScreen>
        <LeftPanel>
          <button className="back-btn" onClick={() => setViewMode(0)}>
            ⬅️ Back
          </button>
          <div className="profile-header">
            <h1 className="name">서현진</h1>
            <p className="job-title">Backend / Full-Stack Developer</p>
          </div>
          <div className="info-container">
            {[
              {
                title: "이력",
                items: [
                  {
                    date: "2025.07 - 2025.09",
                    name: "소프트넷 (계약직)",
                    desc: [
                      "솔루션 사업부 기술연구소 연구원",
                      "ERP, 병원MIS프로그램 개발",
                    ],
                  },
                ],
              },
              {
                title: "학력",
                items: [
                  {
                    date: "2020.03 - 2025.02",
                    name: "부천대학교",
                    desc: ["컴퓨터 소프트웨어 학과"],
                  },
                ],
              },
              {
                title: "자격증",
                items: [
                  {
                    date: "2026.06",
                    name: "정보처리산업기사(필기)",
                    desc: ["한국산업인력공단"],
                  },
                  {
                    date: "2025.08",
                    name: "운전면허증(2종보통)",
                    desc: ["서울경창청장"],
                  },
                ],
              },
              {
                title: "교육 수료",
                items: [
                  {
                    date: "2025.11 - 2026.06",
                    name: "AWS 클라우드 기반 Devops 개발자 양성 과정",
                    desc: ["KH정보교육원"],
                  },
                ],
              },
            ].map((sec) => (
              <div className="info-section" key={sec.title}>
                <h2 className="section-title">{sec.title}</h2>
                {sec.items.map((item) => (
                  <div className="info-item" key={item.name}>
                    <span className="date">{item.date}</span>
                    <div className="detail">
                      <div className="title">{item.name}</div>
                      {item.desc.map((d) => (
                        <div className="desc" key={d}>
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="info-section">
            <h2 className="section-title">기술 스택</h2>
            <TechTable>
              <tbody>
                {Object.entries(techData).map(([k, v]) => (
                  <tr key={k}>
                    <th>{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </TechTable>
          </div>
        </LeftPanel>

        <RightPanel>
          <h2 className="toc-title">Project Workspace</h2>
          <div className="project-list">
            {projects.map((p, index) => {
              const isExpanded = expandedProject === index;
              return (
                <div
                  key={p.title}
                  className={`project-card ${isExpanded ? "expanded" : ""}`}
                  onClick={() => setExpandedProject(isExpanded ? null : index)}
                >
                  <div className="card-header">
                    <span className="num">0{index + 1}.</span>
                    <span className="name">{p.title}</span>
                    <span className="arrow">{isExpanded ? "▼" : "▶"}</span>
                  </div>
                  {isExpanded && (
                    <div className="card-body">
                      <div className="desc-list">
                        {p.shortDesc.map((line, i) => (
                          <p key={i}>• {line}</p>
                        ))}
                      </div>
                      <div style={{ marginTop: "15px" }}>
                        <h4 style={{ color: "#569cd6", marginBottom: "8px" }}>
                          Tech Stack
                        </h4>
                        {Object.entries(p.techStack).map(([k, v]) => (
                          <div
                            key={k}
                            style={{ fontSize: "0.85rem", marginBottom: "4px" }}
                          >
                            <span
                              style={{ fontWeight: "bold", color: "#ce9178" }}
                            >
                              {k}:{" "}
                            </span>
                            <span style={{ color: "#d4d4d4" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button className="enter-btn" onClick={() => setViewMode(2)}>
            코드 워크스페이스 입장하기 ➔
          </button>
        </RightPanel>
      </SplitScreen>
    );
  }

  return (
    <Layout>
      <GlobalStyle />
      <TitleBar>
        <div className="menus">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg"
            alt="vscode"
            className="logo"
          />
          {[
            "File",
            "Edit",
            "Selection",
            "View",
            "Go",
            "Run",
            "Terminal",
            "Help",
          ].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
        <div className="title">
          {activeFile?.name} - Portfolio Workspace - Visual Studio Code
        </div>
        <div className="controls">
          <span className="ctrl-btn">
            <VscChromeMinimize />
          </span>
          <span className="ctrl-btn">
            <VscChromeMaximize />
          </span>
          <span className="ctrl-btn close">
            <VscChromeClose />
          </span>
        </div>
      </TitleBar>

      <AppCore>
        <ActivityBar>
          <div className="icon active">
            <VscFiles />
          </div>
          <div className="icon">
            <VscSearch />
          </div>
          <div className="icon">
            <VscSourceControl />
          </div>
          <div className="icon">
            <VscExtensions />
          </div>
          <div className="spacer" />
          <div className="icon">
            <VscAccount />
          </div>
          <div className="icon">
            <VscSettingsGear />
          </div>
        </ActivityBar>

        <Sidebar>
          <SidebarTitle>EXPLORER</SidebarTitle>
          <SidebarSection>∨ PORTFOLIO WORKSPACE</SidebarSection>
          <div className="file-tree">
            {projects.map((p) => (
              <div key={p.title}>
                <PkgName
                  onClick={() =>
                    setOpenPkgs((prev) => ({
                      ...prev,
                      [p.title]: !prev[p.title],
                    }))
                  }
                >
                  <span className="arrow">
                    {openPkgs[p.title] ? (
                      <VscChevronDown />
                    ) : (
                      <VscChevronRight />
                    )}
                  </span>
                  <span className="folder-icon">
                    {openPkgs[p.title] ? (
                      <VscFolderOpened style={{ color: "#dcb67a" }} />
                    ) : (
                      <VscFolder style={{ color: "#dcb67a" }} />
                    )}
                  </span>
                  {p.title}
                </PkgName>
                {openPkgs[p.title] &&
                  p.files.map((f) => (
                    <FileItem
                      key={f.name}
                      active={
                        activeFile?.name === f.name && activeProject === p.title
                      }
                      onClick={() => openTab(p.title, f)}
                    >
                      <span className="f-icon">{getFileIcon(f.name)}</span>
                      {f.name}
                    </FileItem>
                  ))}
              </div>
            ))}
          </div>
        </Sidebar>

        <MainContainer ref={mainContainerRef}>
          <EditorTabs>
            <div className="tabs-wrapper">
              {openTabs.map((tab, idx) => (
                <Tab
                  key={`${tab.projectTitle}-${tab.file.name}-${idx}`}
                  active={idx === activeTabIndex}
                  onClick={() => setActiveTabIndex(idx)}
                >
                  <span className="f-icon">{getFileIcon(tab.file.name)}</span>
                  <span className="f-name">{tab.file.name}</span>
                  <span className="f-close" onClick={(e) => closeTab(e, idx)}>
                    <VscClose />
                  </span>
                </Tab>
              ))}
            </div>
            <HeaderActions>
              {hasImage && (
                <>
                  <ViewToggleBtn
                    active={showImage}
                    onClick={() => setShowImage((v) => !v)}
                  >
                    <VscFileMedia style={{ marginRight: "4px" }} /> 이미지
                  </ViewToggleBtn>
                  <ViewToggleBtn
                    active={showCode}
                    onClick={() => setShowCode((v) => !v)}
                  >
                    <VscCode style={{ marginRight: "4px" }} /> 코드
                  </ViewToggleBtn>
                  <Divider />
                </>
              )}
              <BackToInfoBtn onClick={() => setViewMode(1)}>
                ← 설명으로 돌아가기
              </BackToInfoBtn>
            </HeaderActions>
          </EditorTabs>

          <Breadcrumb>
            <span>Portfolio Workspace</span> &gt; <span>{activeProject}</span>{" "}
            &gt; <span>{activeFile?.name}</span>
          </Breadcrumb>

          <EditorArea ref={editorAreaRef}>
            {showOnlyImg && (
              <ImageSection style={{ width: "100%" }}>
                <img src={activeFile.img} alt="preview" />
              </ImageSection>
            )}

            {showOnlyCode && (
              <CodeSection style={{ width: "100%" }}>
                <SyntaxHighlighter
                  language={getLang(activeFile?.type)}
                  style={vscDarkPlus}
                  showLineNumbers
                  wrapLines
                  customStyle={{
                    background: "transparent",
                    margin: 0,
                    padding: "15px 20px",
                    fontSize: "13px",
                    lineHeight: "1.5",
                  }}
                >
                  {activeFile?.code || ""}
                </SyntaxHighlighter>
              </CodeSection>
            )}

            {showBoth && (
              <>
                <ImageSection style={{ width: `${imgWidthPct}%` }}>
                  <img src={activeFile.img} alt="preview" />
                </ImageSection>
                <DividerHandle
                  onMouseDown={() => {
                    isDraggingEditor.current = true;
                  }}
                >
                  <div className="line" />
                  <div className="grip">⠿</div>
                  <div className="line" />
                </DividerHandle>
                <CodeSection style={{ flex: 1 }}>
                  <SyntaxHighlighter
                    language={getLang(activeFile?.type)}
                    style={vscDarkPlus}
                    showLineNumbers
                    wrapLines
                    customStyle={{
                      background: "transparent",
                      margin: 0,
                      padding: "15px 20px",
                      fontSize: "13px",
                      lineHeight: "1.5",
                    }}
                  >
                    {activeFile?.code || ""}
                  </SyntaxHighlighter>
                </CodeSection>
              </>
            )}
          </EditorArea>

          <ConsoleDivider
            onMouseDown={() => {
              isDraggingConsole.current = true;
            }}
          >
            <div className="dots">· · · · · · · · · · · · · · · · · · · ·</div>
          </ConsoleDivider>

          <ConsoleArea style={{ height: `${consoleHeight}px` }}>
            <TerminalTabs>
              <TermSubTab
                active={terminalTab === "설명"}
                onClick={() => setTerminalTab("설명")}
              >
                <VscTerminal style={{ marginRight: "4px" }} />
                화면 설명
              </TermSubTab>
              <TermSubTab
                active={terminalTab === "회고"}
                onClick={() => setTerminalTab("회고")}
              >
                <VscMarkdown style={{ marginRight: "4px" }} />
                회고
              </TermSubTab>
              <TermSubTab
                active={terminalTab === "트러블슈팅"}
                onClick={() => setTerminalTab("트러블슈팅")}
              >
                <VscFile style={{ marginRight: "4px" }} />
                트러블슈팅
              </TermSubTab>
            </TerminalTabs>
            <TerminalContent>
              <div className="prompt">
                <span className="path">portfolio@macbook</span>
                <span className="colon">:</span>
                <span className="dir">~/{activeProject}</span>
                {terminalTab === "설명"
                  ? `$ ./explain.sh ${activeFile?.name}`
                  : terminalTab === "회고"
                    ? `$ cat RETROSPECTIVE.md   # ${activeFile?.name}`
                    : `$ cat TROUBLESHOOTING.md   # ${activeFile?.name}`}
              </div>
              <div className="output">
                {typedDesc}
                <span className="cursor">█</span>
              </div>
            </TerminalContent>
          </ConsoleArea>
        </MainContainer>
      </AppCore>

      <StatusBar>
        <div className="left">
          <span className="item remote">{"><"}</span>
          <span className="item">
            <VscSourceControl style={{ marginRight: "4px" }} />
            main*
          </span>
          <span className="item">❌ 0 ⚠️ 0</span>
        </div>
        <div className="right">
          <span className="item">Ln 1, Col 1</span>
          <span className="item">Spaces: 2</span>
          <span className="item">UTF-8</span>
          <span className="item">{(activeFile?.type || "").toUpperCase()}</span>
          <span className="item">Prettier ✅</span>
          <span className="item">
            <VscBell />
          </span>
        </div>
      </StatusBar>
    </Layout>
  );
}

// ─── 스타일 ───────────────────────────────────────────────────────────────────
const IntroScreen = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: "Consolas", "Courier New", monospace;
  .content {
    text-align: center;
    animation: fadeIn 1s ease-in-out;
  }
  .title {
    font-size: 3rem;
    color: #569cd6;
    margin-bottom: 20px;
  }
  .highlight {
    color: #ff3f3f;
    font-weight: 700;
    font-size: 1.5rem;
  }
  .guide-text {
    font-size: 0.9rem;
    color: #858585;
    margin-bottom: 40px;
  }
  .next-btn {
    padding: 12px 24px;
    font-size: 1.1rem;
    background: #0e639c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      background: #1177bb;
    }
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SplitScreen = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  background: #1e1e1e;
  color: #ccc;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  width: 50%;
  padding: 40px 50px;
  background: #181818;
  border-right: 1px solid #333;
  overflow-y: auto;
  position: relative;
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 4px;
  }
  .back-btn {
    position: absolute;
    top: 30px;
    left: 40px;
    background: none;
    border: none;
    color: #858585;
    font-size: 1rem;
    cursor: pointer;
    &:hover {
      color: #d4d4d4;
    }
  }
  .profile-header {
    margin-bottom: 40px;
    .name {
      font-size: 2.2rem;
      color: #fff;
      margin-bottom: 5px;
    }
    .job-title {
      font-size: 1.2rem;
      color: #569cd6;
    }
  }
  .info-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding-bottom: 30px;
  }
  .info-section {
    .section-title {
      font-size: 1.1rem;
      color: #ce9178;
      border-bottom: 1px solid #333;
      padding-bottom: 8px;
      padding-left: 5px;
      margin-bottom: 15px;
    }
  }
  .info-item {
    display: flex;
    margin-bottom: 15px;
    .date {
      min-width: 130px;
      font-size: 0.9rem;
      color: #b5cea8;
      font-family: "Consolas", monospace;
    }
    .detail {
      flex: 1;
      .title {
        font-size: 1rem;
        color: #d4d4d4;
        font-weight: bold;
        margin-bottom: 4px;
        margin-left: 10px;
      }
      .desc {
        font-size: 0.9rem;
        margin-left: 10px;
        color: #858585;
      }
    }
  }
`;

const RightPanel = styled.div`
  width: 50%;
  height: 100%;
  padding: 50px;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  .toc-title {
    font-size: 1.8rem;
    color: #4ec9b0;
    margin-bottom: 30px;
  }
  .project-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
    padding-right: 10px;
    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-thumb {
      background: #444;
      border-radius: 4px;
    }
  }
  .project-card {
    background: #252526;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: #2d2d2d;
      border-color: #569cd6;
    }
  }
  .card-header {
    display: flex;
    align-items: center;
    .num {
      font-size: 1.2rem;
      color: #858585;
      font-family: "Consolas", monospace;
      margin-right: 12px;
    }
    .name {
      font-size: 1.2rem;
      font-weight: bold;
      color: #dcdcaa;
      flex: 1;
    }
    .arrow {
      color: #858585;
    }
  }
  .card-body {
    padding-top: 10px;
  }
  .desc-list p {
    color: #999;
    font-size: 0.9rem;
    margin: 4px 0;
  }
  .enter-btn {
    width: 100%;
    padding: 16px;
    font-size: 1.1rem;
    font-weight: bold;
    background: #0e639c;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 70px;
    &:hover {
      background: #1177bb;
    }
  }
`;

const TechTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: #1e1e1e;
  border: 1px solid #333;
  color: #d4d4d4;
  th,
  td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #333;
  }
  th {
    color: #ce9178;
    width: 25%;
    font-weight: bold;
  }
  td {
    color: #9cdcfe;
  }
`;

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #1e1e1e;
`;

const TitleBar = styled.div`
  height: 30px;
  background: #181818;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #2b2b2b;
  user-select: none;
  position: relative;
  .menus {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: #ccc;
    .logo {
      width: 16px;
      height: 16px;
      margin: 0 10px;
    }
    span {
      padding: 4px 8px;
      cursor: pointer;
      &:hover {
        background: #333;
        border-radius: 4px;
      }
    }
  }
  .title {
    font-size: 12px;
    color: #999;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .controls {
    display: flex;
    height: 100%;
    .ctrl-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 45px;
      height: 100%;
      cursor: pointer;
      font-size: 12px;
      color: #ccc;
      &:hover {
        background: #333;
      }
      &.close:hover {
        background: #e81123;
        color: white;
      }
    }
  }
`;

const AppCore = styled.div`
  display: flex;
  flex: 1;
  height: calc(100vh - 52px);
`;

const ActivityBar = styled.div`
  width: 48px;
  background: #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
  .icon {
    font-size: 22px;
    margin-bottom: 15px;
    cursor: pointer;
    opacity: 0.4;
    transition: 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 40px;
    &:hover {
      opacity: 1;
    }
    &.active {
      opacity: 1;
      border-left: 2px solid #007acc;
      color: #007acc;
    }
  }
  .spacer {
    flex: 1;
  }
`;

const Sidebar = styled.nav`
  width: 250px;
  background: #252526;
  border-right: 1px solid #1e1e1e;
  display: flex;
  flex-direction: column;
  .file-tree {
    flex: 1;
    overflow-y: auto;
    &::-webkit-scrollbar {
      width: 10px;
    }
    &::-webkit-scrollbar-thumb {
      background: #464646;
      border: 2px solid #252526;
      border-radius: 5px;
    }
  }
`;

const SidebarTitle = styled.div`
  padding: 15px 20px 10px;
  font-size: 11px;
  color: #bbb;
  letter-spacing: 1px;
`;

const SidebarSection = styled.div`
  padding: 5px 10px;
  font-size: 11px;
  font-weight: bold;
  color: #ccc;
  background: #2a2d2e;
  cursor: pointer;
`;

const PkgName = styled.div`
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
  color: #ccc;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover {
    background: #2a2d2e;
  }
  .arrow {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #aaa;
  }
  .folder-icon {
    display: flex;
    align-items: center;
    font-size: 16px;
  }
`;

const FileItem = styled.div`
  padding: 5px 10px 5px 35px;
  cursor: pointer;
  font-size: 13px;
  color: ${(p) => (p.active ? "#fff" : "#ccc")};
  background: ${(p) => (p.active ? "#37373d" : "transparent")};
  border-left: 1px solid ${(p) => (p.active ? "#007acc" : "transparent")};
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover {
    background: ${(p) => (p.active ? "#37373d" : "#2a2d2e")};
  }
  .f-icon {
    display: flex;
    align-items: center;
  }
`;

const MainContainer = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const EditorTabs = styled.div`
  display: flex;
  background: #252526;
  height: 35px;
  justify-content: space-between;
  overflow: hidden;
  .tabs-wrapper {
    display: flex;
    flex: 1;
    overflow-x: auto;
    &::-webkit-scrollbar {
      height: 0;
    }
  }
`;

const Tab = styled.div`
  background: ${(p) => (p.active ? "#1e1e1e" : "#2d2d2d")};
  color: ${(p) => (p.active ? "#fff" : "#999")};
  border-top: 1px solid ${(p) => (p.active ? "#007acc" : "transparent")};
  border-right: 1px solid #1e1e1e;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
  min-width: 140px;
  max-width: 200px;
  &:hover {
    background: ${(p) => (p.active ? "#1e1e1e" : "#323232")};
    color: #fff;
  }
  .f-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .f-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .f-close {
    display: flex;
    align-items: center;
    font-size: 14px;
    opacity: 0;
    transition: 0.15s;
    border-radius: 4px;
    padding: 2px;
    flex-shrink: 0;
    color: #aaa;
  }
  &:hover .f-close {
    opacity: 1;
  }
  .f-close:hover {
    background: #333;
    color: #fff;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 4px;
  background: #252526;
  flex-shrink: 0;
`;

const ViewToggleBtn = styled.button`
  background: ${(p) => (p.active ? "#37373d" : "transparent")};
  color: ${(p) => (p.active ? "#fff" : "#888")};
  border: 1px solid ${(p) => (p.active ? "#555" : "#3c3c3c")};
  cursor: pointer;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  &:hover {
    background: #2a2d2e;
    color: #fff;
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 16px;
  background: #444;
  margin: 0 4px;
`;

const BackToInfoBtn = styled.button`
  background: transparent;
  color: #9cdcfe;
  border: 1px solid #3c3c3c;
  cursor: pointer;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  &:hover {
    background: #2a2d2e;
    color: #fff;
    border-color: #569cd6;
  }
`;

const Breadcrumb = styled.div`
  padding: 4px 15px;
  font-size: 12px;
  color: #999;
  background: #1e1e1e;
  border-bottom: 1px solid #2b2b2b;
  span {
    cursor: pointer;
    &:hover {
      color: #ccc;
      text-decoration: underline;
    }
  }
`;

const EditorArea = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const ImageSection = styled.div`
  background: #1e1e1e;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  flex-shrink: 0;
  overflow: hidden;
  border-right: 1px solid #2b2b2b;
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }
`;

const DividerHandle = styled.div`
  width: 6px;
  background: #1e1e1e;
  cursor: col-resize;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  z-index: 10;
  .line {
    width: 1px;
    height: 30%;
    background: #3c3c3c;
  }
  .grip {
    color: #555;
    font-size: 10px;
    line-height: 1;
    user-select: none;
  }
  &:hover {
    background: #007acc22;
  }
  &:hover .line {
    background: #007acc;
  }
  &:hover .grip {
    color: #007acc;
  }
`;

const CodeSection = styled.div`
  background: #1e1e1e;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
  &::-webkit-scrollbar {
    width: 14px;
  }
  &::-webkit-scrollbar-thumb {
    background: #464646;
    border: 4px solid #1e1e1e;
    border-radius: 8px;
  }
`;

const ConsoleDivider = styled.div`
  height: 6px;
  background: #252526;
  cursor: row-resize;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #2b2b2b;
  border-bottom: 1px solid #2b2b2b;
  user-select: none;
  .dots {
    font-size: 10px;
    color: #555;
    letter-spacing: 2px;
    line-height: 1;
  }
  &:hover {
    background: #2a2d2e;
  }
  &:hover .dots {
    color: #007acc;
  }
`;

const ConsoleArea = styled.div`
  background: #1e1e1e;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
`;

const TerminalTabs = styled.div`
  display: flex;
  padding: 0 20px;
  gap: 2px;
  border-bottom: 1px solid #2b2b2b;
  align-items: stretch;
  flex-shrink: 0;
  span {
    padding: 7px 10px;
    font-size: 11px;
    cursor: pointer;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    white-space: nowrap;
    &.inactive {
      color: #888;
      &:hover {
        color: #ccc;
      }
    }
  }
`;

const TermSubTab = styled.span`
  color: ${(p) => (p.active ? "#e7e7e7" : "#888")} !important;
  border-bottom: ${(p) => (p.active ? "1px solid #e7e7e7" : "none")} !important;
  background: ${(p) => (p.active ? "#1e1e1e22" : "transparent")};
  border-radius: 3px 3px 0 0;
  &:hover {
    color: #ccc !important;
    background: #2a2d2e;
  }
`;

const TerminalContent = styled.div`
  padding: 10px 20px;
  overflow-y: auto;
  flex: 1;
  font-family: "Consolas", "Courier New", monospace;
  &::-webkit-scrollbar {
    width: 14px;
  }
  &::-webkit-scrollbar-thumb {
    background: #464646;
    border: 4px solid #1e1e1e;
    border-radius: 8px;
  }
  .prompt {
    font-size: 13px;
    color: #ccc;
    margin-bottom: 8px;
    .path {
      color: #50fa7b;
      font-weight: bold;
    }
    .colon {
      color: #f8f8f2;
    }
    .dir {
      color: #8be9fd;
      font-weight: bold;
    }
  }
  .output {
    font-size: 13px;
    color: #ccc;
    white-space: pre-wrap;
    line-height: 1.6;
    .cursor {
      animation: blink 1s step-end infinite;
    }
  }
  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
`;

const StatusBar = styled.div`
  height: 22px;
  background: #007acc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: white;
  padding: 0 10px;
  font-family: "Segoe UI", sans-serif;
  user-select: none;
  .left,
  .right {
    display: flex;
    align-items: center;
    gap: 15px;
    height: 100%;
  }
  .item {
    display: flex;
    align-items: center;
    cursor: pointer;
    height: 100%;
    padding: 0 4px;
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
    }
  }
  .remote {
    background: #16825d;
    padding: 0 8px;
    height: 100%;
    display: flex;
    align-items: center;
    margin-left: -10px;
    font-weight: bold;
  }
`;
