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
  VscSplitHorizontal,
  VscDatabase,
  VscMarkdown,
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeClose,
  VscBell,
  VscClose,
  VscFile,
  VscTerminal,
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

// ─── 터미널 전용 데이터 (회고 / 트러블슈팅) ────────────────────────────────
const terminalData = {
  Sloway: {
    회고: `#  프로젝트 회고

## 성능 최적화 및 데이터 조회 관련

### 좋았던 점
- 대용량 데이터 환경에서 조회 속도 저하 문제를 해결하기 위해 Materialized view를 활용한 캐싱 전략과 데이터베이스 인덱스 튜닝을 도입하여 쿼리 성능을 획기적으로 개선하는 값진 경험을 했습니다.
- 실행 계획을 분석하여 병목이 생기는 테이블에 적절한 복합 인덱스를 설정하고, 자주 조회되는 정적 데이터는 캐시 레이어로 분리함으로써 DB 뷰 및 복잡한 조건 검색의 응답 시간을 평균 28.3초에서 평균 0.4초까지 단축했습니다.

### 아쉬운 점
- 초기 아키텍처 설계 단계에서 대용량 데이터 적재 및 고빈도 조회 상황을 정밀하게 예측하지 못해, 프로젝트 중반부에 특정 기능(조회/통계/랭킹 등)에서 심각한 데이터 조회 속도 저하 문제를 겪었습니다.

### 시도해볼 만한 점
- 향후 프로젝트에서는 초기 테이블 스키마 설계 단계부터 데이터 조회 빈도와 대략적인 볼륨을 미리 상정하여 인덱스 전략을 선제적으로 수립하겠습니다.
- 정합성 보장 로직을 더 정교하게 고도화하여 캐시 스탬피드 현상을 방지하는 구조를 도입해 보고 싶습니다.

---

## 팀 내부 소통 및 협의 관련

### 좋았던 점
- 기술적 이슈나 아키텍처 방향성에 대해 팀원 간의 활발한 피드백이 오갔으며, 서로의 의견을 존중하는 건강한 개발 문화 속에서 작업할 수 있었습니다.

### 아쉬운 점
- 개발을 진행하면서 특정 기능의 구현 방식이나 우선순위에 대해 팀원 간에 생각하는 방향성과 관점이 달라 초기 의견 조율 과정에서 다소 팽팽한 의견 대립이나 병목이 발생하기도 했습니다.

### 시도해볼 만한 점
- 각자 생각하는 방향성이 다를 때 고집을 부리기보다, 적극적인 기술 공유와 기술 문서 기반의 협의를 통해 싱크를 맞췄습니다.
- 다음 프로젝트에서는 기획 및 구체적인 스펙 확정 단계에서 화면 설계서나 API 명세를 더 세밀하게 맞추어, 싱크가 어긋나는 타이밍을 최소화하겠습니다.

---

## 회고를 마치며
단순히 기능 구현에 그치지 않고, 데이터 조회 성능 저하라는 실무적인 문제를 캐싱과 인덱스 튜닝을 통해 직접 돌파해 보며 백엔드 개발자로서 크게 성장할 수 있었던 프로젝트였습니다.`,
    트러블슈팅: `# Trouble Shooting: 대용량 통계 데이터 조회 성능 최적화

## 1. 배경 및 문제 상황
서비스 내에서 대용량 데이터를 기반으로 대시보드 및 통계 데이터를 실시간으로 조회하는 기능이 있었습니다.
하지만 데이터 누적량이 증가함에 따라 실시간 통계 조회 시 평균 28.3초, 심할 때는 최대 32.1초까지 소요되는 심각한 성능 저하 현상이 발생했습니다.

웹 서비스 환경에서 30초에 육박하는 응답 시간은 사용자에게 빈 화면이나 무한 로딩을 보여주게 되어
사용자 경험(UX)을 치명적으로 해치고, 브라우저의 Connection Timeout을 유발하는 화급한 리스크였습니다.

---

## 2. 원인 분석
성능 저하의 원인을 파악하기 위해 문제가 되는 통계 쿼리를 통해 데이터베이스 실행 계획을 분석했습니다.

- 인덱스 부재 및 전체 테이블 조회: 수많은 조인과 대규모 데이터 정렬, 그룹화가 복합적으로 일어나는 쿼리였음에도 불구하고,
  복합 인덱스가 제대로 설정되어 있지 않아 Full Table Scan이 발생하고 있었습니다.
- 실시간 연산의 한계: 매 요청마다 수백만 건에 달하는 로우를 실시간으로 집계하고 연산하는 구조 자체가 데이터베이스 CPU에 엄청난 과부하를 주고 있었습니다.

---

## 3. 단계별 개선 과정

### [1단계] 쿼리 튜닝 및 인덱스 최적화
- 조치: 쿼리 조건절과 그룹화에 자주 사용되는 핵심 컬럼들을 조합하여 최적의 복합 인덱스를 설계하고 반영했습니다.
- 결과: 평균 12.4초로 단축 (약 2배 이상 성능 향상). 아직 사용자에게 실시간 제공하기엔 무거운 수치였습니다.

### [2단계] 캐싱 전략 및 데이터 구조화
- 조치: 통계 데이터의 특성상 '완벽한 실시간성'보다는 '정확한 주기별 집계(분 단위)'가 더 중요하다는 비즈니스적 판단을 내렸습니다.
- 구현: Spring Boot의 Scheduler 기능을 활용하여, 10분 주기로 백그라운드에서 통계 배치 쿼리가 돌며 집계 테이블을 갱신하도록 아키텍처를 전면 리팩토링했습니다.

---

## 4. 최종 성과

- 조회 속도: 평균 28.3초 → 0.38초 (약 98.8% 성능 향상)
- 사용자 경험 극대화: 무한 로딩에 가깝던 통계 페이지가 클릭과 동시에 렌더링되는 쾌적한 환경을 구축했습니다.
- 시스템 안정성: 데이터베이스의 피크 타임 CPU 점유율을 현저히 낮추어 다른 핵심 비즈니스 로직의 트랜잭션 안정성까지 확보했습니다.`,
  },
  "Task-Flow": {
    회고: `# 프로젝트 회고

## 프로젝트 기간 및 일정 관리 회고
- 아쉬웠던 점: 프로젝트 기간이 짧아 기획했던 모든 기능을 완벽하게 구현하는 데 어려움이 있었습니다.
  특히 기능 간의 의존성을 사전에 면밀히 파악하지 못해 병목 현상이 발생했고, 이로 인해 팀원 간 구현 타이밍이 어긋나는 등 전체적인 완성도 측면에서 아쉬움이 남습니다.
- 배운 점: 공동의 목표를 달성하기 위해 각자의 역할을 수행하며, 팀원들과 끊임없이 피드백을 교환하고 소통하는 과정의 중요성을 체득했습니다.

## 향후 개선 및 다짐
1. 체계적인 마일스톤 관리: 기획 단계에서부터 기능 간의 선후 관계를 명확히 정의하고, 구현 순서에 우선순위를 부여하여 리스크를 최소화하겠습니다.
2. 주도적인 소통과 협업: 중간 점검을 생활화하고 API/데이터 명세를 세밀하게 정의하여 싱크가 어긋나는 타이밍을 최소화하겠습니다.
3. 책임감 있는 개발자: 이번 경험을 자양분 삼아, 앞으로는 더욱 체계적인 일정 관리와 주도적인 자세로 팀의 목표를 향해 기여하는 개발자로 성장하겠습니다.

---

## 회고를 마치며
단순한 기능 구현을 넘어 시간 관리와 협업의 가치를 깊이 깨달은 소중한 시간이었습니다.
이번 프로젝트에서 얻은 교훈을 바탕으로, 앞으로 더 단단하고 책임감 있는 개발자가 되겠습니다.`,
    트러블슈팅: `# 트러블슈팅: 권한 로직 개선을 통한 쿼리 성능 최적화

## 문제 상황
- 권한 정책의 모호성: '마일스톤은 담당자만 열람 가능'한 반면 '체크리스트는 누구나 열람 가능'한 상이한 권한 정책이 혼재했습니다.
- 성능 저하 및 병목: 체크리스트 조회 시 권한 확인을 위해 불필요한 JOIN 연산이 매번 발생했습니다.
- 데이터 정합성 이슈: 복잡한 권한 검증 로직으로 인해 N+1 문제 발생 위험이 높고, 쿼리 복잡도가 증가했습니다.

## 해결 과정
- 권한 정책 재정립: 팀원들과의 기술 협의를 통해 '권한의 일관성'을 우선순위로 설정했습니다.
- 데이터 접근 제어 최적화: 유저가 생성할 수 있는 데이터의 범위를 프로젝트 및 부서 단위로 명확하게 제한했습니다.
- 테이블 구조 재설계: 권한 체크를 위해 복잡하게 얽혀있던 테이블 관계를 단순화하고, 인덱스 활용도가 높은 구조로 데이터 모델링을 변경했습니다.

## 결과
- 쿼리 효율성 개선: 복잡한 권한 JOIN 구조를 단순화하여 조회 쿼리의 응답 속도를 향상시켰습니다.
- 보안성 강화: 일관된 권한 정책 적용으로 데이터 접근 제어의 안전성을 확보했습니다.
- 유지보수 용이성: 불필요한 N+1 쿼리 위험 요소를 제거하여 코드 가독성 및 유지보수 편의성을 증대시켰습니다.`,
  },
  "Trip-Tracks": {
    회고: `# 프로젝트를 마치며: 학습과 협업의 조화

## 새로운 도전을 통한 성장
이번 프로젝트는 저에게 있어 첫 번째 장기 프로젝트이자 도전의 연속이었습니다.
단순히 기존에 알고 있던 지식을 활용하는 것에 그치지 않고,
매 순간 새로운 기술을 탐구하고 실무에 적용하는 '공부하며 구현하는' 개발 과정을 경험했습니다.

특히 처음 접해보는 Node.js 환경에서 백엔드 작업을 진행하며, express-session을 활용한 세션 관리 로직을 직접 구현해 보는 등 기술적 스펙트럼을 넓힐 수 있는 값진 시간이었습니다.
낯선 기술을 마주했을 때 끝까지 포기하지 않고 레퍼런스를 서칭하며 스스로 문제 해결 능력을 키워나간 경험은 개발자로서 한 단계 성장하는 계기가 되었습니다.

## 최고의 팀워크와 기능 분배
- 원활한 소통: 팀원들 간의 유대감이 좋아 막히는 부분이 있을 때 언제든 자유롭게 질문하고 피드백을 주고받을 수 있는 환경이 조성되었습니다.
- 효율적인 기능 분배: 각자의 강점을 살린 기능 분배를 통해 프로젝트의 속도와 완성도를 동시에 잡을 수 있었습니다.

---

이번 프로젝트는 저에게 기술적인 성취감뿐만 아니라, '함께 만드는 가치'가 무엇인지 알려준 소중한 기회였습니다.`,
    트러블슈팅: `# 트러블슈팅: SSH 인증 및 네트워크 방화벽 이슈 해결

## 문제 상황
- SSH 프로세스 이해 부족: 배포 환경에서 팀원 전원이 SSH 인증 메커니즘에 대한 미숙지로 인해 서버 접근이 불가능한 상황이 발생했습니다.
- 배포 지연: 개발 환경에서 배포 환경으로 넘어가는 과정에서 네트워크 통신 차단으로 인해 개발 업무 전체가 중단되는 병목 현상이 발생했습니다.

## 해결 과정
- 프로토콜 및 정책 분석: SSH 프로토콜의 인증 방식과 네트워크 방화벽 정책을 정밀하게 리서치했습니다.
- 방화벽 인프라 최적화: 서버 인바운드 및 아웃바운드 포트 정책을 보안 지침에 맞춰 재구성했습니다.
- SSH 키 관리 체계 수립: 서버 접속을 위한 권한 관리 가이드라인 및 안전한 키 배포 방안을 마련했습니다.

## 결과
- 운영 환경 정상화: 팀원 전원의 서버 접속 문제를 해결하여 즉시 배포 가능한 환경을 구축했습니다.
- 팀 기술 자산화: SSH 접속 가이드 및 방화벽 설정 매뉴얼을 작성하여 팀 내부 메신저에 배포, 향후 발생 가능한 유사 이슈에 대한 대응력을 확보했습니다.
- 운영 효율성 증대: 기술 문서 공유를 통해 팀원들의 인프라 이해도를 높이고, 인프라 이슈로 인한 커뮤니케이션 리소스를 대폭 절감시켰습니다.`,
  },
};

// ─── 프로젝트 데이터 (회고/트러블슈팅 파일 제거) ────────────────────────────
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
        code: `-- 기존에 테이블이 있다면 삭제
DROP TABLE IF EXISTS place_summary;
-- 기존에 존재하는 Materialized view 삭제
DROP MATERIALIZED VIEW IF EXISTS place_summary;

-- Materialized View 생성
CREATE MATERIALIZED VIEW place_summary AS
WITH
RsvnStats AS (
    SELECT
        p.no as place_no,
        p.type,
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
    p.no as place_no,
    p.type,
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

-- REFRESH CONCURRENTLY를 위한 인덱스 생성
CREATE UNIQUE INDEX idx_place_summary_unique ON place_summary (place_no, type);`,
        desc: `유닛의 예약, 리뷰 정보를 통계알고리즘을 통해 랭킹을 만들어 제공합니다.\n
통계 데이터를 실시간으로 조회를 진행했을 시 최저 24.3초 최대 32.1초 평균값 28.3초가 소요되는 점을 발견했습니다.
인덱스를 통한 튜닝 진행하여 최저 8.2초 최대 16.8초 평균 12.4초까지 속도를 개선했으나 사용자가 사용하기에 모자라다고 판단하여 캐싱을 진행했습니다.
데이터베이스의 통계 조회용 테이블을 생성하여 진행하기보다는 통계값을 디스크에 직접 저장하여 조회속도가 더 빠른 materialized view를 활용하여 진행했습니다.
스케쥴러를 통해 10분에 한번씩 값이 반영되도록 설계했습니다. 실시간성을 잃지만 조회 속도가 최저 0.24초 최대 0.48초 평균 0.38초까지 개선되었습니다.

알고리즘:
첫번째 컴포넌트: (총 예약건수 * 0.7 + 리뷰의 평균 * 0.3) + (7일이내 신규 유닛: 0.5) * 100
두번째 컴포넌트: (공간에 속한 유닛들의 총 예약건수 * 0.7 + 리뷰의 평균 * 0.3) + (7일이내 신규 공간: 0.5) * 100
세번째 컴포넌트: (워크앤스테이 유닛의 총 예약건수 * 0.7 + 리뷰의 평균 * 0.3) + (7일이내 신규: 0.5) * 100`,
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/sloway_mainPage.png",
      },
      {
        name: "워크앤스테이 상세.java",
        type: "java",
        code: `@Override
public StationDetailRespDto selectWorkStayDetailDashBoard(Long no, Long memberNo) {
    Tuple tuple = fetchWorkStayBasicInfo(no, memberNo);
    if (tuple == null) {
        throw new IllegalArgumentException("해당 워케이션 정보를 찾을 수 없거나 권한이 없습니다. id=" + no);
    }
    StationDetailRespDto.SummaryCard summary = fetchSummaryCard(no);
    StationDetailRespDto.HeaderInfo headerInfo = buildWorkStayHeaderInfo(tuple, summary);
    StationDetailRespDto.BasicInfo basicInfo = buildWorkStayBasicInfo(tuple);
    List<String> facilities = fetchFacilities(no);
    List<StationDetailRespDto.RecentBooking> recentBookings = fetchRecentBookings(no);
    return StationDetailRespDto.builder()
            .header(headerInfo)
            .basicInfo(basicInfo)
            .summary(summary)
            .facilities(facilities)
            .recentBookings(recentBookings)
            .build();
}

private Tuple fetchWorkStayBasicInfo(Long workStayId, Long memberNo) {
    var latestHostPlaceIdSubQuery = JPAExpressions
            .select(hostPlaceEntity.no.max())
            .from(hostPlaceEntity)
            .where(hostPlaceEntity.workStayEntity.no.eq(workStayId));

    return queryFactory
            .select(
                    workStayEntity.title,
                    placeEntity.title,
                    placeEntity.type,
                    hostPlaceEntity.status,
                    placeEntity.address,
                    workStayEntity.maxCnt,
                    workStayEntity.cnt,
                    workStayEntity.monPrice,
                    workStayEntity.holPrice,
                    workStayEntity.checkinTime,
                    workStayEntity.checkoutTime,
                    imgWorkStayEntity.currentUrl
            )
            .from(workStayEntity)
            .join(placeEntity).on(placeEntity.no.eq(workStayEntity.placeEntity.no))
            .leftJoin(imgWorkStayEntity).on(imgWorkStayEntity.workStayEntity.no.eq(workStayId).and(imgWorkStayEntity.sort.eq(1)))
            .join(hostPlaceEntity).on(hostPlaceEntity.workStayEntity.no.eq(workStayEntity.no))
            .join(hostPlaceEntity.hostEntity, hostEntity)
            .where(
                    workStayEntity.no.eq(workStayId),
                    hostEntity.memberNo.eq(memberNo),
                    hostPlaceEntity.no.in(latestHostPlaceIdSubQuery)
            )
            .fetchOne();
}`,
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/sloway_workStayDetailPage.png",
        desc: `워크앤스테이 상세조회 화면입니다.\n
다중 Join이 발생하는 테이블 구조를 place_summary (Materialized View)로 구조화하여 조회 성능을 대폭 향상했습니다.
또한, 쿼리 플랜 분석을 바탕으로 인덱스를 전략적으로 배치하여 데이터 조회 속도를 최적화했습니다.

유닛의 상태(검수/운영) 필드를 도입하여 데이터 생명주기를 관리합니다.
특히, 검수 대기 상태에서는 수정 버튼을 조건부 렌더링하여 관리자의 승인 전 수정 시도를 방지하고 안정적인 운영을 유도했습니다.`,
      },
      {
        name: "검수상세 페이지.java",
        type: "java",
        code: `@Override
public ApprovalDetailRespDto findWorkStayDetail(Long no) {
    var latestPendingHostPlaceIdSubQuery = JPAExpressions
            .select(hostPlaceEntity.no.max())
            .from(hostPlaceEntity)
            .where(hostPlaceEntity.workStayEntity.no.eq(no)
                    .and(hostPlaceEntity.status.eq(ApprovalStatus.P)));

    ApprovalDetailRespDto dto = queryFactory
            .select(Projections.constructor(ApprovalDetailRespDto.class,
                    hostPlaceEntity.no,
                    placeEntity.no,
                    placeEntity.type,
                    workStayEntity.title,
                    workStayEntity.content,
                    placeEntity.address,
                    memberEntity.name,
                    workStayEntity.monPrice,
                    workStayEntity.cnt,
                    workStayEntity.maxCnt,
                    workStayEntity.checkinTime,
                    workStayEntity.checkoutTime
            ))
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
    }
    return dto;
}`,
        desc: `검수 상세 페이지입니다.\n
클라우드 스토리지 활용: 유닛 이미지 데이터를 AWS S3 Bucket을 통해 관리하여 서버의 부하를 분산하고, 확장성 있는 미디어 처리 인프라를 구축했습니다.

운영 품질 관리: 검수 과정에서 사진 체크리스트 검증 로직을 강제하여, 호스트가 등록한 공간의 정보가 운영 기준을 충족했는지 체계적으로 확인하도록 설계했습니다.

운영 무결성 확보: 모든 체크리스트 항목이 승인 조건에 부합해야만 검수 완료가 가능하도록 로직을 구현하여, 운영 데이터의 품질을 일관되게 유지합니다.`,
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/sloway_approvalDetailPage.png",
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
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/TaskFlow_MainPage.png",
        desc: `프로젝트를 업데이트하기 위한 페이지입니다.
프로젝트 고유번호인 no값을 통한 조회로 유효성을 체크한 후, Project테이블의 정보들을 수정하고, 담당하는 부서를 변경합니다.
프로젝트 일정도 삭제 후 재삽입 방식으로 갱신하며, 담당자를 지정하기위해 다대다 관계의 중계테이블을 참조하여 담당자 정보를 체크하여 수정합니다.`,
      },
      {
        name: "마일스톤 상세조회.sql",
        type: "sql",
        code: `SELECT DISTINCT
    M.NO
    ,M.SCHE_NO       AS scheno
    ,M.TITLE
    ,M.CONTENT
    ,M.LABEL
    ,M.STATE
    ,M.START_DATE    AS startDate
    ,M.END_DATE      AS endDate
    ,M.FOLLOWER_NO   AS followerNo
    ,EM.NAME         AS followerName
    ,PEME.NO         AS mileEmplNo
    ,PEME.NAME       AS mileEmplName
    ,PEPE.NO         AS projEmplNo   
    ,PEPE.NAME       AS projEmplName
FROM MILE M
    LEFT JOIN EMPL EM
        ON EM.NO = M.FOLLOWER_NO
    INNER JOIN PROJ_EMPL PEM
        ON PEM.MILE_NO = M.NO
        AND PEM.IS_WRITER_YN = 'Y'
            INNER JOIN EMPL PEME
                ON PEME.NO = PEM.EMPL_NO
    LEFT JOIN PROJ_EMPL PEP
        ON PEP.PROJ_NO = #{projNo}
        AND PEP.IS_MANAGER_YN = 'Y'
            INNER JOIN EMPL PEPE
                ON PEPE.NO = PEP.EMPL_NO
WHERE M.DEL_AT IS NULL
    AND M.NO = #{no}`,
        desc: `마일스톤 상세 조회를 위한 핵심 쿼리입니다.
마일스톤과 담당 부서, 프로젝트 간의 데이터 무결성을 보장하기 위해 핵심 식별자 기반의 INNER JOIN 구조를 명확히 설계했습니다.
담당자 정보 누락 없이 정확한 비즈니스 데이터를 결합하는 것을 최우선으로 고려했으며,
불필요한 Full Scan을 방지하고 조인 연산의 효율성을 극대화하기 위해 인덱스를 고려한 결합 조건을 적용했습니다.`,
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/TaskFlow_MileStonePage.png",
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
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/Trip_Tracks_MainPage.jpg",
        type: "js",
        code: `var express = require("express");
var router = express.Router();
const DBconn = require("../../utils/DBconn");

router.post("/", async (req, res) => {
  const { User_ID } = req.session;
  let conn;
  try {
    conn = await DBconn.getConnection();
    const selectAmbassPostsQuery = \`
      SELECT 
        CAST(Post.Post_ID AS CHAR) AS Post_ID, 
        Post.Post_Title, 
        Post.Post_Caption, 
        MIN(Post_Image.Image_Src) AS Image_Src,
        CAST(Post.User_ID AS CHAR) AS User_ID, 
        User_Info.Profile_Img, 
        User_Info.User_Rule,
        IFNULL(CAST(Post_Like.likeCount AS CHAR), '0') AS likeCount,
        IF(Post_Like_User.User_ID IS NOT NULL, 1, 0) AS isLike
      FROM Ambass_Save 
      LEFT JOIN Post ON Ambass_Save.Post_ID = Post.Post_ID 
      LEFT JOIN Post_Image ON Post.Post_ID = Post_Image.Post_ID 
      LEFT JOIN User_Info ON Post.User_ID = User_Info.User_ID
      LEFT JOIN (
        SELECT Post_ID, COUNT(*) AS likeCount 
        FROM Post_Like 
        GROUP BY Post_ID
      ) AS Post_Like ON Post.Post_ID = Post_Like.Post_ID
      LEFT JOIN (
        SELECT Post_ID, User_ID
        FROM Post_Like
        WHERE User_ID = ?
      ) AS Post_Like_User ON Post.Post_ID = Post_Like_User.Post_ID
      WHERE Ambass_Save.User_ID = ?
      AND User_Info.User_Rule = 1
      GROUP BY Post.Post_ID
      ORDER BY Post.Post_ID DESC 
      LIMIT 20
    \`;
    const posts = await conn.query(selectAmbassPostsQuery, [User_ID, User_ID]);

    for (let item of posts) {
      item.Profile_Img = "http://triptracks.co.kr/imgserver/" + item.Profile_Img;
      item.Image_Src = "http://triptracks.co.kr/imgserver/" + item.Image_Src;
      await conn.query(
        \`INSERT INTO Ambass_Info_Log (User_ID, Year, Month) 
        VALUES (?, YEAR(NOW()), MONTH(NOW())) 
        ON DUPLICATE KEY UPDATE View = View + 1;\`,
        [item.User_ID]
      );
      await conn.query(
        \`INSERT INTO Post_Log (Post_ID, Log_Date, User_ID, View)
        VALUES (?, CURDATE(), ?, 1)
        ON DUPLICATE KEY UPDATE View = View + 1;\`,
        [item.Post_ID, item.User_ID]
      );
    }
    return res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "내부 서버 오류가 발생했습니다." });
  } finally {
    if (conn) conn.end();
  }
});

module.exports = router;`,
        desc: `메인 홈페이지입니다.
사용자의 관심사와 엠버서더 활동을 반영한 최신 게시물 20개를 조회하는 기능을 구현했습니다.
다중 조인 시 발생할 수 있는 데이터 중복과 성능 저하를 방지하기 위해, 서브쿼리를 활용한 필터링과 GROUP BY를 전략적으로 배치하여 데이터의 무결성을 확보했습니다.
또한, 게시물 노출 시마다 실시간 로그를 기록하는 트랜잭션 구조를 설계하여 사용자 통계 데이터의 정확성을 높였습니다.`,
      },
      {
        name: "엠버서더_대시보드.js",
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/Trip_Tracks_dash.jpg",
        type: "js",
        code: `var express = require("express");
var router = express.Router();
const pool = require("../../utils/DBconn");

router.use("/", async (req, res, next) => {
  const { User_ID } = req.session;
  const { Post_ID } = req.body;
  if (!User_ID) return res.status(501).json({ success: false, msg: "로그인이 필요합니다." });
  let conn;
  try {
    conn = await pool.getConnection();
    let [User_Info] = await conn.query("SELECT User_Rule FROM User_Info WHERE User_ID=?", [User_ID]);
    if (!User_Info) return res.status(501).json({ success: false, msg: "사용자 정보를 찾을 수 없습니다." });
    if (User_Info.User_Rule !== 1) return res.status(501).json({ success: false, msg: "권한이 없습니다." });

    let [post] = await conn.query(\`
      SELECT P.Post_Caption, P.Post_Title, P.Post_Create_Timestamp, P.Post_Edit_Timestamp
      FROM Post P WHERE P.Post_ID = ?
    \`, [Post_ID]);

    let images = await conn.query("SELECT PI.Image_Src FROM Post_Image PI WHERE PI.Post_ID = ?", [Post_ID]);
    let comments = await conn.query(\`
      SELECT PC.User_ID AS Comment_User_ID, PC.Comment_Text, PC.Comment_Timestamp, UI.Profile_Img
      FROM Post_Comments PC LEFT JOIN User_Info UI ON PC.User_ID = UI.User_ID
      WHERE PC.Post_ID = ?
    \`, [Post_ID]);
    let likes = await conn.query(\`
      SELECT PL.User_ID AS Like_User_ID, UI.Profile_Img
      FROM Post_Like PL LEFT JOIN User_Info UI ON PL.User_ID = UI.User_ID
      WHERE PL.Post_ID = ?
    \`, [Post_ID]);
    let logs = await conn.query(\`
      SELECT PLG.User_ID AS Log_User_ID, PLG.Log_Date, PLG.Feed_Like, PLG.View, PLG.Detail_View, PLG.Comment
      FROM Post_Log PLG WHERE PLG.Post_ID = ?
    \`, [Post_ID]);

    const post_info = {
      ...post,
      Images: images.map(i => "http://triptracks.co.kr/imgserver/" + i.Image_Src),
      Comments: comments.map(c => ({
        User_ID: c.Comment_User_ID,
        Profile_Img: "http://triptracks.co.kr/imgserver/" + c.Profile_Img,
        Comment: c.Comment_Text,
        Timestamp: c.Comment_Timestamp,
      })),
      Likes: likes.map(l => ({
        User_ID: l.Like_User_ID,
        Profile_Img: "http://triptracks.co.kr/imgserver/" + l.Profile_Img,
      })),
      Logs: logs.map(log => ({
        User_ID: log.Log_User_ID,
        Date: log.Log_Date,
        Feed_Like: log.Feed_Like,
        View: log.View,
        Detail_View: log.Detail_View,
        Comment: log.Comment,
      })),
    };

    return res.status(200).json({ post_info });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "앰버서더 점수 설정 중 오류가 발생했습니다." });
  } finally {
    if (conn) conn.end();
  }
});

module.exports = router;`,
        desc: `엠버서더 권한을 가진 유저의 본인의 게시글 대시보드 화면입니다.
게시물 상세 페이지에 필요한 방대한 데이터(본문, 이미지, 댓글, 좋아요, 로그)를 조회하는 API를 구현했습니다.
단일 쿼리로 해결할 수 없는 파편화된 데이터들을 논리적으로 그룹화하여 서버 단에서 병합하는 로직을 구성했습니다.
특히, 반복적인 DB 커넥션 호출에 따른 성능 저하를 방지하기 위해 데이터베이스 트랜잭션 관리와 비동기 흐름을 정교하게 제어하여,
복합적인 데이터를 안정적으로 프론트엔드로 전달할 수 있도록 설계했습니다.`,
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
    "SQL Developer, IntelliJ, Eclipse, VSCode, Postman, pgAdmin, MySQL Workbench, Visual Studio, Team Foundation",
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

const getLangForHighlighter = (type) => {
  if (!type) return "javascript";
  const t = type.toLowerCase();
  if (t === "java") return "java";
  if (t === "sql") return "sql";
  if (t === "md" || t === "markdown") return "markdown";
  return "javascript";
};

export default function Portfolio() {
  const [viewMode, setViewMode] = useState(0);

  // ── 탭 시스템 상태 ─────────────────────────────────────────────────────────
  // openTabs: [{ projectTitle, file }]
  const [openTabs, setOpenTabs] = useState([
    { projectTitle: projects[0].title, file: projects[0].files[0] },
  ]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // ── 사이드바 폴더 열림/닫힘 ─────────────────────────────────────────────────
  const [openPkgs, setOpenPkgs] = useState({
    Sloway: true,
    "Task-Flow": true,
    "Trip-Tracks": true,
  });

  // ── 터미널 탭 ───────────────────────────────────────────────────────────────
  // "설명" | "회고" | "트러블슈팅"
  const [terminalTab, setTerminalTab] = useState("설명");

  // ── 드래그 리사이즈 ─────────────────────────────────────────────────────────
  // imgWidthPct: 이미지 패널이 전체 EditorArea에서 차지하는 % (0~100)
  const [imgWidthPct, setImgWidthPct] = useState(50);
  const isDragging = useRef(false);
  const editorAreaRef = useRef(null);

  // ── 타이핑 효과 (터미널 설명) ───────────────────────────────────────────────
  const [typedDesc, setTypedDesc] = useState("");

  // ── 두 번째 화면 목차 확장 ──────────────────────────────────────────────────
  const [expandedProject, setExpandedProject] = useState(null);

  // 현재 활성 탭 정보
  const activeTab = openTabs[activeTabIndex] ?? openTabs[0];
  const activeFile = activeTab?.file;
  const activeProject = activeTab?.projectTitle;

  // 터미널 콘텐츠 계산
  const getTerminalContent = () => {
    if (terminalTab === "설명") return activeFile?.desc || "설명이 없습니다.";
    const data = terminalData[activeProject];
    if (!data) return "해당 프로젝트의 데이터가 없습니다.";
    return data[terminalTab] || "내용이 없습니다.";
  };

  // 탭 열기 (이미 열려있으면 활성화만)
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
  }, []);

  // 탭 닫기
  const closeTab = useCallback((e, idx) => {
    e.stopPropagation();
    setOpenTabs((prev) => {
      if (prev.length === 1) return prev; // 마지막 탭은 닫지 않음
      const next = prev.filter((_, i) => i !== idx);
      setActiveTabIndex((cur) => {
        if (cur >= next.length) return next.length - 1;
        if (cur > idx) return cur - 1;
        return Math.min(cur, next.length - 1);
      });
      return next;
    });
  }, []);

  // 타이핑 효과
  useEffect(() => {
    if (viewMode !== 2) return;
    setTypedDesc("");
    let i = 0;
    const descText = getTerminalContent();
    const charStep = 5;
    const id = setInterval(() => {
      setTypedDesc(descText.slice(0, i));
      i += charStep;
      if (i > descText.length + charStep) {
        setTypedDesc(descText);
        clearInterval(id);
      }
    }, 10);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile, terminalTab, viewMode]);

  // ── 드래그 리사이즈 핸들러 ───────────────────────────────────────────────────
  const onDividerMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current || !editorAreaRef.current) return;
      const rect = editorAreaRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.min(Math.max((x / rect.width) * 100, 15), 85);
      setImgWidthPct(pct);
    };
    const onUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // ── 화면 1: 인트로 ──────────────────────────────────────────────────────────
  if (viewMode === 0) {
    return (
      <IntroScreen>
        <div className="content">
          <h1 className="title">Hello, I'm a Developer.</h1>
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

  // ── 화면 2: 프로필 + 목차 ───────────────────────────────────────────────────
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
            <div className="info-section">
              <h2 className="section-title">이력</h2>
              <div className="info-item">
                <span className="date">2025.07 - 2025.09</span>
                <div className="detail">
                  <div className="title">소프트넷 (계약직)</div>
                  <div className="desc">
                    솔루션 사업부 기술연구소 연구원 / 요구사항에 따른 유지보수
                    및 신규개발
                  </div>
                  <div className="desc">ERP, 병원MIS프로그램 개발</div>
                </div>
              </div>
            </div>
            <div className="info-section">
              <h2 className="section-title">학력</h2>
              <div className="info-item">
                <span className="date">2020.03 - 2025.02</span>
                <div className="detail">
                  <div className="title">부천대학교</div>
                  <div className="desc">컴퓨터 소프트웨어 학과</div>
                </div>
              </div>
            </div>
            <div className="info-section">
              <h2 className="section-title">자격증</h2>
              <div className="info-item">
                <span className="date">2026.06</span>
                <div className="detail">
                  <div className="title">정보처리산업기사(필기)</div>
                  <div className="desc">한국산업인력공단</div>
                </div>
              </div>
            </div>
            <div className="info-section">
              <h2 className="section-title">교육 수료</h2>
              <div className="info-item">
                <span className="date">2025.11 - 2026.06</span>
                <div className="detail">
                  <div className="title">
                    AWS 클라우드 기반 Devops 개발자 양성 과정
                  </div>
                  <div className="desc">KH정보교육원</div>
                </div>
              </div>
            </div>
          </div>
          <div className="info-section">
            <h2 className="section-title">기술 스택</h2>
            <div className="info-item">
              <div className="detail">
                <TechTable>
                  <tbody>
                    {Object.entries(techData).map(([category, skills]) => (
                      <tr key={category}>
                        <th>{category}</th>
                        <td>{skills}</td>
                      </tr>
                    ))}
                  </tbody>
                </TechTable>
              </div>
            </div>
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
                      <div
                        className="tech-stack-container"
                        style={{ marginTop: "15px" }}
                      >
                        <h4 style={{ color: "#569cd6", marginBottom: "8px" }}>
                          Tech Stack
                        </h4>
                        {Object.entries(p.techStack).map(([key, value]) => (
                          <div
                            key={key}
                            style={{ fontSize: "0.85rem", marginBottom: "4px" }}
                          >
                            <span
                              style={{ fontWeight: "bold", color: "#ce9178" }}
                            >
                              {key}:{" "}
                            </span>
                            <span style={{ color: "#d4d4d4" }}>{value}</span>
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

  // ── 화면 3: VSCode 워크스페이스 ─────────────────────────────────────────────
  const hasImage = !!activeFile?.img;

  return (
    <Layout>
      <GlobalStyle />

      {/* 타이틀 바 */}
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
        {/* 액티비티 바 */}
        <ActivityBar>
          <div className="icon active" title="Explorer">
            <VscFiles />
          </div>
          <div className="icon" title="Search">
            <VscSearch />
          </div>
          <div className="icon" title="Source Control">
            <VscSourceControl />
          </div>
          <div className="icon" title="Extensions">
            <VscExtensions />
          </div>
          <div className="spacer" />
          <div className="icon" title="Accounts">
            <VscAccount />
          </div>
          <div className="icon" title="Manage">
            <VscSettingsGear />
          </div>
        </ActivityBar>

        {/* 사이드바 */}
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

        <MainContainer>
          {/* 에디터 탭 바 */}
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
                  <span
                    className="f-close"
                    onClick={(e) => closeTab(e, idx)}
                    title="닫기"
                  >
                    <VscClose />
                  </span>
                </Tab>
              ))}
            </div>
            {/* 설명으로 돌아가기 버튼 */}
            <HeaderActions>
              <BackToInfoBtn
                onClick={() => setViewMode(1)}
                title="설명으로 돌아가기"
              >
                ← 설명으로 돌아가기
              </BackToInfoBtn>
            </HeaderActions>
          </EditorTabs>

          <Breadcrumb>
            <span>Portfolio Workspace</span> &gt; <span>{activeProject}</span>{" "}
            &gt; <span>{activeFile?.name}</span>
          </Breadcrumb>

          {/* 에디터 영역 (드래그 리사이즈) */}
          <EditorArea ref={editorAreaRef}>
            {hasImage && (
              <>
                <ImageSection style={{ width: `${imgWidthPct}%` }}>
                  <img src={activeFile.img} alt="preview" />
                </ImageSection>

                {/* 드래그 핸들 */}
                <DividerHandle onMouseDown={onDividerMouseDown}>
                  <div className="line" />
                  <div className="grip">⠿</div>
                  <div className="line" />
                </DividerHandle>

                <CodeSection style={{ flex: 1 }}>
                  <SyntaxHighlighter
                    language={getLangForHighlighter(activeFile?.type)}
                    style={vscDarkPlus}
                    showLineNumbers={true}
                    wrapLines={true}
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

            {!hasImage && (
              <CodeSection style={{ width: "100%" }}>
                <SyntaxHighlighter
                  language={getLangForHighlighter(activeFile?.type)}
                  style={vscDarkPlus}
                  showLineNumbers={true}
                  wrapLines={true}
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
          </EditorArea>

          {/* 터미널 영역 */}
          <ConsoleArea>
            <TerminalTabs>
              {/* 터미널 서브탭 */}
              <span
                className={
                  terminalTab === "설명" ? "active" : "inactive terminal-sub"
                }
                onClick={() => setTerminalTab("설명")}
              >
                <VscTerminal
                  style={{ verticalAlign: "middle", marginRight: "4px" }}
                />
                화면 설명
              </span>
              <span
                className={
                  terminalTab === "회고" ? "active" : "inactive terminal-sub"
                }
                onClick={() => setTerminalTab("회고")}
              >
                <VscMarkdown
                  style={{ verticalAlign: "middle", marginRight: "4px" }}
                />
                회고
              </span>
              <span
                className={
                  terminalTab === "트러블슈팅"
                    ? "active"
                    : "inactive terminal-sub"
                }
                onClick={() => setTerminalTab("트러블슈팅")}
              >
                <VscFile
                  style={{ verticalAlign: "middle", marginRight: "4px" }}
                />
                트러블슈팅
              </span>
            </TerminalTabs>
            <TerminalContent>
              {terminalTab === "설명" ? (
                <>
                  <div className="prompt">
                    <span className="path">portfolio@macbook</span>{" "}
                    <span className="colon">:</span>{" "}
                    <span className="dir">~/{activeProject}</span>$ ./explain.sh{" "}
                    {activeFile?.name}
                  </div>
                  <div className="output">
                    {typedDesc}
                    <span className="cursor">█</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="prompt">
                    <span className="path">portfolio@macbook</span>{" "}
                    <span className="colon">:</span>{" "}
                    <span className="dir">~/{activeProject}</span>$ cat{" "}
                    {terminalTab === "회고"
                      ? "RETROSPECTIVE.md"
                      : "TROUBLESHOOTING.md"}
                  </div>
                  <div className="output">
                    {typedDesc}
                    <span className="cursor">█</span>
                  </div>
                </>
              )}
            </TerminalContent>
          </ConsoleArea>
        </MainContainer>
      </AppCore>

      {/* 상태바 */}
      <StatusBar>
        <div className="left">
          <span className="item remote">{"><"}</span>
          <span className="item">
            <VscSourceControl
              style={{ verticalAlign: "middle", marginRight: "4px" }}
            />
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

// ─── 스타일 컴포넌트 ──────────────────────────────────────────────────────────

const IntroScreen = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background-color: #1e1e1e;
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
    text-shadow: 0 0 8px rgba(220, 178, 170, 0.3);
  }
  .guide-text {
    font-size: 0.9rem;
    color: #858585;
    margin-bottom: 40px;
    font-family: "Pretendard", "Malgun Gothic", sans-serif;
  }
  .next-btn {
    padding: 12px 24px;
    font-size: 1.1rem;
    background-color: #0e639c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s;
    &:hover {
      background-color: #1177bb;
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
  background-color: #1e1e1e;
  color: #cccccc;
  font-family: "Pretendard", "Malgun Gothic", sans-serif;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  width: 50%;
  padding: 40px 50px;
  background-color: #181818;
  border-right: 1px solid #333333;
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
      color: #ffffff;
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
    padding-bottom: 80px;
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
  background-color: #1e1e1e;
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
    transition: all 0.2s ease;
    &:hover {
      background: #2d2d2d;
      border-color: #569cd6;
    }
  }
  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
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
    background-color: #0e639c;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s;
    margin-bottom: 70px;
    &:hover {
      background-color: #1177bb;
    }
  }
`;

const TechTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: #1e1e1e;
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
    color: #cccccc;
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
  padding: 15px 20px 10px 20px;
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
    margin-left: auto;
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
  padding: 0 10px;
  background: #252526;
  flex-shrink: 0;
`;

const BackToInfoBtn = styled.button`
  background: transparent;
  color: #9cdcfe;
  border: 1px solid #3c3c3c;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 10px;
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
  position: relative;
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
  position: relative;
  z-index: 10;
  &:hover,
  &:active {
    background: #007acc44;
  }
  .line {
    width: 1px;
    height: 30%;
    background: #3c3c3c;
  }
  .grip {
    color: #555;
    font-size: 10px;
    line-height: 1;
    letter-spacing: -1px;
    user-select: none;
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

const ConsoleArea = styled.div`
  height: 280px;
  background: #1e1e1e;
  border-top: 1px solid #2b2b2b;
  display: flex;
  flex-direction: column;
`;

const TerminalTabs = styled.div`
  display: flex;
  padding: 0 20px;
  gap: 4px;
  border-bottom: 1px solid #2b2b2b;
  align-items: stretch;
  span {
    padding: 8px 12px;
    font-size: 11px;
    cursor: pointer;
    letter-spacing: 0.5px;
    font-family: "Segoe UI", sans-serif;
    display: flex;
    align-items: center;
    white-space: nowrap;
    &.active {
      color: #e7e7e7;
      border-bottom: 1px solid #e7e7e7;
    }
    &.inactive {
      color: #888;
      &:hover {
        color: #ccc;
      }
    }
    &.terminal-sub {
      border-radius: 3px 3px 0 0;
      &:hover {
        background: #2a2d2e;
        color: #ccc;
      }
    }
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
      color: #ccc;
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
  cursor: default;
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
